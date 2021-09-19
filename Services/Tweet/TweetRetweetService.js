const Connection = require("../../Data");
const UserService = require("../User/UserService");

/**
 * @typedef {Object} TweetRetweetJSON
 * @property {String} tweetID Id of original tweet
 * @property {String} authorID Id of user who retweeted
 * @property {Date} creationDate Date of retweet
 * 
 * @property {UserJSON} user UserJSON data of user that made the retweet
 */

/**
 * Transforms Twitter API 1.1 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v1.1
 * @returns {TweetRetweetJSON}
 */
const normalize = data => ({
    tweetID: data.id_str, 
    authorID: data.user.id_str, 
    creationDate: new Date(data.created_at), 
    author: UserService.normalize(data.user)
});

/**
 * API v1.1 - Fetches last 100 rts of user followers
 * @param {String} tweetID Tweet id to fetch in API
 * @returns {Promise<Array<TweetRetweetJSON>>}
 */
const fetchAPI = (tweetID, {count = 100, trim_user = false} = {}) => new Promise((resolve, reject) => {
    Connection.Twitter.get('1.1/statuses/retweets', {id: tweetID, count, trim_user: false}, (error, data, response) => {
        if(error) reject(error);
        try{
            resolve(data.map(normalize))
        } catch(e){
            reject(e);
        }
    })
})

/**
 * 
 * @param {String} tweetID Tweet id to fetch in API
 * @param {{next_cursor: String}} options Options
 * @returns {Promise<{ids: Array<String>, next_cursor: String}>}
 */
const fetchAPIFast = (tweetID, options) => new Promise((resolve, reject) => {
    Connection.Twitter.get('1.1/statuses/retweeters/ids', {id: tweetID, stringify_ids: true, cursor: options?.next_cursor, count: 100}, (error, data, response) => {
        if(error) reject(error);
        try{
            resolve({
                ids: data?.ids, 
                next_cursor: data?.next_cursor_str
            })
        } catch(e){
            reject(e);
        }
    })
})

/**
 * Database - Creates a new retweet connection between user and tweet
 * @param {TweetRetweetJSON} tweetRetweetJSON Data to be inserted
 * @returns {Promise}
 */
 const create = (tweetRetweet) => new Promise((resolve, reject) => {
    if(tweetRetweet.tweetID == undefined || tweetRetweet.tweetID == -1) return resolve();
    if(tweetRetweet.authorID == undefined || tweetRetweet.authorID == -1) return resolve();
    Connection.connections['tweet-retweets-write'].query('INSERT INTO TweetRetweet SET ?', tweetRetweet, (error, results, fields) => {
        if(error) reject(error);
        else resolve();
    })
})
// TODO : IMplement ?
const createMany = undefined;
/**
 * Database - Get all tweet retweets that match criteria
 * @param {TweetRetweetJSON|String} params Conditions to search matches
 * @returns {Promise<Array<TweetRetweetJSON>>}
 */
 const read = (params) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {tweetID: params};
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM TweetRetweet' : 'SELECT * FROM TweetRetweet WHERE ?';
    Connection.connections['tweet-retweets-read'].query(query, params, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results);
    })
})

/**
 * Database - Live streams results of all tweet retweets that match criteria. Recommended when expecting large results
 * @param {TweetRetweetJSON|String} params Conditions to search matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
 const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {tweetID: params};
    // If no params, return all
    const query = params == undefined ? 'SELECT * FROM TweetRetweet' : 'SELECT * FROM TweetRetweet WHERE ?';
    Connection.connections['tweet-retweets-read'].query(query, params)
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result => {
            Connection.connections['tweet-retweets-read'].pause();
            await onResult(result);
            Connection.connections['tweet-retweets-read'].resume();
        })
        .on('end', async ()=>{
            await onEnd();
            resolve();
        })
});

const TweetRetweetService = {normalize, fetchAPI, fetchAPIFast, create, read, stream};
module.exports = TweetRetweetService;