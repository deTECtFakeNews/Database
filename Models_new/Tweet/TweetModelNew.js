const TweetService = require("../../Services/Tweet/TweetService");
const TweetStatsModel = require('./TweetStatsModel');
const TweetRetweetArray = require('./TweetRetweetArray');
const { UserModel } = require("../User/UserModel");

class TweetModel {
    tweetID;
    authorID;
    inReplyToUserID;
    inReplyToTweetID;
    quotesTweetID;
    creationDate;
    fullText;
    language;
    placeLng;
    placeLat;
    placeDescription;
    
    latestStats;
    retweets;
    
    author;
    repliedUser;
    repliedTweet;
    quotedTweet;

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
        
        this.latestStats = new TweetStatsModel(data);
        this.retweets = new TweetRetweetArray(data);
        
        this.author = new UserModel(data?.authorID || {userID: this.authorID});
        this.repliedUser = new UserModel({userID: this.inReplyToUserID});
        this.repliedTweet = new TweetModel({tweetID: this.inReplyToTweetID});
        this.quotedTweet = new TweetModel({tweetID: this.quotesTweetID});
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

    isEmpty(){
        return this.authorID == -1 || this.authorID == undefined || this.fullText == undefined
    }

    async getFromDatabase(){
        if(this.tweetID == -1) return false;
        try{
            const [data] = await TweetService.read(this.tweetID);
            if(data==undefined) return false;
            Object.assign(this, new TweetModel(data));
            if(this.author.isEmpty()) this.author.getFromDatabase();
            if(this.repliedUser.isEmpty()) this.repliedUser.getFromDatabase();
            if(this.repliedTweet.isEmpty()) this.repliedTweet.getFromDatabase();
            if(this.quotedTweet.isEmpty()) this.quotedTweet.getFromDatabase();
        } catch(e){
            throw e;
        }
    }

    async getFromAPI(){
        if(this.tweetID == -1) return false;
        try{
            const data = await TweetService.fetchAPI(this.tweetID);
            if(data==undefined) return false;
            Object.assign(this, new TweetModel(data));
            if(this.author.isEmpty()) this.author.getFromAPI();
            if(this.repliedUser.isEmpty()) this.repliedUser.getFromAPI();
            if(this.repliedTweet.isEmpty()) this.repliedTweet.getFromAPI();
            if(this.quotedTweet.isEmpty()) this.quotedTweet.getFromAPI();
        } catch(e){
            throw e;
        }
    }

    async get(){
        if(this.userID == -1) return false;
        if(!this.isEmpty()) return true;
        try{
            if( await this.latestStats.getFromDatabase() && this.latestStats.length == 0 ){
                await this.getFromAPI();
            }
        } catch(e){
            throw e;
        }
    }
    
    async uploadToDatabase(){
        if(this.tweetID == -1 || this.isEmpty()) return false;
        console.group();
        try{
            // Get author
            if(this.author.isEmpty()) await this.author.get();
            await this.author.uploadToDatabase();
            // Get replied user
            if(this.repliedUser.isEmpty()) await this.repliedUser.get();
            await this.repliedUser.uploadToDatabase();
            // Get replied tweet
            if(this.repliedTweet.isEmpty()) await this.repliedTweet.get();
            await this.repliedTweet.uploadToDatabase();
            // Get quoted tweet
            if(this.quotedTweet.isEmpty()) await this.quotedTweet.get();
            await this.quotedTweet.uploadToDatabase();
            // Upload
            await TweetService.creationDate(this.getData());
            await this.latestStats.uploadToDatabase();
            console.log(`[Models/Tweet] Uploaded tweet ${this.tweetID} (${this.latestStats.last().retweetCount} retweets)`)
        } catch(e){
            console.error(e, this.tweetID)
        }
        console.groupEnd();
    }
}

module.exports = TweetModel;