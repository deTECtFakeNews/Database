const Connection = require("../../Data");
/**
 * @typedef {Object} TweetStatsJSON 
 * @property {String} tweetID Unique identifier of tweet in Twitter and Database
 * @property {Date} updateDate Date these stats were retrieved
 * @property {Number} retweetCount Number of retweets
 * @property {Number} favoriteCount Number of likes
 * @property {Number} replyCount Number of replies (note. API v1 returns null)
 * @property {String} status Status of account (i.e., active, suspended or removed)
 */

/**
 * Transforms Twitter API 1.1 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v1.1
 * @returns {TweetStatsJSON}
 */
const normalize = data => ({
    tweetID: data.id_str, 
    updateDate: new Date(), 
    retweetCount: data.retweet_count, 
    replyCount: data.reply_count || -1, 
    favoriteCount: data.retweeted_status ? data.retweeted_status.favorite_count : data.favorite_count
});

/**
 * Transforms Twitter API 2 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v2
 * @returns {TweetStatsJSON}
 */
const normalize_v2 = data => ({
    tweetID: data.id, 
    updateDate: new Date(), 
    retweetCount: data.public_metrics.retweet_count, 
    replyCount: data.public_metrics.reply_count, 
    favoriteCount: data.public_metrics.like_count
})

/**
 * Database - Creates a new tweet stats record in database
 * @param {TweetStatsJSON} tweetStats Tweet stats data to insert to database
 * @returns {Promise}
 */
 const create = (tweetStats) => new Promise((resolve, reject) => {
    // Do not create if empty or null
    if(tweetStats.tweetID == undefined || tweetStats.tweetID == -1) return resolve();
    Connection.connections['tweet-stats-write'].query('INSERT INTO TweetStatsFreeze SET ?', tweetStats, (error, results, fields) => {
        // Reject on error
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        // Else return newly added row
        else resolve(tweetStats);
    })
});

/**
 * Database - Get all tweet stats records that match criteria
 * @param {TweetStatsJSON|String} params Conditions to search matches
 * @returns {Promise<Array<TweetStatsJSON>>}
 */
 const read = (params) => new Promise((resolve, reject) => {
    // If params is a string, assume tweetID
    if(typeof params === 'string' || typeof params === 'number') params = {tweetID: params};
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM TweetStatsFreeze' : 'SELECT * FROM TweetStatsFreeze WHERE ?';
    Connection.connections['tweet-stats-read'].query(query, params, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results);
    })
});

/**
 * Database - Live streams results of all the tweet stats records that match criteria. Recommended when expecting large results
 * @param {TweetStatsJSON|String} params Conditions to search matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
 const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {tweetID: params};
    // If no params, return all
    const query = params == undefined ? 'SELECT * FROM Tweet' : 'SELECT * FROM Tweet WHERE ?';
    Connection.connections['tweet-stats-read'].query(query, params)
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result => {
            Connection.connections['tweet-stats-read'].pause();
            await onResult(result);
            Connection.connections['tweet-stats-read'].resume();
        })
        .on('end', async ()=>{
            await onEnd();
            resolve();
        })
});

const TweetStatsService = {normalize, normalize_v2, create, read, stream};
module.exports = TweetStatsService;