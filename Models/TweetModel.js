const AnalysisService = require("../Services/AnalysisService");
const TweetService = require("../Services/TweetService");
const UserService = require("../Services/UserService");
const UserModel = require("./UserModel");

class TweetModel {
    static async _createTable(){
        return await TweetService.createTable();
    }
    static async readFromDatabase(query_params){
        try {
            let entries = await TweetService.readFromDatabase(query_params);
            return entries.map( e=> new TweetModel(e) );
        } catch (e) {
            console.error("[TweetModel] readFromDatabase error", e);
        }
    }
    static async getFromAPI(id) {
        try {
            let data = await TweetService.getFromAPI(id);
            return new TweetModel(data);
        } catch (e) {
            console.error("[TweetModel] getFromAPI error");
            return;
        }
    }
    constructor(tweet){
        this.tweetID = tweet.tweetID; 
        this.authorID = tweet.authorID; 
        this.inReplyToUserID = tweet.inReplyToUserID || -1; 
        this.inReplyToTweetID = tweet.inReplyToTweetID || -1; 
        this.quotesTweetID = tweet.quotesTweetID || -1; 
        this.creationDate = new Date(tweet.creationDate); 
        this.fullText = tweet.fullText; 
        this.language = tweet.language; 
        this._TweetStatsFreeze = new TweetModel.TweetStatsFreeze(tweet);
    }
    getData(){
        return {
            tweetID: this.tweetID, 
            authorID: this.authorID, 
            inReplyToUserID: this.inReplyToUserID, 
            inReplyToTweetID: this.inReplyToTweetID, 
            quotesTweetID: this.quotesTweetID, 
            creationDate: this.creationDate, 
            fullText: this.fullText, 
        }
    }
    getStats(){
        return this._TweetStatsFreeze.getData();
    }
    async analyze(){
        let analysis = {}
        try{
            analysis['sentiment'] = await AnalysisService.getSentiment(this.fullText)
            // analysis['sentiment'] = "Hi"
        } catch {
            analysis['error'] = "error"
        }
        return analysis;
    }
    async getEmbed(){
        try{
            return await TweetService.getCard(this.tweetID);
        } catch (e) {
            return "404"
        }
    }
    async getAuthor(){
        // let user = await UserService.readFromDatabase({userID: this.authorID})
        let user = await UserService.getFromAPI(this.authorID);
        return new UserModel(user);
    }
    async getRepliedUser(){
        let user;
        if(this.inReplyToUserID == -1){
            user = await UserService.readFromDatabase({'User.userID': this.replyToUserID})
        } else {
            user = await UserService.getFromAPI(this.inReplyToUserID);
        }
        return new UserModel(user);
    }
    async getRepliedTweet(){
        let tweet;
        if(this.inReplyToTweetID == -1){
            tweet = await TweetService.readFromDatabase({'Tweet.tweetID': this.tweetID});
        } else {
            tweet = await TweetService.getFromAPI(this.inReplyToTweetID);
        }
        return new TweetModel(tweet)
    }
    async getQuotedTweet(){
        let tweet;
        if(this.quotesTweetID == -1){
            tweet = await TweetService.readFromDatabase({'Tweet.tweetID': this.tweetID});
        } else {
            tweet = await TweetService.getFromAPI(this.inReplyToTweetID);
        }
        return new TweetModel(tweet);
    }

    async insertToDatabase(){
        await (await this.getAuthor()).insertToDatabase();
        // if(this.inReplyToUserID != 1) await (await this.getRepliedUser()).insertToDatabase();
        // if(this.inReplyToTweetID != 1) await (await this.getRepliedTweet()).insertToDatabase();
        // if(this.quotesTweetID != 1) await (await this.getQuotedTweet()).insertToDatabase();

        await TweetService.insertToDatabase(this.getData());
        await TweetService.TweetStatsFreeze.insertToDatabase(this.getStats());

    }

    async updateToDatabase(){
        return await TweetService.TweetStatsFreeze.updateToDatabase(this.tweetID, this.getStats())
    }

    async deleteFromDatabase(){
        return await TweetService.deleteFromDatabase();
    }

}

TweetModel.TweetStatsFreeze = class{
    static async _createTable(){
        return await TweetService.TweetStatsFreeze.createTable();
    } 
    constructor(tweet){
        this.tweetID = tweet.tweetID;
        this.updateDate = new Date(); 
        this.retweetCount = tweet.retweetCount; 
        this.favoriteCount = tweet.favoriteCount; 
        this.replyCount = tweet.replyCount;
    }
    getData(){
        return {
            tweetID: this.tweetID,
            updateDate: this.updateDate,
            retweetCount: this.retweetCount,
            favoriteCount: this.favoriteCount,
            replyCount: this.replyCount,
        }
    }
    async insertToDatabase(){
        return await TweetService.TweetStatsFreeze.insertToDatabase(this.getData());
    }
    async updateToDatabase(){
        return await TweetService.TweetStatsFreeze.updateToDatabase(this.tweetID, this.getData());
    }
}

TweetModel.TweetAnalysis = class {
    constructor(tweet){
        this.tweetID = tweet.tweetID;
        this.fullText = tweet.fullText;
    }
}


module.exports = TweetModel;