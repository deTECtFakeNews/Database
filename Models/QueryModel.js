const QueryService = require("../Services/QueryService");
const TweetModel = require("./TweetModel");

/**
 * QueryModcel groups data and common operations needed when dealing with queries
 * @class
 * @constructor
 * @public
 */
class QueryModel{

    static async getFromAPI(search){
        try{
            let data = await QueryService.fetchAPI(search);
            return new QueryModel(data);
        }
    }

    /**
     * Call api to execute query
     * @param {String} search Term to search
     * @param {import('../Services/QueryService').QueryService_getFromAPI_filters} filters filters to be applied
     */
    static async getFromAPI(search, filters) {
        try {
            let data = await QueryService.getFromAPI(search, filters);
            return new QueryModel(data)
        } catch (e) {
            console.error("[QUeryService] getFromAPI error");
            return;
        }
    }
    /**
     * Create a new Query Object
     * @param {import('../Services/QueryService').QueryService_getFromAPI_response} data 
     */
    constructor(data){
        this.query = data.queryMeta.query;
        this.count = data.queryMeta.count;
        /**
         * @type {Array<import('../Models/TweetModel')>}
         */
        this.statuses = data.statuses.map(tweet=>new TweetModel(tweet));
    }
    /**
     * Returns json of available data
     * @returns {Object}
     */
    getData(){
        return {
            query: this.query, 
            count: this.count,
            statuses: this.statuses.map(l=>l.getData())
        }
    }

    printResults(){
        this.tweetCollection.forEach(tweet => {
            console.log(tweet.getData())
        });
    }

    async insertToDatabase(){

    }

}

module.exports = QueryModel;