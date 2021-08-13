/**
 * @typedef {Object} UserStatsJSON
 * @property {String} userID Unique identifier of user in Twitter and Database
 * @property {Number} followersCount Number of accounts following this user
 * @property {Number} followingCount Number of accounts this user follows
 * @property {Number} listedCount Number of lists this user appears in
 * @property {Number} favoritesCount Number of tweets this user has liked in its lifetime
 * @property {Number} statusesCount Number of tweets (including quote tweets and replies) this user has posted
 * @property {Date} updateDate Date these stats were retrieved
 * @property {String} status Status of account (i.e., active, suspended or removed)
 */

const Connection = require("../../Data");

/**
 * Transforms Twitter API 1.1 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v1.1
 * @returns {UserStatsJSON}
 */
const normalize = data => ({
    userID: data.id_str, 
    followersCount: data.followers_count, 
    followingCount: data.friends_count, 
    listedCount: data.listed_count, 
    favoritesCount: data.favourites_count, 
    statusesCount: data.statuses_count, 
    // Update date is by default the current date, as data is pulled live from Twitter
    updateDate: new Date()
})

/**
 * Transformas Twitter API 2 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v2
 * @returns {UserStatsJSON}
 */
const normalize_v2 = data => ({
    userID: data.id, 
    followersCount: data.public_metrics.followers_count, 
    followingCount: data.public_metrics.following_count, 
    listedCount: data.public_metrics.listed_count, 
    // This feature is no longer supported for v2
    favoritesCount: -1,
    statusesCount: data.public_metrics.tweet_count, 
    // Update date is by default the current date, as data is pulled live from Twitter
    updateDate: new Date()
})

/**
 * Database - Creates a new user stats record in database
 * @param {UserStatsJSON} userStats User stats data to insert into database
 * @returns {Promise<UserStatsJSON>}
 */
const create = (userStats) => new Promise((resolve, reject) => {
    Connection.connections['user-stats-write'].query('INSERT INTO UserStatsFreeze SET ?', userStats, (error, result, fields) => {
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        else resolve(userStats);
    })
})

/**
 * Database - Get all user stats records that match criteria
 * @param {UserStatsJSON|String} params Conditions to search matches
 * @returns {Promise<Array<UserStatsJSON>>}
 */
const read = (params) => new Promise((resolve, reject) => {
    // If params is string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params}
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM UserStatsFreeze' : 'SELECT * FROM UserStatsFreeze WHERE ?';
    Connection.connections['user-stats-read'].query(query, params, (error, results, fields) => {
        if(error) reject(error)
        else resolve(results);
    })
})

/**
 * Database - Live streams results of all the user stats records that match criteria. Recommended when expecting large results
 * @param {UserStatsJSON|String} params Conditions to seatch matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params}
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM UserStatsFreeze' : 'SELECT * FROM UserStatsFreeze WHERE ?';
    Connection.connections['user-stats-read'].query(query, params)
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result => {
            Connection.connections['user-stats-read'].pause();
            await onResult(result);
            Connection.connections['user-stats-read'].resume();
        })
        .on('end', async ()=>{
            await onEnd();
            resolve();
        })
})

const UserStatsService = {normalize, normalize_v2, create, read, stream};
module.exports = UserStatsService;