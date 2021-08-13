const Connection = require("../../Data");
const TweetService = require("../../Services/Tweet/TweetService");
const { UserModel } = require("../User/UserModel");
// UserModel

class TweetStatsModel {
    /**@type {String} Unique identifier of tweet in Twitter and Database */
    tweetID;
    /**@type {Date} Date these stats were retrieved */
    updateDate;
    /**@type {Number} Number of retweets */
    retweetCount;
    /**@type {Number} Number of likes */
    favoriteCount;
    /**@type {Number} Number of replies (note. API v1 returns null) */
    replyCount;
    /**@type {String} Status of account (i.e., active, suspended or removed) */
    status;
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.updateDate = data?.updateDate;
        this.retweetCount = data?.retweetCount;
        this.favoriteCount = data?.favoriteCount;
        this.replyCount = data?.replyCount;
        this.status = data?.status;
    }
    getData(){
        return {
            tweetID: this.tweetID,
            updateDate: this.updateDate,
            retweetCount: this.retweetCount,
            favoriteCount: this.favoriteCount,
            replyCount: this.replyCount,
            status: this.status
        }
    }
}

class TweetStatsArray extends Array {
    #tweetID;
    #shouldUpload;
    constructor(data){
        super();
        this.#tweetID = data?.tweetID || -1;
        this.push( new TweetStatsModel(data) );
    }
    push(data){
        this.#shouldUpload = true;
        super.push(new TweetStatsModel(data));
    }
    last(){
        return this[this.length-1];
    }
    async getFromDatabase(){
        if(this.#tweetID == -1) return false;
        // Avoid updating existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        try{
            for(let stats of await TweetService.TweetStatsService.read(this.#tweetID)){
                super.push( new TweetStatsModel(stats) )
            }
        } catch(e){
            return false;
        }
        if(this.length == 0) return false;
    }
    async uploadToDatabase(){
        if(this.#tweetID == -1) return false;
        // if(this.#shouldUpload == false) return false;
        // Upload only latest
        const latest = this.last();
        try{
            await TweetService.TweetStatsService.create(latest.getData())
        } catch(e){
            console.log(e)
        }
    }
}

class TweetRetweetModel {
    /**@type {String} Id of original tweet */
    tweetID;
    /**@type {String} Id of user who retweeted */
    authorID;
    /**@type {Date} Date of retweet */
    creationDate;
    /**@type {UserModel} User who made the retweet */
    user;
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.authorID = data?.authorID || -1;
        this.creationDate = data.creationDate;
        this.user = new UserModel(data?.author);
    }
    getData(){
        return {
            tweetID: this.tweetID, 
            authorID: this.authorID, 
            creationDate: this.creationDate
        }
    }
    async uploadToDatabase(){
        if(this.tweetID == -1) return false;
        try{
            // Upload user who made the retweet 
            await this.user.uploadToDatabase();
            // Upload relationship
            await TweetService.TweetRetweetService.create(this.getData());
        } catch(e){
            throw e;
        }
    }
    async uploadToDatabaseComplete(){
        if(this.tweetID == -1) return false;
        try{
            // Upload user who made the retweet
            await this.user.uploadToDatabaseComplete();
            // Upload relationship
            await TweetService.TweetRetweetService.create(this.getData());
        } catch(e){
            throw e;
        }
    }
}

class TweetRetweetArray extends Array{
    #tweetID;
    #shouldUpload;
    constructor(data){
        super();
        this.#tweetID = data?.tweetID || -1;
        this.push( data )
    }
    push(data){
        this.#shouldUpload = true;
        super.push(new TweetRetweetModel(data))
    }
    last(){
        return this[this.length-1];
    }
    async getFromDatabase(){
        if(this.#tweetID == -1) return false;
        // Avoid updating existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Get from database
        await TweetService.TweetRetweetService.stream(this.#tweetID, {
            onResult: rt => {
                super.push( new TweetRetweetModel(stats) )
            }, 
            onError: e => {throw e}
        })
    }
    async getFromAPI(){
        if(this.#tweetID == -1) return false;
        // Allow to upload
        this.#shouldUpload = true;
        // Empty
        this.length = 0;
        // Get from api
        const retweets = await TweetService.TweetRetweetService.fetchAPI(this.#tweetID);
        for(let retweet of retweets){
            this.push(retweet)
        }
    }
    async uploadToDatabase(){
        if(this.#tweetID == -1) return false;
        if(this.#shouldUpload == false) return false;
        for(let i = 0; i<this.length; i++){
            try{
                await this[i].uploadToDatabase();
            } catch(e){
                console.log(e)
            }
        }
    }
    async uploadToDatabaseComplete(){
        if(this.#tweetID == -1) return false;
        if(this.#shouldUpload == false) return false;
        for(let i = 0; i<this.length; i++){
            try{
                await this[i].uploadToDatabaseComplete();
            } catch(e){
                console.log(e)
            }
        }
    }
}

class TweetModel {
    /**@type {String} Unique identifier of tweet in Twitter and Database */
    tweetID;
    /**@type {String} Id of user who authored the tweet */
    authorID;
    /**@type {String} Id of user this tweet replies to */
    inReplyToUserID;
    /**@type {String} Id of tweet this tweet replies to */
    inReplyToTweetID;
    /**@type {String} Id of tweet this tweet quotes */
    quotesTweetID;
    /**@type {Date} Date and time this tweet was published */
    creationDate;
    /**@type {String} Full text containing tweet's body */
    fullText;
    /**@type {String} Detected language of this tweet */
    language;
    /**@type {Number} Longitude of tweet location */
    placeLng;
    /**@type {Number} Latitude of tweet location */
    placeLat;
    /**@type {String} Description of tweet location */
    placeDescription;
    /**@type {TweetStatsArray} */
    latestStats;
    /**@type {TweetRetweetArray} */
    retweets;
    /**@type {UserModel} */
    author;
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.authorID = data?.authorID;
        this.inReplyToUserID = data?.inReplyToUserID || -1;
        this.inReplyToTweetID = data?.inReplyToTweetID || -1;
        this.quotesTweetID = data?.quotesTweetID || -1;
        this.creationDate = data?.creationDate;
        this.fullText = data?.fullText;
        this.language = data?.language;
        this.placeLng = data?.placeLng;
        this.placeLat = data?.placeLat;
        this.placeDescription = data?.placeDescription;
        
        this.latestStats = new TweetStatsArray({tweetID: data?.tweetID, ...data?.latestStats});
        this.retweets = new TweetRetweetArray(data);
        this.author = new UserModel(data?.author || {userID: this.authorID})
    }
    getData(){
        return {
            tweetID: this.tweetID.toString(),
            authorID: this.authorID.toString(),
            inReplyToUserID: this.inReplyToUserID.toString(),
            inReplyToTweetID: this.inReplyToTweetID.toString(),
            quotesTweetID: this.quotesTweetID.toString(),
            creationDate: this.creationDate,
            fullText: this.fullText,
            // language: this.language,
            placeLng: this.placeLng,
            placeLat: this.placeLat,
            placeDescription: this.placeDescription
        }
    }
    async getFromDatabase(){
        if(this.tweetID == -1) return false;
        try{
            const [data] = await TweetService.read(this.tweetID);
            this.authorID = data?.authorID;
            this.inReplyToUserID = data?.inReplyToUserID || -1;
            this.inReplyToTweetID = data?.inReplyToTweetID || -1;
            this.quotesTweetID = data?.quotesTweetID || -1;
            this.creationDate = data?.creationDate;
            this.fullText = data?.fullText;
            this.language = data?.language;
            this.placeLng = data?.placeLng;
            this.placeLat = data?.placeLat;
            this.placeDescription = data?.placeDescription;
        } catch(e){
            throw e;
        }
    }
    async getFromAPI(){
        if(this.tweetID == -1) return false;
        try{
            const data = await TweetService.fetchAPI(this.tweetID);
            if(data==undefined) return false;
            this.authorID = data?.authorID;
            this.inReplyToUserID = data?.inReplyToUserID || -1;
            this.inReplyToTweetID = data?.inReplyToTweetID || -1;
            this.quotesTweetID = data?.quotesTweetID || -1;
            this.creationDate = data?.creationDate;
            this.fullText = data?.fullText;
            this.language = data?.language;
            this.placeLng = data?.placeLng;
            this.placeLat = data?.placeLat;
            this.placeDescription = data?.placeDescription;
            this.latestStats.push(data?.latestStats)
            this.author = new UserModel(data?.author)
        } catch(e){
            throw e;
        }
    }
    async get(){
        if(this.tweetID == -1) return false;
        try{
            if( await this.latestStats.getFromDatabase() == false ){
                await this.getFromAPI();
            }
        } catch(e){
            throw e;
        }
    }
    async uploadToDatabase(){
        if(this.tweetID == -1 || this.authorID == -1 || this.authorID == undefined || this.fullText == undefined) return false;
        console.group()
        try{ 
            // Get author
            const author = new UserModel({userID: this.authorID});
            await author.get();
            await author.uploadToDatabase();
            // Get replied user
            const repliedUser = new UserModel({userID: this.inReplyToUserID});
            await repliedUser.get();
            await repliedUser.uploadToDatabase();
            // Get replied tweet
            const repliedTweet = new TweetModel({tweetID: this.inReplyToTweetID});
            await repliedTweet.get();
            await repliedTweet.uploadToDatabase();
            // Get quoted tweet
            const quotedTweet = new TweetModel({tweetID: this.quotesTweetID});
            await quotedTweet.get();
            await quotedTweet.uploadToDatabase();
            // Het self
            await TweetService.create(this.getData());
            await this.latestStats.uploadToDatabase();
            // if(quotedTweet.tweetID != -1) console.log( quotedTweet.latestStats.last() )
            console.log(`[Models/Tweet] Uploaded tweet ${this.tweetID} (${this.latestStats.last().retweetCount} retweets)`)
        } catch(e){
            console.error(e, this.tweetID)
            // throw e;
        }
        console.groupEnd();
    }
}
module.exports = {TweetModel, TweetStatsModel, TweetStatsArray, TweetRetweetModel, TweetRetweetArray}
