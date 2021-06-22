const Connection = require("../../Data");

/**
 * Database - Creates a new row in `QueryTweet` table
 * @param {{queryID: String, tweetID: String}} user Data to be added to database
 * @returns {Promise}
 */
const create = ({queryID, tweetID}) => new Promise(async (resolve, reject) => {
    let query = `INSERT INTO QueryTweet SET ?`;
    const database = await Connection.connections['query-tweet-write'];
    database.query(query, {queryID, tweetID}, (error, results, fields)=>{
        if(error) reject(error);
        resolve(results);
    });
});

/**
 * Database - Read rows from `QueryTweet` table
 * @param {{queryID: String, tweetID: String}|String} query_params Parameters to search | queryID of QueryTweets to read
 * @returns {Promise<Array<{queryID: String, tweetID: String}>>>}
 */
const read = (query_params) => new Promise(async (resolve, reject) => {
    if(typeof query_params == 'number' || typeof query_params == 'string'){
        query_params = {queryID: query_params}
    }
    let query = query_params == undefined ? 'SELECT QueryTweet.*, Tweet.* FROM QueryTweet JOIN Tweet USING (tweetID)' : 'SELECT QueryTweet.*, Tweet.* FROM QueryTweet JOIN Tweet USING (tweetID) WHERE ?';
    const database = await Connection.connections['query-tweet-read'];
    database.query(query, query_params, (error, results, fields) => {
        if(error) reject(error);
        if(results == undefined) reject();
        resolve(results);
    })
})

/**
 * Database - Stream rows from `QueryTweet` table
 * @param {{queryID: String, tweetID: String}|String} query_params Parameters to search | queryID of QueryTweets to fetch
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {VoidFunction}
 */
const stream = async (query_params, { onError = ()=>{}, onFields = ()=>{}, onResult = ()=>{}, onEnd = ()=>{} } ) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {queryID: query_params}
    }
    let query = query_params == undefined ? 'SELECT QueryTweet.*, Tweet.* FROM QueryTweet JOIN Tweet USING (tweetID)' : 'SELECT QueryTweet.*, Tweet.* FROM QueryTweet JOIN Tweet USING (tweetID) WHERE ?';
    const database = await Connection.connections['query-tweet-read'];
    database.query(query, query_params)
        .on('end', ()=>{
            database.release();
            onEnd();
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


const copy = (fromID, toID) => new Promise((resolve, reject) => {
    const database = Connection.connections['query-tweet-write'];
    let query = `
        INSERT IGNORE INTO QueryTweet (queryID, tweetID)
        (SELECT ?, tweetID FROM QueryTweet WHERE queryID=?)
    `;
    database.query(query, [toID, fromID], (error, results, fields) => {
        if(error) reject(error);
        resolve(results);
    })
})

const QueryTweetService = {create, read, stream, copy};
module.exports = QueryTweetService;