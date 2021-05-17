let Connection = require('../../Data/index');
let {seed} = require('../../Data/constants');
const SystemService = require('../System/SystemService');
const UserService = require('../User/UserService');
const TweetEntitiesService = require('./TweetEntitiesService');
const TweetRetweetService = require('./TweetRetweetService');
const TweetStatsService = require('./TweetStatsService');

/**
 * @typedef {Object} TweetJSON
 * @property {String} tweetID Id of Tweet in Twitter
 * @property {String} authorID Id of User who created the Tweet
 * @property {String} inReplyToUserID Id of User this Tweet replies to
 * @property {String} inReplyToTweetID Id of Tweet this Tweet replies to
 * @property {String} quotesTweetID Id of Tweet this Tweet quotes
 * @property {Date} creationDate Date this Tweet was published
 * @property {String} fullText _Unparsed_ text contentof this Tweet
 * @property {String} language _Detected_ language of this Tweet
 * @property {Number} placeLng Longitude of Tweet location
 * @property {Number} placeLat Latitude of Tweet location
 * @property {String} placeDescription Description of Tweet location
 * 
 */

/**
 * @typedef {Object} TweetJSON_JSON
 * @property {TweetStatsJSON} latestStats Object containing latest stats
 * @property {UserJSON} author UserJSON object containing author info
 */

/**
 * @typedef {TweetJSON & TweetJSON_JSON} TweetJSONExtended
 */

/**
 * Transforms Twitter API Tweet Object to Tweet interface
 * @param {Object} data 
 * @returns {TweetJSONExtended}
 */
const normalize = data => ({
    tweetID: data.id_str,
    authorID: data.user.id_str,
    inReplyToUserID: data.in_reply_to_user_id_str || -1,
    inReplyToTweetID: data.in_reply_to_status_id_str || -1,
    quotesTweetID: data.quoted_status_id_str || -1, 
    creationDate: new Date(data.created_at),
    fullText: data.full_text || data.text, 
    language: data.lang || null, 
    placeLng: data.coordinates?.coordinates?.[0] || null, 
    placeLat: data.coordinates?.coordinates?.[1] || null, 
    placeDescription: data.place?.full_name || null, 
    
    latestStats: {
        tweetID: data.id_str,
        updateDate: new Date(), 
        retweetCount: data.retweet_count, 
        favoriteCount: data.retweeted_status ? data.retweeted_status.favorite_count : data.favorite_count, 
        replyCount: data.reply_count  || -1
    },
    author: data.user!=undefined ? UserService.normalize(data.user) : undefined
});

/**
 * Database - Creates a new row in `Tweet`
 * @param {TweetJSON} tweet TweetJSON with data to be added to database 
 * @returns {Promise}
 */
const create = tweet => new Promise((resolve, reject) => {
    if(tweet.tweetID == -1 || tweet.tweetID == undefined) return;
    const database = Connection.connections['tweet-main-write'];
    database.query('INSERT INTO Tweet SET ?', tweet, (error, results, fields)=>{
        database.release();
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        resolve(results);
    })
})

/**
 * Database - Read rows from `Tweet` table
 * @param {UserJSON|String} query_params Parameters to search | tweetID of Tweet to read
 * @returns {Promise<Array<TweetJSON>>}
 */
const read = (query_params) => new Promise((resolve, reject) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {tweetID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM Tweet ORDER BY creationDate ASC' : 'SELECT * FROM Tweet WHERE ? ORDER BY creationDate ASC';
    const database = Connection.connections['tweet-main-read'];
    database.query(query, query_params, (error, results, fields)=>{
        database.release();
        if(error) reject(error);
        if(results == undefined) reject();
        resolve(results);
    })
} )

/**
 * Database - Stream rows from `Tweet` table
 * @param {TweetJSON|String} query_params Parameters to search | tweetID of Tweet to read
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {VoidFunction}
 */
const stream = (query_params, {onError=()=>{}, onFields=()=>{}, onResult=()=>{}, onEnd=()=>{}}) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    //let query = query_params == undefined ? 'SELECT * FROM Tweet ORDER BY creationDate ASC' : 'SELECT * FROM Tweet WHERE ? ORDER BY creationDate ASC';
    let seedQuery = '';
    switch(seed){
        case 1:
            seedQuery = 'ORDER BY MAX DESC';
            break;
        case 2:
            seedQuery = 'ORDER BY RAND()';
            break;
        default:
        case 0:
            seedQuery = 'ORDER BY MAX ASC';
            break;
    }
    let query = 'SELECT * FROM view_util_crawler ' + seedQuery;
    const database = Connection.connections['tweet-main-read'];
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
            database.pause();
            await onResult(result);
            database.resume();
        })
}

/**
 * Database - Update row from `Tweet` table
 * @param {String} tweetID tweetID of row to update
 * @param {TweetJSON} tweet New tweet data
 * @returns {Promise}
 */
const update = (tweetID, tweet) => new Promise((resolve, reject) => {
    const database = Connection.connections['tweet-main-write'];
    database.query('UPDATE Users SET ? WHERE ?', [tweet, {tweetID}], (error, results, fields) => {
        database.release();
        if(error) reject(error);
        if(results == undefined) reject();
        resolve(results);
    })
})

/**
 * API - Fetches Tweet data from API
 * @param {String} tweetID tweetID to look in API
 * @returns {Promise<TweetJSONExtended>}
 */
const fetchAPI = (tweetID) => new Promise(async (resolve, reject) => {
    await Connection.Twitter.delay('statuses/show/:id');
    Connection.Twitter.get(`statuses/show/${tweetID}`, {tweet_mode: 'extended'}, (error, data, response) => {
        if(error) reject(error);
        if(data == undefined) reject(error);
        try{
            resolve(normalize(data)); 
        } catch(e){reject(e)}
    })
})

/**
 * API - Get HTML of Tweet
 * @param {String} tweetID tweetID to look in API
 * @returns {Promise<String>}
 */
const getCard = (tweetID) => new Promise((resolve, reject) => {
    Connection.Twitter.get('/statuses/oembed.json', {id: id, align: 'center', dnt: true}, (error, data, response) => {
        if(error) reject(error);
        else resolve(data.html);
    })
})

const TweetService = {normalize, create, read, stream, update, fetchAPI, getCard, TweetStatsService, TweetRetweetService, TweetEntitiesService};
module.exports = TweetService;
