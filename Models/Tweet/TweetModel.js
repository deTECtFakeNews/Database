const TweetService = require("../../Services/Tweet/TweetService");
const TweetStatsModel = require('./TweetStatsModel');
const TweetRetweetArray = require('./TweetRetweetArrayNew');
const UserModel = require("../User/UserModel");
const MemoryModel = require("../MemoryModel");
const {TweetEntitiesModel} = require("./TweetEntitiesModel");
// TweetEntitiesModel
class TweetModel {
    /**@type {String} */
    tweetID;
    /**@type {String} */
    authorID;
    /**@type {String} */
    inReplyToUserID;
    /**@type {String} */
    inReplyToTweetID;
    /**@type {String} */
    quotesTweetID;
    /**@type {Date} */
    creationDate;
    /**@type {String} */
    fullText;
    /**@type {String} */
    language;
    /**@type {Number} */
    placeLng;
    /**@type {Number} */
    placeLat;
    /**@type {String} */
    placeDescription;
    
    /**@type {TweetStatsModel} */
    latestStats;
    /**@type {TweetRetweetArray} */
    retweets;
    /**@type {TweetEntitiesModel} */
    entities;
    /**@type {UserModel} */
    author;
    /**@type {UserModel} */
    repliedUser;
    /**@type {TweetModel} */
    repliedTweet;
    /**@type {TweetModel} */
    quotedTweet;
    /**@type {MemoryModel} */
    _memory;
    /**
     * @constructor
     * @param {import("../../Services/Tweet/TweetService").TweetJSON} data Data
     */
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.authorID = data?.authorID || -1;
        this.inReplyToUserID = data?.inReplyToUserID || -1;
        this.inReplyToTweetID = data?.inReplyToTweetID || -1;
        this.quotesTweetID = data?.quotesTweetID || -1;
        this.creationDate = data?.creationDate;
        this.fullText = data?.fullText;
        this.language = data?.language;
        this.placeLng = data?.placeLng;
        this.placeLat = data?.placeLat;
        this.placeDescription = data?.placeDescription;
        
        this.latestStats = new TweetStatsModel({tweetID: this.tweetID, ...data?.latestStats});
        this.retweets = new TweetRetweetArray(data);
        this.entities = new TweetEntitiesModel({tweetID: this.tweetID, fullText: this.fullText})

        this._memory = new MemoryModel();
        this._memory.addTweet(this);
        if(this.tweetID!=-1){
            this.author = new UserModel(data?.author || {userID: this.authorID});
            this.repliedUser = new UserModel({userID: this.inReplyToUserID});
            this.repliedTweet = new TweetModel({tweetID: this.inReplyToTweetID});
            this.quotedTweet = new TweetModel({tweetID: this.quotesTweetID});
            this.author._memory = this._memory.addUser(this.author);
            this.repliedUser._memory = this._memory.addUser(this.repliedUser);
            this.repliedTweet._memory = this._memory.addTweet(this.repliedTweet);
            this.quotedTweet._memory = this._memory.addTweet(this.quotedTweet);
        }
    }
    /**
     * Get data in JSON format
     * @returns {import("../../Services/Tweet/TweetService").TweetJSON}
     */
    getJSON(){
        return {
            tweetID: this.tweetID.toString(),
            authorID: this.authorID.toString(),
            inReplyToUserID: this.inReplyToUserID.toString(),
            inReplyToTweetID: this.inReplyToTweetID.toString(),
            quotesTweetID: this.quotesTweetID.toString(),
            creationDate: this.creationDate,
            fullText: this.fullText,
            placeLng: this.placeLng,
            placeLat: this.placeLat,
            placeDescription: this.placeDescription
        }
    }
    /**
     * Return true if required fields are empty
     * @returns {Boolean}
     */
    isEmpty(){
        return this.fullText = undefined || this.authorID == -1;
    }
    /**
     * Get data from database and assign to self
     * @returns {Promise<void>}
     */
    async getFromDatabase(){
        if(this.tweetID == -1) return false;
        try{
            const [data] = await TweetService.read(this.tweetID);
            if(data==undefined) return false;
            Object.assign(this, new TweetModel(data));
        } catch(e){
            throw e;
        }
    }
    /**
     * Get data from API and assign to self
     * @returns {Promise<void>}
     */
    async getFromAPI(){
        if(this.tweetID == -1) return false;
        try{
            const data = await TweetService.fetchAPI(this.tweetID);
            if(data==undefined) return false;
            Object.assign(this, new TweetModel(data));
        } catch(e){
            // If service error, then user is unavailable.
            // Set empty values and push error
            if( TweetStatsModel.errorCodes[ e?.[0]?.code ] != undefined ){
                this.authorID = -1;
                this.fullText = ' ';
                this.latestStats.pushError( e?.[0]?.code )
            }
        }
    }
    /**
     * Get from database or API
     * @returns {Promise<void>}
     */
    async get(){
        if(this.userID == -1) return false;
        if(this._memory.tweets[this.tweetID]?.latestStats?.last() != undefined){
            Object.assign(this, this._memory.tweets[this.tweetID]);
            return
        }
        try{
            await this.getFromDatabase();
            if(this.latestStats.last() == undefined) await this.getFromAPI()
            this._memory.tweets[this.tweetID] = this;
        } catch(e){
            throw e;
        }
    }
    /**
     * Gets from database or API
     * @param {{tweets: Set, users: Set}} mem
     */
    async getRecursive(mem){
        if(this.tweetID == -1) return;
        try{
            await this.getFromDatabase();
            mem?.tweets?.add?.(this);
            await this.author.getFromDatabase();
            mem?.users?.add?.(this.author);
            await this.repliedUser.getFromDatabase();
            mem?.users?.add?.(this.repliedUser);
            await this.repliedTweet.getRecursive(mem);
            await this.quotedTweet.getRecursive(mem);
        } catch(e){

        }
    }

    /**
     * Upload user data to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.tweetID == -1) return false;
        let error = undefined;
        console.group();
        try{
            // Get data if empty
            if(this.isEmpty()) await this.get();
            // Get author
            await this.author.uploadToDatabase();
            // Get replied user
            await this.repliedUser.uploadToDatabase();
            // Get replied tweet
            await this.repliedTweet.uploadToDatabase();
            // Get quoted tweet
            await this.quotedTweet.uploadToDatabase();
            // Upload
            await TweetService.create(this.getJSON());
            // Upload stats
            await this.latestStats.uploadToDatabase();
            // Upload entities
            await this.entities.uploadToDatabase();
            console.log(`[Models/Tweet] Uploaded tweet ${this.tweetID} (${this.latestStats.last()?.retweetCount} retweets)`)
        } catch(e) {error = e}
        console.groupEnd();
        if(error) throw error;
    }
}

module.exports = TweetModel;