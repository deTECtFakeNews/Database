const QueryService = require("../Services/QueryService");
const TweetModel = require("./TweetModel");

class QueryModel{
    /**
     * Create Query table in database
     */
    static async createTable(){
        return await QueryService.createTable();
    }
    /**
     * Creates a new query in database
     * @param {String} search Text to be searched using API
     * @returns {QueryModel}
     */
    static async createNew(search){
        let query = new QueryModel({query: search});
        await query.insertToDatabase();
        
        let results = await query.execute();
        query.statuses = results;
        return query;
    }
    /**
     * Creates a new QueryModel object with methods for executing several services
     * @constructor
     * @param {import("../Services/QueryService").QueryService_Row} data Data of Query to be executed
     */
    constructor(data){
        this.query = data.query;
        
        this.queryID = data.queryID;
        this.executeEveryNHours = data.executeEveryNHours || -1;
        this.firstExecuteDate = data.firstExecuteDate || new Date();
        this.executeDate = data.executeDate || new Date();
        this.resultType = data.resultType || 'mixed';
        this.language = data.language || 'und';
        this.resultsCount = data.resultsCount || 300;
        /**
         * @type {Array<TweetModel>}
         */
        this.statuses = []
    }
    /**
     * Get data in QueryService_Row format
     * @returns {import("../Services/QueryService").QueryService_Row}
     */
    getData(){
        return {
            queryID: this.queryID,
            executeEveryNHours: this.executeEveryNHours,
            firstExecuteDate: this.firstExecuteDate,
            executeDate: this.executeDate,
            resultType: this.resultType,
            language: this.language,
            query: this.query,
            resultsCount: this.resultsCount
        }
    }
    /**
     * Insert new Query into Database
     * @returns {Promise}
     */
    async insertToDatabase(){
        try{
            let result = await QueryService.create(this.getData());
            this.queryID = result.insertId;
        } catch (e){
            console.log('[QueryModel] insertToDatabase failed', e)
        }
    }
    /**
     * Executes the query and saves the results to database
     * @returns {Promise<Array<TweetModel>>}
     */
    async execute(){
        try{
            // Execute service
            let data = await QueryService.fetchAPI(this.query);
            // Get model of each result
            let results = data.statuses.map(tweet=>new TweetModel(tweet));
            // Upload each result and push to statuses
            results.forEach(async tweet=>{
                await tweet.insertToDatabase();
                await QueryService.QueryTweet.create( this.queryID, tweet.tweetID );
                console.log('[QueryModel] Tweet added to database')
                this.statuses.push(tweet);
            });
            // Update last exec date
            await QueryService.update(this.queryID, {executeDate: new Date()});
            return results;
        } catch (e) {
            console.log('[QueryModel] execution failed', e)
        }
        // return this;
    }
    /**
     * Gets the associated tweets
     * @returns {Promise<Array<TweetModel>>}
     */
    async getTweets(){
        try{
            // Read from QueryTweet
            let data = await QueryService.QueryTweet.read(this.queryID);
            // Get array of Ids
            let tweetIDs = data.map(row=>row.tweetID);
            // Empty statuses
            this.statuses = [];
            // Read each from database
            tweetIDs.map(async id=>{
                let tweet = await TweetModel.readFromDatabase(id);
                this.statuses.push(tweet);
            });
            // Return statuses
            return this.statuses;
        } catch (e) {
            console.log('[QueryModel] fetch failed')
        }
    }
    /**
     * Print results
     */
    printResults(){
        console.log(this.statuses.map(l=>l.getData()))
    }
    /**
     * Get results data
     */
    getResultsData(){
        return this.statuses.map(l=>l.getData())
    }
}

module.exports = QueryModel;