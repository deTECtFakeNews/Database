const Connection = require("../../Data")
const UserFollowerService = require("./UserFollowerService")
const UserStatsService = require("./UserStatsService")

/**
 * @typedef {Object} UserJSON
 * @property {String} userID Unique identifier of user in Twitter and Database
 * @property {Date} creationDate Date and time of account creation
 * @property {String} fullName Full name of user account
 * @property {String} screenName Twitter username (e.g., \@edvilme)
 * @property {String} biography Profile description (can contain entities)
 * @property {Boolean} isProtected Is account protected/private?
 * @property {Boolean} isVerified Is account's identity verified by Twitter?
 * @property {String} language User's language preference
 * @property {String} placeDescription Place selected by user to be displayed on their profile
 * @property {UserStatsJSON} latestStats Latest statistical data 
 */


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

/**
 * Transforms Twitter API 1.1 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v1.1
 * @returns {UserJSON}
 */
const normalize = data => ({
    userID: data.id_str,
    creationDate: new Date(data.created_at), 
    fullName: data.name, 
    screenName: data.screen_name, 
    biography: data.biography, 
    isProtected: data.protected, 
    isVerified: data.verified, 
    language: data.lang, 
    placeDescription: data.location, 
    // Optional (pass data to UserStatsService for normalization)
    latestStats: UserStatsService.normalize(data)
})

/**
 * Transforms Twitter API 2 JSON into a cannonical structure
 * @param {Object} data Twitter JSON returned from API v2
 * @returns {UserJSON}
 */
const normalize_v2 = data => ({
    userID: data.id, 
    creationDate: new Date(data.created_at), 
    fullName: data.name, 
    screenName: data.username, 
    biography: data.description, 
    isProtected: data.protected, 
    isVerified: data.verified,
    // This feature is no longer supported for v2
    language: undefined,
    placeDescription: data.location, 
    // Optional (pass data to UserStatsService for normalization)
    latestStats: UserStatsService.normalize_v2(data)
})

/**
 * API v1.1 - Fetch user
 * @param {String} userID User id to fetch in API
 * @returns {Promise<UserJSON>}
 */
const fetchAPI = (userID) => new Promise((resolve, reject) => {
    Connection.Twitter.get('1.1/users/show', {user_id: userID}, (error, data, response) => {
        if(error) reject(error);
        if(data != undefined) resolve( normalize(data) );
        // If data is undefined, return an empty object
        else resolve({})
    })
})

/**
 * API v1.2 - Fetch user
 * @param {String} userID User id to fetch in API
 * @returns {Promise<UserJSON>}
 */
const fetchAPI_v2 = (userID) => new Promise((resolve, reject) => {
    Connection.Twitter.get(`https://api.twitter.com/2/users/${userID}`, {
        'user.fields': 'created_at,description,entities,id,location,name,protected,public_metrics,url,username,verified'
    }, (error, data, response) => {
        if(error) reject(error);
        if(data != undefined) resolve( normalize_v2(data) );
        // If data is undefined, return an empty object
        else resolve({})
    })
})

/**
 * Database - Creates a new user in database
 * @param {UserJSON} userJSON User data to insert to database
 * @returns {Promise}
 */
const create = (userJSON) => new Promise((resolve, reject) => {
    // Do not create if empty or null
    if(userJSON.userID == undefined || userJSON.userID) return resolve();
    Connection.connections['user-main-write'].query('INSERT INTO User SET ?', userJSON, (error, results, fields) => {
        // Reject on error
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        // Else return newly added row
        else resolve(userJSON)
    })
})

/**
 * Database - Get all users that match criteria
 * @param {UserJSON|String} params Conditions to search matches
 * @returns {Promise<Array<UserJSON>>}
 */
const read = (params) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params};
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM User' : 'SELECT * FROM User WHERE ?';
    Connection.connections['user-main-read'].query(query, params, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results);
    })
})

/**
 * Database - Live streams results of all the user that match criteria. Recommended when expecting large results
 * @param {UserJSON|String} params Conditions to search matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params};
    // If no params, return all
    const query = params == undefined ? 'SELECT * FROM User' : 'SELECT * FROM User WHERE ?';
    Connection.connections['user-main-read'].query(query, params)
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result => {
            Connection.connections['user-main-read'].pause();
            await onResult(result);
            Connection.connections['user-main-read'].resume();
        })
        .on('end', async ()=>{
            await onEnd();
            resolve();
        })
});

/**
 * Database - Update user with new data
 * @param {String} userID User id of row to update
 * @param {UserJson} user Data to be updated
 * @returns {Promise}
 */
const update = (userID, user) => new Promise((resolve, reject) => {
    Connection.connections['user-main-write'].query('UPDATE Users SET ? WHERE ?', [user, {userID}], (error, result, fields) => {
        if(error) reject(error);
        else resolve(user);
    })
})

const UserService = {normalize, normalize_v2, fetchAPI, fetchAPI_v2, create, read, stream, update, UserStatsService, UserFollowerService};
module.exports = UserService;