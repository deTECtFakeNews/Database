const Connection = require("../../Data");
const UserService = require('../User/UserService');
// const {normalize} = require('./TweetService');

/**
 * @typedef {Object} TweetRetweetJSON
 * @property {String} tweetID Id of Tweet being retweeted
 * @property {String} authorID Id of User who published the retweet
 * @property {Date} creationDate Date of retweet
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
        favoriteCount: data.favorite_count, 
        replyCount: data.reply_count
    },
    author: UserService.normalize(data.user)
});

/**
 * Database - Creates a new row in `TweetRetweet` table
 * @param {TweetRetweetJSON} tweetRetweet TweetRetweetJSON with data to be added to database
 * @returns {Promise}
 */
const create = (tweetRetweet) => new Promise((resolve, reject) => {
    console.log(tweetRetweet)
    // if(tweetRetweet.tweetID == -1 || tweetRetweet.tweetID == undefined || tweetRetweet.userID == undefined || tweetRetweet.creationDate == undefined) return;
    const database = Connection.connections['tweet-retweet-write'];
    database.query('INSERT INTO TweetRetweet SET ?', tweetRetweet, (error, results, fields) => {
        database.release();
        console.log('done')
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        resolve();
    })
})


const bulkCreate = (values) => new Promise((resolve, reject) => {
    const database = Connection.connections['tweet-retweet-write'];
    database.query('INSERT IGNORE INTO TweetRetweet (tweetID, authorID, creationDate) VALUES ?', [values], (error, results, fields) => {
        database.release();
        if(error) reject(error);
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
const fetchAPI = (tweetID, {count} = {count: 100, trim_user: false}) => new Promise(async (resolve, reject) => {
    await Connection.Twitter.delay('statuses/retweets/:id');
    Connection.Twitter.get('/statuses/retweets', {id: tweetID, count}, (error, data, response)=>{
        if(error) reject(error);
        if(data==undefined || !Array.isArray(data)) reject();
        resolve(data.map(normalize))
    })
})

const TweetRetweetService = {create, read, stream, fetchAPI}
module.exports = TweetRetweetService;
