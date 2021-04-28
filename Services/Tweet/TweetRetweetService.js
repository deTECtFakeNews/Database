const Connection = require("../../Data");
const { normalize } = require("../TweetService");

/**
 * @typedef {Object} TweetRetweetJSON
 * @property {String} tweetID Id of Tweet being retweeted
 * @property {String} authorID Id of User who published the retweet
 * @property {Date} creationDate Date of retweet
 */

/**
 * Database - Creates a new row in `TweetRetweet` table
 * @param {TweetRetweetJSON} tweetRetweet TweetRetweetJSON with data to be added to database
 * @returns {Promise}
 */
const create = (tweetRetweet) => new Promise(async (resolve, reject) => {
    if(tweetRetweet.tweetID == -1 || tweetRetweet.tweetID == undefined || tweetRetweet.userID == undefined || tweetRetweet.creationDate == undefined) return;
    const database = await Connection.connections['tweet-retweet-write'];
    database.query('INSERT INTO TweetRetweet SET ?', tweetRetweet, (error, results, fields) => {
        database.release();
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        resolve(results);
    })
})

/**
 * Database - Read rows from `TweetRetweet` table
 * @param {TweetRetweetJSON|String} query_params Parameters to search | tweetID of retweets to read
 * @returns {Promise<Array<TweetRetweetJSON>>}
 */
const read = (query_params) => new Promise(async (resolve, reject) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {tweetID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM TweetRetweet' : 'SELECT * FROM TweetRetweet WHERE ?';
    const database = await Connection.connections['tweet-retweet-read'];
    database.query(query, query_params, (error, result, fields) => {
        database.release();
        if(error) reject (error);
        if(result == undefined) reject();
        resolve(result);
    })
})

/**
 * Database - Stream rows from `TweetRetweet` table
 * @param {TweetRetweetJSON|String} query_params Parameters to search | tweetID of retweets to read
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {VoidFunction}
 */
 const stream = async (query_params, { onError = ()=>{}, onFields = ()=>{}, onResult = ()=>{}, onEnd = ()=>{} } ) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {tweetID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM TweetRetweet' : 'SELECT * FROM TweetRetweet WHERE ?';
    const database = await Connection.connections['tweet-retweet-read'];
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

/**
 * API - Get list of retweets
 * @param {String} tweetID tweetID to look in API  
 * @param {{count: Number}} param1 Options
 * @returns {Promise<Array<TweetRetweetJSON>>}
 */
const fetchAPI = (tweetID, {count} = {count: 100}) => new Promise(async (resolve, reject) => {
    await Connection.Twitter.delay('statuses/retweets');
    Connection.Twitter.get('/statuses/retweets', {id: tweetID, count}, (error, data, response)=>{
        if(error) reject(error);
        if(data==undefined || !Array.isArray(data)) reject();
        resolve(data.map(normalize))
    })
})

const TweetRetweetService = {create, read, stream, fetchAPI}
module.exports = TweetRetweetService;