const AnalysisService = require("../Services/AnalysisService");
const TweetService = require("../Services/TweetService");
const UserService = require("../Services/UserService");
const UserModel = require("./UserModel");

class TweetModel {
    /**
     * Create Tweet table in database
     */
    static async createTable(){
        return await TweetService.createTable();
    }
    /**
     * Search for Tweets in database
     * @param {Object|Number|String} query_params Parameters to exectute search in database
     * @returns {Promise<Array<TweetModel>>}
     */
    static async read(query_params){
        try {
            let entries = await TweetService.read(query_params);
            return entries.map( e=> new TweetModel(e) );
        } catch (e) {
            console.error("[TweetModel] readFromDatabase error");
            return;
        }
    }
    /**
     * Search for Tweets in API
     * @param {Number|String} id Id of tweet
     * @returns {Promise<TweetModel>}
     */
    static async getFromAPI(id) {
        try {
            let data = await TweetService.fetchAPI(id);
            return new TweetModel(data);
        } catch (e) {
            console.error("[TweetModel] getFromAPI error");
            return;
        }
    }
    /**
     * Creates a new TweetModel object with methods for executing several services
     * @constructor
     * @param {import("../Services/TweetService").TweetService_data} tweet Data of tweet in TweetService_Data format
     */
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
        // this._TweetAnalysis = new TweetModel.TweetAnalysis(tweet)
    }
    /**
     * Returns tweet data in TweetService_Data format
     * @returns {import("../Services/TweetService").TweetService_data}
     */
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
    /**
     * Returns HTML of Tweet
     */
    async getEmbed(){
        try{
            return await TweetService.getCardAPI(this.tweetID);
        } catch (e) {
            return "404"
        }
    }

    /**
     * Return UserModel of tweet author
     * @returns {Promise<UserModel>}
     */
    async getAuthor(){
        try{
            let user = await UserService.fetchAPI(this.authorID);
            return new UserModel(user);
        } catch(e){

        }
    }
    /**
     * Return UserModel of user tweet is replying to
     * @returns {Promise<UserModel>}
     */
    async getRepliedUser(){
        try{
            let user;
            // If empty
            if(this.inReplyToUserID == -1){
                user = await UserService.read(this.inReplyToUserID)
            // Else, search in API
            } else {
                user = await UserService.fetchAPI(this.inReplyToUserID);
            }
            return new UserModel(user);
        } catch(e){}
    }
    /**
     * Return TweetModel of tweet tweet is refering to
     * @returns {Promise<TweetModel>}
     */
    async getRepliedTweet(){
        try{
            let tweet;
            // If 
            if(this.inReplyToTweetID == -1){
                tweet = await TweetService.read(this.inReplyToTweetID);
            // Else, search in API
            } else {
                tweet = await TweetService.fetchAPI(this.inReplyToTweetID);
            }
            return new TweetModel(tweet)
        } catch(e){}
    }
    /**
     * Return TweetModel of tweet tweet is quoting
     * @returns {Promise<TweetModel>}
     */
    async getQuotedTweet(){
        try{
            let tweet;
            // If empty
            if(this.quotesTweetID == -1){
                tweet = await TweetService.read(this.quotesTweetID);
            // Else, search in API
            } else {
                tweet = await TweetService.fetchAPI(this.quotesTweetID);
            }
            return new TweetModel(tweet);
        } catch(e) {}
    }
    /**
     * Insert this to database (and all dependencies)
     * @returns {Promise}
     */
    async insertToDatabase(){
        try{
            // First, add author to database
            await (await this.getAuthor()).insertToDatabase();
            // Then, add connections
            if(this.inReplyToUserID != -1) await (await this.getRepliedUser()).insertToDatabase();
            if(this.inReplyToTweetID != -1) await (await this.getRepliedTweet()).insertToDatabase();
            if(this.quotesTweetID != -1) await (await this.getQuotedTweet()).insertToDatabase();
            // Then, add this tweet
            await TweetService.create(this.getData());
            // Then, add TweetStatsFreeze
            await this._TweetStatsFreeze.insertToDatabase();
            // If it exists, update TweetStatsFreeze
            await this._TweetStatsFreeze.updateToDatabase();
        } catch (e) {
            console.error('[TweetModel] insertToDatabase failed', e)
        }

    }
    /**
     * REVIEW
     * Updates this in database with data ???
     */
    async updateToDatabase(){
        return await TweetService.TweetStatsFreeze.update(this.tweetID, this.getStats())
    }
    /**
     * REVIEW
     * TODO
     * Deletes this
     */
    async deleteFromDatabase(){
        return await TweetService.delete();
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
            replyCount: this.replyCount
        }
    }
    async insertToDatabase(){
        return await TweetService.TweetStatsFreeze.create(this.getData());
    }
    async updateToDatabase(){
        return await TweetService.TweetStatsFreeze.update(this.tweetID, this.getData());
    }
}

TweetModel.TweetAnalysis = class {
    constructor(tweet, analysis){
        this.tweetID = tweet.tweetID;
        this.fullText = tweet.fullText;
        // Translation
        this.translation = tweet.translation;
        // Sentiment
        this.sentiment = {}
        this.sentiment.fullText = tweet.sentiment_fullText
        this.sentiment.negativity = tweet.sentiment_negativity
        this.sentiment.neutrality = tweet.sentiment_neutrality
        this.sentiment.positivity = tweet.sentiment_positivity
        this.sentiment.compound = tweet.sentiment_compound
        this.sentiment.polarity = tweet.sentiment_polarity
        this.sentiment.subjectivity = tweet.sentiment_subjectivity
        this.sentiment.anger = tweet.sentiment_anger
        this.sentiment.anticipation = tweet.sentiment_anticipation
        this.sentiment.disgust = tweet.sentiment_disgust
        this.sentiment.fear = tweet.sentiment_fear
        this.sentiment.joy = tweet.sentiment_joy
        this.sentiment.negative = tweet.sentiment_negative
        this.sentiment.positive = tweet.sentiment_positive
        this.sentiment.sadness = tweet.sentiment_sadness
        this.sentiment.surprise = tweet.sentiment_surprise
        this.sentiment.trust = tweet.sentiment_trust
    }
    getData(){
        return {
            translation: this.translation,
            sentiment: this.sentiment
        }
    }
    getSQLData(){
        return {
            tweetID: this.tweetID,
            sentiment_negativity: this.sentiment.negativity,
            sentiment_neutrality: this.sentiment.neutrality,
            sentiment_positivity: this.sentiment.positivity,
            sentiment_compound: this.sentiment.compound,
            sentiment_polarity: this.sentiment.polarity,
            sentiment_subjectivity: this.sentiment.subjectivity,
            sentiment_anger: this.sentiment.anger,
            sentiment_anticipation: this.sentiment.anticipation,
            sentiment_disgust: this.sentiment.disgust,
            sentiment_fear: this.sentiment.fear,
            sentiment_joy: this.sentiment.joy,
            sentiment_negative: this.sentiment.negative,
            sentiment_positive: this.sentiment.positive,
            sentiment_sadness: this.sentiment.sadness,
            sentiment_surprise: this.sentiment.surprise,
            sentiment_trust: this.sentiment.trust,
        }
    }
    async execute(analysis_name){
        if(analysis_name == "sentiment"){
            this.sentiment = await AnalysisService.getSentiment(this.fullText);
            return;
        }
    }

}


module.exports = TweetModel;