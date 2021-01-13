const QueryService = require("../Services/QueryService");
const TweetModel = require("./TweetModel");

class QueryModel{
    static async createTable(){
        return await QueryService.createTable();
    }

    /**
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
     */
    getData(){
        return {
            // queryID: this.queryID,
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
     */
    async execute(){
        try{
            let data = await QueryService.fetchAPI(this.query);
            let results = data.statuses.map(tweet=>new TweetModel(tweet));
            results.forEach(async tweet=>{
                await tweet.insertToDatabase();
                await QueryService.QueryTweet.create( this.queryID, tweet.tweetID );
                console.log('[QueryModel] Tweet added to database')
                this.statuses.push(tweet);
            });
            await QueryService.update(this.queryID, {executeDate: new Date()});
            return results;
        } catch (e) {
            console.log('[QueryModel] execution failed', e)
        }
        // return this;
    }
    /**
     * Gets the associated tweets
     */
    async getTweets(){
        try{
            let data = await QueryService.QueryTweet.read(this.queryID);
            let tweetIDs = data.map(row=>row.tweetID);
            this.statuses = [];
            tweetIDs.map(async id=>{
                let tweet = await TweetModel.readFromDatabase(id);
                this.statuses.push(tweet);
            });
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
}

module.exports = QueryModel;