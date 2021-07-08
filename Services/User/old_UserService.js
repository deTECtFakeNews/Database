let Connection = require('../../Data/index');
const SystemService = require('../System/SystemService');
const UserFollowerService = require('./UserFollowerService');
const UserStatsService = require('./old_UserStatsService');

/** 
 * @typedef {Object} UserJSON
 * @property {String} userID ID of User in Twitter
 * @property {Date} creationDate Date and time of account creation
 * @property {String} fullName Full name description
 * @property {String} screenName User handle (e.g., \@edvilme)
 * @property {String} biography Profile description
 * @property {Boolean} isProtected Is protected
 * @property {Boolean} isVerified If Twitter has verified the account with a blue check
 * @property {String} language Language of preference of User
 * @property {String} placeDescription Place description in User's profile.
 * @property {UserStatsJSON} latestStats
 */

/**
 * Transforms Twitter API User Object to User interface
 * @param {Object} data Twitter API User Object
 * @returns {UserJSON}
 */
const normalize = data => ({
    userID: data.id_str, 
    creationDate: new Date(data.created_at), 
    fullName: data.name, 
    screenName: data.screen_name, 
    biography: data.description,
    isProtected: data.protected, 
    isVerified: data.verified, 
    language: data.lang, 
    placeDescription: data.location,
    latestStats: {
        userID: data.id_str,
        followersCount: data.followers_count, 
        followingCount: data.friends_count, 
        listedCount: data.listed_count, 
        favoritesCount: data.favourites_count, 
        statusesCount: data.statuses_count, 
        updateDate: new Date()
    }
});

/**
 * Database - Creates a new row in `User` table
 * @param {UserJSON} user UserJSON with data to be added to database
 * @returns {Promise}
 */
const create = (user) => new Promise((resolve, reject) => {
    if(user.userID == undefined || user.userID == -1) return;
    const database = Connection.connections['user-main-write'];
    database.query('INSERT INTO User SET ?', user, (error, results, fields)=>{
        database.release();
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        resolve(results || []);
    });
})

/**
 * Database - Read rows from `User` table
 * @param {UserJSON|String} query_params Parameters to search | userID of User to read
 * @returns {Promise<Array<UserJSON>>>}
 */
const read = (query_params) => new Promise((resolve, reject) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM User' : 'SELECT * FROM User WHERE ?';
    const database = Connection.connections['user-main-read'];
    database.query(query, query_params, (error, result, fields) => {
        database.release();
        if(error) reject (error);
        if(result == undefined) reject();
        resolve(result);
    })
});

/**
 * Database - Stream rows from `User` table
 * @param {UserJSON|String} query_params Parameters to search | userID of User to fetch
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {VoidFunction}
 */
const stream = (query_params, { onError = ()=>{}, onFields = ()=>{}, onResult = ()=>{}, onEnd = ()=>{} } ) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    let query = `
        SELECT User.* FROM User 
            JOIN UserStatsFreeze USING (userID)
            LEFT JOIN UserFollower USING (userID)
            WHERE UserStatsFreeze.followersCount >= 10000 AND UserFollower.userID IS NULL GROUP BY userID ORDER BY UserStatsFreeze.followersCount DESC
    `
    // let query = query_params == undefined ? 'SELECT * FROM User' : 'SELECT * FROM User WHERE ?';
    const database = Connection.connections['user-main-read'];
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
 * Database - Update row from `User` table
 * @param {String} userID userID of row to update
 * @param {UserJSON} user New user data
 * @returns {Promise}
 */
const update = (userID, user) => new Promise((resolve, reject) => {
    const database = Connection.connections['user-main-write'];
    database.query(`UPDATE Users SET ? WHERE ?`, [user, {userID}], (error, result, fields)=>{
        database.release();
        if(error) reject (error);
        if(result == undefined) reject();
        resolve(result);
    })
});

/**
 * API - Fetches User data from API
 * @param {String} userID userID to look in API
 * @returns {Promise<UserJSON>}
 */
const fetchAPI = (userID) => new Promise(async (resolve, reject) => {
    await Connection.Twitter.delay('users/show');
    Connection.Twitter.get('1.1/users/show', {user_id: userID}, (error, data, response) => {
        if(error) reject(error);
        if(data==undefined) reject();
        resolve(normalize(data));
    })
})

/**
 * API - Given a screenName, fetch user data
 * @param {String} screenName User handle to look in Twitter API
 * @returns {Promise<String>}
 */
const fetchAPI_id = (screenName) => new Promise(async (resolve, reject) => {
    await Connection.Twitter.delay('users/show');
    Connection.Twitter.get('1.1/users/show', {screen_name: screenName}, (error, data, response) => {
        if(error) reject(error);
        if(data == undefined) reject();
        resolve(data.id)
    })
})

/**
 * Get userID of screenName
 * @param {String} screenName User hangle to look in Database or Twitter API
 * @returns {Promise <String>}
 */
const screenNameUserID = async (screenName) => {
    try{
        let userInDB = await read({screenName})[0].userID;
        return userInDB;
    } catch(e){
        try{
            let userInAPI = await fetchAPI_id(screenName);
            return userInAPI;
        } catch(e){
            return -1;
        }
    }
}

const UserService = {normalize, create, read, stream, update, fetchAPI, screenNameUserID, UserStatsService, UserFollowerService};
module.exports = UserService;