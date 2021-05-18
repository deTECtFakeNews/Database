const UserModel = require("../User/UserModel");
const TweetEntitiesModel = require("./TweetEntitiesModel");
const TweetStatsModel = require("./TweetStatsModel");
// const TweetRetweetModel = require("./TweetRetweetModel");
const TweetService = require("../../Services/Tweet/TweetService");
const {TweetRetweetService} = TweetService;
class TweetModel{
    /**@type {String} Id of Tweet in Twitter and Database */
    tweetID;
    /**@type {String} Id of User author in Twitter and Database */
    authorID;
    /**@type {String} Id of User this Tweet replies to */
    inReplyToUserID;
    /**@type {String} Id of Tweet this Tweet replies to */
    inReplyToTweetID;
    /**@type {String} Id of Tweet this Tweet quotes */
    quotesTweetID;
    /**@type {Date} Date of publication */
    creationDate;
    /**@type {String} Full content */
    fullText;
    /**@type {String} __Detected__ language of the content */
    language;
    /**@type {Number} Longitude coordinate of location */
    placeLng;
    /**@type {Number} Latitude coordinate of location */
    placeLat;
    /**@type {String} Description of location */
    placeDescription;
    
    /**@type {UserModel} */
    author;
    /**@type {TweetModel} */
    repliedTweet;
    /**@type {UserModel} */
    repliedUser;
    /**@type {TweetModel} */
    quotedTweet;

    stats;
    retweets;
    entities;

    _isRetweet;

    shouldUploadRetweets = false;
    /**
     * Creates a new object for managing Tweet
     * @param {import("../../Services/Tweet/TweetService").TweetJSONExtended} tweet Data to load into object
     */
    constructor(tweet){
        this.tweetID = tweet.tweetID;
        this.authorID = tweet.authorID || -1;
        this.inReplyToUserID = tweet.inReplyToUserID || -1;
        this.inReplyToTweetID = tweet.inReplyToTweetID || -1;
        this.quotesTweetID = tweet.quotesTweetID || -1;
        this.creationDate = tweet.creationDate;
        this.fullText = tweet.fullText;
        this.language = tweet.language;
        this.placeLng = tweet.placeLng;
        this.placeLat = tweet.placeLat;
        this.placeDescription = tweet.placeDescription;
        this.author = new UserModel(tweet.author || {userID: this.authorID});
        this.repliedTweet = this.tweetID != -1 ? new TweetModel({tweetID: this.inReplyToTweetID}) : null;
        this.repliedUser = new UserModel({userID: this.inReplyToUserID});
        this.quotedTweet = this.tweetID != -1 ? new TweetModel({tweetID: this.quotesTweetID}) : null;

        this.stats = new TweetStatsModel(tweet.latestStats || {tweetID: this.tweetID});
        this.retweets = new TweetRetweetModel({tweetID: this.tweetID});
        this.entities = new TweetEntitiesModel({tweetID: this.tweetID, fullText: this.fullText});
    }

    toJSON(){
        return {
            tweetID: this.tweetID, 
            authorID: this.authorID, 
            inReplyToUserID: this.inReplyToUserID,
            quotesTweetID: this.quotesTweetID, 
            creationDate: this.creationDate, 
            fullText: this.fullText, 
            // language: this.language, 
            placeLng: this.placeLng,
            placeLat: this.placeLat,
            placeDescription: this.placeDescription
        }
    }

    async readSelf(){
        if(this.tweetID == -1) return;
        let tweetJSON = (await TweetService.read(this.tweetID))[0];
        if(tweetJSON == undefined) throw 'No results';
        this.authorID = tweetJSON.authorID || -1;
        this.inReplyToUserID = tweetJSON.inReplyToUserID || -1;
        this.inReplyToTweetID = tweetJSON.inReplyToTweetID || -1;
        this.quotesTweetID = tweetJSON.quotesTweetID || -1;
        this.creationDate = tweetJSON.creationDate;
        this.fullText = tweetJSON.fullText;
        this.language = tweetJSON.language;
        this.placeLng = tweetJSON.placeLng;
        this.placeLat = tweetJSON.placeLat;
        this.placeDescription = tweetJSON.placeDescription;

        this.entities = new TweetEntitiesModel({tweetID: this.tweetID, fullText: this.fullText});
    }

