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
        this.authorID = tweet.authorID || -1; 
        this.inReplyToUserID = tweet.inReplyToUserID || -1; 
        this.inReplyToTweetID = tweet.inReplyToTweetID || -1; 
        this.quotesTweetID = tweet.quotesTweetID || -1; 
        this.creationDate = new Date(tweet.creationDate).toISOString(); 
        this.fullText = tweet.fullText; 
        this.language = tweet.language; 

        this.placeLng = tweet.placeLng;
        this.placeLat = tweet.placeLat;
        this.placeDescription = tweet.placeDescription;

        let {retweetCount, favoriteCount, replyCount} = tweet;
        this._latestStats = {retweetCount, favoriteCount, replyCount}

        this._TweetStatsFreeze = new TweetModel.TweetStatsFreeze(tweet);
        this._TweetAnalysis = new TweetModel.TweetAnalysis(tweet);
        this._TweetEntities = new TweetModel.TweetEntities(tweet);
    }

    async update(){
        return await TweetModel.getFromAPI(this.tweetID);
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
            creationDate: new Date(this.creationDate).toJSON().slice(0,19).replace('T', ' '), 
            fullText: this.fullText, 
            placeLat: this.placeLat,
            placeLng: this.placeLng,
            placeDescription: this.placeDescription
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
            let user = (await UserService.read(this.authorID))[0];
            if(user == undefined){
                user = await UserService.fetchAPI(this.authorID)
                console.log("fetching user from api")
            }
            return new UserModel(user);
        } catch(e){
            if( e[0].code == '88') console.log('API limit exceeded');
            else console.log('[TweetModel] error fetching user', this.authorID);
            return new UserModel({userID: -1})
        }
    }
    /**
     * Return UserModel of user tweet is replying to
     * @returns {Promise<UserModel>}
     */
    async getRepliedUser(){
        try{
            let user = await UserService.read(this.inReplyToUserID)[0] || await UserService.fetchAPI(this.inReplyToUserID);
            return new UserModel(user);
        } catch(e){
            if( e[0].code == '88') console.log('API limit exceeded');
        }
    }
    /**
     * Return TweetModel of tweet tweet is refering to
     * @returns {Promise<TweetModel>}
     */
    async getRepliedTweet(){
        try{
            let tweet = await TweetService.read(this.inReplyToTweetID) || await TweetService.fetchAPI(this.inReplyToTweetID);
            return new TweetModel(tweet)
        } catch(e){
            if( e[0]?.code == '88') console.log('API limit exceeded');
            else console.log(e)
        }
    }
    /**
     * Return TweetModel of tweet tweet is quoting
     * @returns {Promise<TweetModel>}
     */
    async getQuotedTweet(){
        try{
            let tweet = await TweetService.read(this.quotesTweetID) || await TweetService.fetchAPI(this.quotesTweetID);
            return new TweetModel(tweet);
        } catch(e) {
            if( e[0].code == '88') console.log('API limit exceeded');
        }
    }

    /**
     * Returns list of retweets (date and user)
     */
    async getRetweets(){
        try{
            return await TweetService.fetchRetweetAPI(this.tweetID)
        } catch (e) {
            console.log("[TweetModel] could not get retweets")
        }
    }

    /**
     * Insert this to database (and all dependencies)
     * @returns {Promise}
     */
    async insertToDatabase(){
        try{
            if(this.tweetID == -1 || this.tweetID == null) return;
            // First, add author to database
            await (await this.getAuthor()).insertToDatabase()
            // Then, add connections
            if(this.inReplyToUserID != -1) await (await this.getRepliedUser()).insertToDatabase();
            if(this.inReplyToTweetID != -1) await (await this.getRepliedTweet()).insertToDatabase();
            if(this.quotesTweetID != -1) await (await this.getQuotedTweet()).insertToDatabase();
            // Then, add this tweet
            await TweetService.create(this.getData());
            // Then, add TweetStatsFreeze
            await this._TweetStatsFreeze.pushStats(this._latestStats);

            await this._TweetEntities.insertToDatabase();

            console.log('[TweetModel] insert successful')

        } catch (e) {
            console.error('[TweetModel] insertToDatabase failed', e)
        }

    }
    /**
     * REVIEW
     * Updates this in database with data ???
     */
    async updateToDatabase(){
        // await TweetService.update(this.tweetID, this.getData())
        // await this._TweetStatsFreeze.pushStats(this._latestStats);
        
        await this._TweetEntities.getFromText()
        await this._TweetEntities.insertToDatabase();

        await this._TweetAnalysis.execute('translation');
        await this._TweetAnalysis.insertToDatabase();

        // return await TweetService.TweetStatsFreeze.update(this.tweetID, this.getStats())
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

TweetModel.TweetStatsFreeze = class {
    static async _createTable(){
        return await TweetService.TweetStatsFreeze.createTable();
    }
    constructor(tweet){
        this.tweetID = tweet.tweetID;
        /**
         * @type {Array<import("../Services/TweetService").TweetService_StatsFreeze_Data>} 
         */
        this.stats = []
    }
    async read(){
        this.stats = Object.values(await TweetService.TweetStatsFreeze.read(this.tweetID));
        return this.stats;
    }
    /**
     * 
     * @param {import("../Services/TweetService").TweetService_StatsFreeze_Data} stats 
     */
    async pushStats(stats){
        try{
            // Check if data is valid
            if(stats.favoriteCount == null && stats.replyCount == null && stats.retweetCount == null) return;
            // Read
            await this.read();

            let last = this.stats[this.stats.length -1] || {replyCount: -1, retweetCount: -1, favoriteCount: -1}

            if( last.favoriteCount != stats.favoriteCount || last.replyCount != stats.replyCount || last.retweetCount != stats.retweetCount){
                await TweetService.TweetStatsFreeze.create({
                    ...stats,
                    tweetID: this.tweetID,
                    updateDate: new Date(),
                })
            }

        } catch(e){
            console.error('[TweetModel.TweetStatsFreeze] error')
        }
    }

    getMax(stat){
        if(this.stats.length==0) return -1;
        return Math.max( ...this.stats.map(l=>l[stat]) )
    }

}

TweetModel.TweetAnalysis = class {
    /**
     * Create a new analysis object
     * @param {{tweetID: String, fullText: string}} tweet Tweet tweetID and fullText
     * @param {import("../Services/TweetService").TweetService_TweetAnalysis} analysis Data of analysis
     */
    constructor(tweet, analysis){
        this.tweetID = tweet.tweetID;
        this.fullText = tweet.fullText;
        this.assignAnalysisValues(analysis)
    }
    assignAnalysisValues(analysis){
        // Sentiment
        this.sentiment_negativity = analysis?.sentiment_negativity || null;
        this.sentiment_neutrality = analysis?.sentiment_neutrality || null;
        this.sentiment_positivity = analysis?.sentiment_positivity || null;
        this.sentiment_compound = analysis?.sentiment_compound || null;
        this.sentiment_polarity = analysis?.sentiment_polarity || null;
        this.sentiment_subjectivity = analysis?.sentiment_subjectivity || null;
        this.sentiment_anger = analysis?.sentiment_anger || null;
        this.sentiment_anticipation = analysis?.sentiment_anticipation || null;
        this.sentiment_disgust = analysis?.sentiment_disgust || null;
        this.sentiment_fear = analysis?.sentiment_fear || null;
        this.sentiment_joy = analysis?.sentiment_joy || null;
        this.sentiment_negative = analysis?.sentiment_negative || null;
        this.sentiment_positive = analysis?.sentiment_positive || null;
        this.sentiment_sadness = analysis?.sentiment_sadness || null;
        this.sentiment_surprise = analysis?.sentiment_surprise || null;
        this.sentiment_trust = analysis?.sentiment_trust || null;
        // Bert
        this.bert_toxicity = analysis?.bert_toxicity
        this.bert_irony = analysis?.bert_irony
        this.bert_stance = analysis?.bert_stance
        this.bert_hateSpeech = analysis?.bert_hateSpeech
        this.processedTweet = analysis?.processedTweet
        this.bert_generalClassification = analysis?.bert_generalClassification
    }

    async read(){
        let results = await TweetService.TweetAnalysis.read(this.tweetID)[0];
        this.assignAnalysisValues(results);
    }

    /**
     * @returns {import("../Services/TweetService").TweetService_TweetAnalysis}
     */
    getData(){
        return {
            tweetID: this.tweetID, 
            sentiment_negativity: this.sentiment_negativity,
            sentiment_neutrality: this.sentiment_neutrality,
            sentiment_positivity: this.sentiment_positivity,
            sentiment_compound: this.sentiment_compound,
            sentiment_polarity: this.sentiment_polarity,
            sentiment_subjectivity: this.sentiment_subjectivity,
            sentiment_anger: this.sentiment_anger,
            sentiment_anticipation: this.sentiment_anticipation,
            sentiment_disgust: this.sentiment_disgust,
            sentiment_fear: this.sentiment_fear,
            sentiment_joy: this.sentiment_joy,
            sentiment_negative: this.sentiment_negative,
            sentiment_positive: this.sentiment_positive,
            sentiment_sadness: this.sentiment_sadness,
            sentiment_surprise: this.sentiment_surprise,
            sentiment_trust: this.sentiment_trust,
            bert_toxicity: this.bert_toxicity,
            bert_irony: this.bert_irony,
            bert_stance: this.bert_stance,
            bert_hateSpeech: this.bert_hateSpeech,
            processedTweet: this.processedTweet,
            bert_generalClassification: this.bert_generalClassification
        }
    }
    /**
     * Insert this to database
     * @returns {Promise}
     */
    async insertToDatabase(){
        try{
            if(this.tweetID == -1 || this.tweetID == undefined) return;
            await TweetService.TweetAnalysis.update(this.getData())
        } catch (e){
            console.log('[TweetModel.TweetAnalysis] error uploading')
        }
    }
    /**
     * Executes an analysis and updates values
     * @param {String} analysis Name of analysis to execute. Leave blank to exec all
     * @returns {Promise<Object>}
     */
    async execute(analysis){
        if(analysis == 'translation'){
            try{
                this.translation = await AnalysisService.Translation.get(this.fullText);
                return this.translation;
            } catch(e){

            }
        }
    }
}

TweetModel.TweetEntities = class {
    /**
     * Create TweetEntities table in database
     */
    static async createTable(){
        return await TweetService.TweetEntities.createTable()
    }
    /**
     * Search for TweetEntities in database
     * @param {Object|Number|String} query_params Parameters to execute search in database  
     * @returns {Promise<Array<import("../Services/TweetService").TweetService_TweetEntity>>}
     */
    static async read(query_params){
        try{
            let entries = await TweetService.TweetEntities.read(query_params);
            return entries.map(e=> new TweetModel.TweetEntities(e));
        } catch (e){
            console.log(e)
        }
    }
    /**
     * 
     * @param {import("../Services/TweetService").TweetService_data} tweet 
     */
    constructor(tweet){
        this.tweetID = tweet.tweetID;
        this.fullText = tweet.fullText;
        this.entities = tweet.entities || [];
    }

 /*    async read(){
        try{
            let thisEntities = await TweetModel.TweetEntities.read(this.tweetID);
            this.entities = thisEntities?.[0]?.entities;
        } catch(e){
            console.error(e)
        }
    } */

    async insertToDatabase(){
        try{
            for(let entity of this.entities){
                await TweetService.TweetEntities.create({tweetID: this.tweetID, ...entity})
            }            
        } catch (e){
            console.log(e)
            return;
        }
    }


    async getFromText(){
        this.entities = await TweetService.TweetEntities.getFromText(this.fullText);
        return this.entities;
    }

    async get(type){
        await this.getFromText()
        return this.entities.filter(e=>e.type==type).map(e=>e.value);
    }

    print(){
        console.log(this.tweetID)
        console.log(this.entities)
        console.log('===')
    }
}

module.exports = TweetModel;