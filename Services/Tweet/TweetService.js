const Connection = require("../../Data");
const UserService = require("../User/UserService");
const TweetRetweetService = require("./TweetRetweetService");
const TweetStatsService = require("./TweetStatsService");
/**
 * @typedef {Object} TweetJSON
 * @property {String} tweetID Unique identifier of tweet in Twitter and Database
 * @property {String} authorID Id of user who authored the tweet
 * @property {String} inReplyToUserID Id of user this tweet replies to
 * @property {String} inReplyToTweetID Id of tweet this tweet replies to
 * @property {String} quotesTweetID Id of tweet this tweet quotes
 * @property {Date} creationDate Date and time this tweet was published
 * @property {String} fullText Full text containing tweet's body
 * @property {String} language Detected language of this tweet
 * @property {Number} placeLng Longitude of tweet location
 * @property {Number} placeLat Latitude of tweet location
 * @property {String} placeDescription Description of tweet location
 * 
 * @property {TweetStatsJSON} latestStats Latest statistical data
 * @property {UserJSON} author UserJSON object containing author info
 * @property {UserJSON} repliedUser UserJSON object of user this tweet replies to
 * @property {TweetJSON} repliedTweet TweetJSON object of tweet this tweet replies to
 * @property {TweetJSON} quotedTweet TweetJSON object of tweet this tweet quotes
 */

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
 * Transform Twitter API 1.1 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v1.1
 * @returns {TweetJSON}
 */
const normalize = data => ({
    tweetID: data.id_str, 
    authorID: data.user.id_str, 
    creationDate: new Date(data.created_at), 
    fullText: data.full_text || data.text, 
    language: data.lang || null, 
    placeLng: data.coordinates?.coordinates?.[0] || null,
    placeLat: data.coordinates?.coordinates?.[1] || null,
    placeDescription: data.place?.full_name || null,
    
    inReplyToUserID: data.in_reply_to_user_id_str || -1, 
    inReplyToTweetID: data.in_reply_to_status_id_str || -1, 
    quotesTweetID: data.quoted_status_id_str || -1, 
    
    latestStats: TweetStatsService.normalize(data), 
    author: UserService.normalize(data.user),
    quotedTweet: data.quoted_status ? normalize(data.quoted_status) : undefined
})


/**
 * Transforms Twitter API 2 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v2
 * @returns {TweetJSON}
 */
const normalize_v2 = data => ({
    tweetID: data.id, 
    authorID: data.author_id, 
    creationDate: new Date(data.created_at), 
    fullText: data.text, 
    language: data.lang || null,
    placeLng: data.geo?.coordinates?.coordinates[0] || null, 
    placeLat: data.geo?.coordinates?.coordinates[1] || null, 
    // TODO: Parse with geo
    placeDescription: data.geo?.place_id, 
    inReplyToUserID: data.in_reply_to_user_id,
    inReplyToTweetID: data.referenced_tweets?.find?.(t => t.type == 'replied_to')?.id || undefined,
    quotesTweetID: data.referenced_tweets?.find?.(t => t.type == 'quoted')?.id || undefined,

    latestStats: TweetStatsService.normalize_v2(data),
})

/**
 * API v1.1 - Fetch tweet
 * @param {String} tweetID Tweet id to fetch in API
 * @returns {Promise<TweetJSON>}
 */
const fetchAPI = tweetID => new Promise((resolve, reject) => {
    Connection.Twitter.get(`1.1/statuses/show`,  {id: tweetID, tweet_mode: 'extended'}, (error, data, response)=>{
        if(error) reject(error);
        try{
            resolve(normalize(data))
        } catch(e){reject(e)}
    })
})

/**
 * Database - Creates a new tweet in database
 * @param {TweetJSON} tweetJSON Tweet data to insert to database
 * @returns {Promise}
 */
const create = (tweetJSON) => new Promise((resolve, reject) => {
    // Do not create if empty or null
    if(tweetJSON.tweetID == undefined || tweetJSON.tweetID == -1) return resolve();
    Connection.connections['tweet-main-write'].query('INSERT INTO Tweet SET ?', tweetJSON, (error, results, fields) => {
        // Reject on error
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        // Else return newly added row
        else resolve(tweetJSON);
    })
});

/**
 * Database - Get all tweets that match criteria
 * @param {TweetJSON|String} params Conditions to search matches
 * @returns {Promise<Array<TweetJSON>>}
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
 * Database - Live streams results of all the tweets that match criteria. Recommended when expecting large results
 * @param {TweetJSON|String} params Conditions to search matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
 const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params};
    // If no params, return all
    const query = params == undefined ? 'SELECT * FROM Tweet' : 'SELECT * FROM Tweet WHERE ?';
    Connection.connections['tweet-main-read'].query(query, params)
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result => {
            Connection.connections['tweet-main-read'].pause();
            await onResult(result);
            Connection.connections['tweet-main-read'].resume();
        })
        .on('end', async ()=>{
            await onEnd();
            resolve();
        })
});

/**
 * Database - Update tweet with new data
 * @param {String} tweetID Tweet id of row to update
 * @param {TweetJSON} tweet Data to be updated
 * @returns {Promise}
 */
 const update = (userID, user) => new Promise((resolve, reject) => {
    Connection.connections['tweet-main-write'].query('UPDATE Tweet SET ? WHERE ?', [user, {userID}], (error, result, fields) => {
        if(error) reject(error);
        else resolve(user);
    })
})

const TweetService = {normalize, normalize_v2, fetchAPI, create, read, stream, update, TweetStatsService, TweetRetweetService};
module.exports = TweetService;