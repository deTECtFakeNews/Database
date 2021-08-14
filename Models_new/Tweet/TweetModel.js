const TweetService = require("../../Services/Tweet/TweetService");
const TweetStatsModel = require('./TweetStatsModel');
const TweetRetweetArray = require('./TweetRetweetArray');
const UserModel = require("../User/UserModel");
const e = require("express");

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
    
    /**@type {UserModel} */
    author;
    /**@type {UserModel} */
    repliedUser;
    /**@type {TweetModel} */
    repliedTweet;
    /**@type {TweetModel} */
    quotedTweet;

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
        if(this.tweetID!=-1){
            this.author = new UserModel(data?.author || {userID: this.authorID});
            this.repliedUser = new UserModel({userID: this.inReplyToUserID});
            this.repliedTweet = new TweetModel({tweetID: this.inReplyToTweetID});
            this.quotedTweet = new TweetModel({tweetID: this.quotesTweetID});
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
        // if(!this.isEmpty()) return true;
        try{
            await this.getFromDatabase();
            if(this.latestStats.last() == undefined) await this.getFromAPI()
        } catch(e){
            throw e;
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
            console.log(`[Models/Tweet] Uploaded tweet ${this.tweetID} (${this.latestStats.last()?.retweetCount} retweets)`)
        } catch(e) {error = e}
        console.groupEnd();
        if(error) throw error;
    }
}

module.exports = TweetModel;