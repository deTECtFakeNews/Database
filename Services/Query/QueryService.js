const { response } = require("express");
const Connection = require("../../Data");
const TweetService = require("../Tweet/TweetService");
const QueryTweetService = require("./QueryTweetService");

/** 
 * @typedef {Object} QueryJSON
 * @property {String} queryID Identifier of query in Database and Spreadsheet
 * @property {Date} executeDate Date of last execution
 * @property {String} query Text to execute
 * @property {Date} firstExecuteDate Date of first execution
 * @property {Boolean} shouldExecute Determines if the server should execute the query
 * 
 * @property {String} historicNext Indicates token to be searched using fullarchive search
 * @property {Date} oldestDate Indicates the oldest ID in db
 * @property {Boolean} isComplete Indicates whether execution has completed
*/


/**
 * Database - Creates a new row in `Query` table
 * @param {QueryJSON} query QueryJSON with data to be added to database
 * @returns {Promise}
 */
const create = (query) => new Promise(async (resolve, reject) => {
    const database = await Connection.connections['query-main-write'];
    database.query('INSERT INTO Query SET ?', query, (error, results, fields)=>{
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        resolve(results);
    })
})

/**
 * Database - Read rows from `Query` table
 * @param {QueryJSON|String} query_params Parameters to search | queryID of Query to read
 * @returns {Promise<Array<QueryJSON>>>}
 */
const read = (query_params) => new Promise(async (resolve, reject) => {
    if(typeof query_params == 'number' || typeof query_params == 'string'){
        query_params = {queryID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM Query' : 'SELECT * FROM Query WHERE ?';
    const database = await Connection.connections['query-main-read'];
    database.query(query, query_params, (error, results, fields) => {
        if(error) reject(error);
        if(results == undefined) reject();
        resolve(results);
    })
})

/**
 * Database - Stream rows from `Query` table
 * @param {QueryJSON|String} query_params Parameters to search | queryID of Query to fetch
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {VoidFunction}
 */
const stream = (query_params, { onError = ()=>{}, onFields = ()=>{}, onResult = ()=>{}, onEnd = ()=>{} } ) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {queryID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM Query ORDER BY queryID ASC' : 'SELECT * FROM Query WHERE ? ORDER BY queryID ASC';
    const database = Connection.connections['query-main-read'];
    database.query(query, query_params)
        .on('end', async ()=>{
            database.release();
            await onEnd();
        })
        .on('error', (error)=>{
            onError(error);
            database.release();
        })
        .on('fields', onFields)
        .on('result', async result => {
            database.pause()
            await onResult(result)
            database.resume()
        })
};

/**
 * Database - Update row from `Query` table
 * @param {String} queryID queryID of row to update
 * @param {QueryJSON} query New query data
 * @returns {Promise}
 */
const update = (queryID, query) => new Promise(async (resolve, reject) => {
    const database = await Connection.connections['query-main-write'];
    database.query(`UPDATE Query SET ? WHERE ?`, [query, {queryID}], (error, result, fields)=>{
        database.release();
        if(error) reject (error);
        if(result == undefined) reject();
        resolve(result);
    })
});

/**
 * API - Search for text in Twitter
 * @param {String} search Text to search in Twitter
 * @param {Object} options Options to filter search
 * @returns {Promise<{meta: Object, tweets: Array<import("../Tweet/TweetService").TweetJSON>}>}
 */
const fetchAPI = (search, options) => new Promise(async (resolve, reject) => {
    Connection.Twitter.get('1.1/search/tweets', {
        q: search + ' -filter:retweets -RT',
        result_type: 'mixed', 
        tweet_mode: 'extended', 
        ...options
    }, (error, data, response) => {
        if(error) reject(error);
        if(data.statuses == undefined) reject();
        resolve({
            meta: data.search_metadata,
            tweets: data.statuses?.map?.(TweetService.normalize)
        })
    })
});


const fetchAPIHistoricCount = (search, options) => new Promise((resolve, reject) => {
    Connection.Twitter.get('https://api.twitter.com/2/tweets/counts/all', 
        {query: search + " -is:retweet", ...options}, 
        (error, data, response) => {
            if(error) reject(error);
            resolve(data);
    })
})

const fetchAPIHistoric = (search, {next_token, start_time, end_time, until_id}, {
    onResult = async ()=>{}, 
    onPage = async()=>{},
    onError = ()=>{}, 
    onEnd = async ()=>{}
}) => {
    Connection.Twitter.get('https://api.twitter.com/2/tweets/search/all', 
        { query: search + " -is:retweet", max_results: 500, next_token, start_time, end_time, until_id}, 
        async (error, data, response) => {
            // Reject if there is an error    
            if (error) return onError(error);
            // Call on result fot each tweet id
            if(Array.isArray(data?.data)){
                for(let {id} of data?.data){ await onResult(id); }
            } 
            if(data.meta.next_token){
                await onPage(data.meta.next_token);
            } else {
                await onEnd();
            }
    })
}

const QueryService = {create, read, stream, update, fetchAPI, fetchAPIHistoric, fetchAPIHistoricCount, QueryTweetService};
module.exports = QueryService;