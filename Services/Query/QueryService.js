const Connection = require("../../Data");
const TweetService = require("../Tweet/TweetService");
const QueryTweetService = require("./QueryTweet");
/** 
 * @typedef {Object} QueryJSON
 * @property {String} queryID Unique identifier of query in Database and Spreadsheet
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
 * @typedef {Object} QueryResponseJSON
 * @property {Object} meta
 * @property {Array<TweetJSON>} tweets
 */

/**
 * API v1.1 - Search for last 30 days
 * @param {String} search Query to be executed
 * @param {Object} options Config options
 * @returns {Promise<QueryResponseJSON>}
 */
const fetchAPI = (search, options) => new Promise((resolve, reject) => {
    Connection.Twitter.get('1.1/search/tweets', {
        q: `${search} -filter:retweets -RT lang:es`,
        result_type: 'mixed', 
        tweet_mode: 'extended', 
        ...options
    }, (error, data, response) => {
        // Reject on error
        if(error) reject(error);
        resolve({
            meta: data.search_metadata, 
            tweets: data.statuses?.map?.(TweetService.normalize)
        })
    })
});


const fetchAPI_historic_count = (search, options) => new Promise((resolve, reject) => {
    Connection.Twitter.get('https://api.twitter.com/2/tweets/counts/all', {query: `${search} -is:retweet lang:es`, ...options}, (error, data, response) => {
        if(error) reject(error)
        resolve(data);
    })
})


/**
 * API v2 - Search in historic archive
 * @param {String} search Query to be executed
 * @param {Object} options Config options
 * @param {{onResult: Function, onPage: Function, onError: Function, onEnd: Function}} param2 Config options
 */
const fetchAPI_historic = (search, options = {}, {
    onResult = function(){}, 
    onPage = function(){}, 
    onError = function(){}, 
    onEnd = function(){}
}) => new Promise((resolve, reject) => {
    Connection.Twitter.get('https://api.twitter.com/2/tweets/search/all', {
        query: `${search} -is:retweet`,
        max_results: 500, 
        'tweet.fields': 'attachments,author_id,created_at,entities,geo,id,in_reply_to_user_id,lang,public_metrics,possibly_sensitive,referenced_tweets,text',
        ...options
    }, async (error, data, response) => {
        // Reject on error
        if(error) onError(error);
        // Call on result for each tweet id
        // console.log(data)
        if(Array.isArray(data?.data)){
            for(let tweet of data?.data){
                await onResult( TweetService.normalize_v2(tweet) )
            }
        }
        // If there is next page, call onPage
        if(data?.meta?.next_token) await onPage(data?.meta?.next_token)
        else{
            await onEnd();
            resolve()
        }
    })
})

/**
 * Database - Get all queries that match criteria
 * @param {QueryJSON|String} params Conditions to search matches
 * @returns {Promise<Array<QueryJSON>>}
 */
 const read = (params) => new Promise((resolve, reject) => {
    // If params is a string, assume tweetID
    if(typeof params === 'string' || typeof params === 'number') params = {queryID: params};
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM Query' : 'SELECT * FROM Query WHERE ?';
    Connection.connections['query-main-read'].query(query, params, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results);
    })
});

/**
 * Database - Live streams results of all the queries that match criteria. Recommended when expecting large results
 * @param {QueryJSON|String} params Conditions to search matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
 const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params};
    // If no params, return all
    const query = params == undefined ? 'SELECT * FROM Query' : 'SELECT * FROM Query WHERE ?';
    Connection.connections['query-main-read'].query(query, params)
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result => {
            Connection.connections['query-main-read'].pause();
            await onResult(result);
            Connection.connections['query-main-read'].resume();
        })
        .on('end', async ()=>{
            await onEnd();
            resolve();
        })
});

/**
 * Database - Update query with new data
 * @param {String} queryID Tweet id of row to update
 * @param {QueryJSON} query Data to be updated
 * @returns {Promise}
 */
 const update = (queryID, query) => new Promise((resolve, reject) => {
    Connection.connections['query-main-write'].query('UPDATE Query SET ? WHERE ?', [query, {queryID: queryID}], (error, result, fields) => {
        if(error) reject(error);
        else resolve(query);
    })
})

const QueryService = {fetchAPI, fetchAPI_historic, fetchAPI_historic_count, read, stream, update, QueryTweetService};
module.exports = QueryService;