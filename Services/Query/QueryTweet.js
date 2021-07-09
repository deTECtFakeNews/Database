const Connection = require("../../Data");

/**
 * Database - Creates a new query-tweet relationship in database
 * @param {{queryID: String, tweetID: String}} tweetJSON Data to insert in database
 * @returns {Promise}
 */
 const create = (queryJSON) => new Promise((resolve, reject) => {
    // Do not create if empty or null
    if(queryJSON.queryID == undefined || queryJSON.queryID == -1) return resolve();
    Connection.connections['query-main-write'].query('INSERT INTO QueryTweet SET ?', queryJSON, (error, results, fields) => {
        // Reject on error
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        // Else return newly added row
        else resolve(queryJSON);
    })
});

/**
 * Database - Get all query-tweet relationsips that match criteria
 * @param {{queryID: String, tweetID: String}|String} params Conditions to search matches
 * @returns {Promise<Array<{queryID: String, tweetID: String}>>}
 */
 const read = (params) => new Promise((resolve, reject) => {
    // If params is a string, assume tweetID
    if(typeof params === 'string' || typeof params === 'number') params = {tweetID: params};
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM Tweet' : 'SELECT * FROM Tweet WHERE ?';
    Connection.connections['tweet-main-read'].query(query, params, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results);
    })
});

/**
 * Database - Live streams results of all the query-tweet relationships that match criteria. Recommended when expecting large results
 * @param {{queryID: String, userID: String}|String} params Conditions to search matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
 const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {queryID: params};
    // If no params, return all
    const query = params == undefined ? 'SELECT * FROM QueryTweet' : 'SELECT * FROM QueryTweet WHERE ?';
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
 * Database - Copies all associated queries from one id to another
 * @param {String} fromID SOurce id
 * @param {String} toID Target id
 * @returns {Promise}
 */
const copy = (fromID, toID) => new Promise((resolve, reject) => {
    Connection.connections['query-tweet-write'].query(`
        INSERT IGNORE INTO QueryTweet (queryID, tweetID)
        (SELECT ?, tweetID FROM QueryTweet WHERE queryID=?)
    `, [toID, fromID], (error, results, fields) => {
        if(error) reject(error)
        else resolve();
    })
})

const QueryTweetService = {create, read, stream, copy};
module.exports = QueryTweetService;