    async fetchSelfFromAPI(){
        if(this.tweetID == -1) return;
        let tweetJSON = await TweetService.fetchAPI(this.tweetID);
        this.authorID = tweetJSON.authorID || -1;
        this.inReplyToUserID = tweetJSON.inReplyToUserID || -1;
        this.inReplyToTweetID = tweetJSON.inReplyToTweetID || -1;
        this.quotesTweetID = tweetJSON.quotesTweetID || -1;
        this.creationDate = tweetJSON.creationDate;
        this.fullText = tweetJSON.fullText;
        this.language = tweetJSON.language;
        this.placeLng = tweetJSON.placeLng;
        this.placeLat = tweetJSON.placeLat;
        this.placeDescription = tweetJSON.placeDescription;

        this.author = new UserModel(tweetJSON.author);

        this.stats = new TweetStatsModel(tweetJSON.latestStats);
        this.entities = new TweetEntitiesModel({tweetID: this.tweetID, fullText: this.fullText});
    }

    async getSelf(){
        try{
            await this.readSelf();
        } catch(e){
            try{
                await this.fetchSelfFromAPI();
            } catch(ee){
                throw ee;
            }
        }
    }

    async getAuthor(){
        // if(this.tweetID == -1 || this.authorID == -1) return this.author;
        try{
            await this.author.getSelf();
        } catch(e){
            throw e;
        }
    }

    async read(){
        if(this.tweetID == -1) return;
        try{
            await this.stats.read();
            await this.retweets.read();
            await this.entities.read();
        } catch(e){
            throw e;
        }
    }

    async fetchAPI(){
        if(this.tweetID == -1) return;
        try{
            await this.stats.fetchFromAPI();
            await this.retweets.fetchFromAPI();
            await this.entities.fetchFromAPI();
        } catch(e){
            throw e;
        }
    }

    async upload({uploadRetweets = true, uploadFollowers = true} = {}){
        if(this.tweetID == -1) return;
        try{
            // Author
            await this.author.getSelf();
            await this.author.upload({uploadFollowers});
            // In reply to tweetID
            await this.repliedTweet.getSelf();
            await this.repliedTweet.upload({uploadRetweets});
            // Quotes
            await this.quotedTweet.getSelf();
            await this.quotedTweet.upload({uploadRetweets});
            // In reply to userID
            if(this.inReplyToUserID != this.authorID && this.inReplyToUserID != this.repliedTweet.authorID){
                await this.repliedUser.getSelf();
                await this.repliedUser.upload({uploadFollowers});
            }
            // Create tweet
            await TweetService.create(this.toJSON());
            // Upload stats and entities
            // await this.stats.read();
            await this.stats.readSelf();
            await this.stats.upload();
            console.log(`uploaded Tweet ${this.tweetID} ${this.fullText.substr(0, 20)}...  (author ${this.authorID}, retweets: ${this.stats.latestStats.retweetCount})`)
            if(this.stats.latestStats?.retweetCount >= 20 && uploadRetweets) {
                // console.log('Uploading rts');
                await this.retweets.read();
                if(this.retweets.savedRetweets.length==0){
                    await this.retweets.fetchFromAPI();
                    await this.retweets.upload();
                }
            }
            await this.entities.upload();
        } catch(e){
            console.log('Perdoname pero no', e)
            throw e;
        }
    }
}


class TweetRetweetModel{
    /**@type {String} */
    tweetID;
    /**@type {Array<TweetModel>} */
    latestRetweets = [];
    /**@type {Array<TweetModel>} */
    savedRetweets;
    constructor({tweetID}){
        this.tweetID = tweetID;
    }
    async fetchFromAPI(){
        if(this.tweetID == -1) return;
        try{
            this.latestRetweets = (await TweetRetweetService.fetchAPI(this.tweetID))
                .map(t => new TweetModel(t))
            return this.latestRetweets;
        } catch(e){
            console.log('Could not fetch retweets', e);
            throw e;
        }
    }
    async read(){
        if(this.tweetID == -1) return;
        try{
            this.savedRetweets = (await TweetRetweetService.read(this.tweetID))
                .map(t=> {
                    let tweet = new TweetModel(t);
                    tweet._isRetweet = true;
                    return tweet;
                });
            return this.savedRetweets;
        } catch(e){

        }
    }
    async upload(){
        if(this.tweetID == -1) return;
        console.log(`Uploading ${this.latestRetweets.length} rts`)
        for(let retweet of this.latestRetweets){
            try{
                // console.log(retweet.author)
                // console.log(retweet.authorID)
                await retweet.author.upload({uploadFollowers: false});
                // console.log('uploadded user')
                await TweetRetweetService.create({authorID: retweet.authorID, creationDate: retweet.creationDate, tweetID: this.tweetID});
                console.log(`Uploaded rt by ${retweet.authorID}`)
            } catch(e){
                console.log('Error uploading retweets', e);
            }
	    }
    }
    
}

module.exports = TweetModel;
