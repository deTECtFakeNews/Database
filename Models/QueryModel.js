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
     * Read Query from database 
     * @param {Map<String, Object>} query_params Parameters
     * @returns {Promise<Array<QueryModel>>}
     */
    static async read(query_params){
        try{
            let entries = await QueryService.read(query_params);
            return entries.map(e=>new QueryModel(e));
        } catch(e) {
            console.error('[QueryModel] readFromDatabase error');
            return;
        }
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
            let data = await QueryService.fetchAPI(this.query, {language: 'es'});
            // Store results here
            let results = [];
            data.statuses.forEach(async result=>{
                // Get model of each result
                let tweet = new TweetModel(result);
                // Insert each result to database
                await tweet.insertToDatabase();
                await QueryService.QueryTweet.create(this.queryID, tweet.tweetID);
                // Update analysis
                await tweet._TweetAnalysis.execute('translation');
                await tweet._TweetAnalysis.insertToDatabase();
                // End
                console.log('[QueryModel] Tweet added to database')
                this.statuses.push(tweet);
            })
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
            // Read array of ids from QueryTweet
            let tweetIDs = (await QueryService.QueryTweet.read(this.queryID)).map(row=>row.tweetID);
            // Empty statuses
            // Read each from database
            this.statuses = await Promise.all(
                tweetIDs.map(async id => (await TweetModel.read(id))[0] )
            )
            // Return statuses
            console.log('[QueryModel] read', this.queryID)
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