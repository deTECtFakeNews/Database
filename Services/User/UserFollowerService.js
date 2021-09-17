const Connection = require("../../Data");

/**
 * API v1.1 - Fetches last 500 ids of user followers
 * @param {String} userID User id to fetch in API
 * @param {{next_cursor: String}} options Options
 * @returns {Promise<{ids:Array<String>, next_cursor:String}>}
 */
const fetchAPI = (userID, options = {}) => new Promise((resolve, reject) => {
    // Skip for empty or null users
    if(userID == -1 || userID == undefined) resolve([]);
    Connection.Twitter.get('1.1/followers/ids', {user_id: userID, cursor: options?.next_cursor ||-1, count: 5000}, (error, data, response) => {
        if(error) reject(error);
        if(data?.next_cursor_str == undefined) reject("Undefined next cursor");
        else resolve({
            ids: data?.ids, 
            next_cursor: data?.next_cursor_str
        });
    })
})

/**
 * API v1.1 - Fetches last 500 ids of user followers
 * @param {String} userID User id to fetch in API
 * @param {{next_cursor: String}} options Options
 * @returns {Promise<{ids:Array<String>, next_cursor:String}>}
 */
const fetchAPIFollowings = (userID, options = {}) => new Promise((resolve, reject) => {
    // Skip for empty or null users
    if(userID == -1 || userID == undefined) resolve([]);
    Connection.Twitter.get('1.1/friends/ids', {user_id: userID, cursor: options?.next_cursor ||-1, count: 5000}, (error, data, response) => {
        if(error) reject(error);
        if(data?.next_cursor_str == undefined) reject("Undefined next cursor");
        else resolve({
            ids: data?.ids, 
            next_cursor: data?.next_cursor_str
        });
    })
})

/**
 * Database - Creates a new connection between users
 * @param {{userID: String, followerID: String}} param0 Data to be inserted (userID of base user and follower)
 * @returns {Promise}
 */
const create = ({userID, followerID}) => new Promise((resolve, reject) => {
    if(userID == undefined || userID == -1) return resolve();
    if(followerID == undefined || followerID == -1) return resolve();
    Connection.connections['user-followers-write'].query('INSERT INTO UserFollower SET ?', {userID, followerID}, (error, results, fields) => {
        if(error) reject(error);
        else resolve();
    })
})

/**
 * Database - Creates many connections between pairs of users
 * @param {Array<Array<String>>} pairValues Array containing pairs of user and follower (i.e., `[user, follower]`)
 * @returns {Promise}
 */
const createMany = pairValues => new Promise((resolve, reject) => {
    Connection.connections['user-followers-write']
        // Foreign keys are disabled to speed up creation. Unassociated records are removed afterwards
        .query('SET FOREIGN_KEY_CHECKS=0; INSERT IGNORE INTO UserFollower (userID, followerID) VALUES ?; SET FOREIGN_KEY_CHECKS=1;', [pairValues], (error, results, fields) => {
            if(error) reject(error)
            else resolve();
        })
}) 

/**
 * Database - Removes all unexistant followers of user
 * @param {String} userID User id to remove unexistant followers from
 * @returns {Promise}
 */
const removeUnexistant = userID => new Promise((resolve, reject) => {
    Connection.connections['user-followers-write'].query(`
        DELETE FROM UserFollower
        WHERE userID = ${userID} AND followerID NOT IN (
            SELECT * FROM (
                SELECT UserFollower.followerID
                FROM UserFollower
                LEFT JOIN User ON User.userID = UserFollower.followerID
                WHERE User.userID IS NULL
            ) AS A
        )
    `, (error, results, fields) => {
        if(error) reject(error)
        else resolve();
    })
})

/**
 * Database - Get all user-follower pairs that match criteria
 * @param {{userID: String, followerID: String}|String} params Conditions to search matches
 * @returns {Promise<Array<{userID: String, followerID: String}>>}
 */
const read = (params) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params};
    // If no params return all
    const query = params == undefined ? 'SELECT * FROM UserFollower' : 'SELECT * FROM UserFollower WHERE ?';
    Connection.connections['user-followers-read'].query(query, params, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results);
    })
})

/**
 * Database - Live streams results of all user-follower pairs that match criteria. Recommended when expecting large results
 * @param {{UserID: String, followerID: String}|String} params Conditions to search matches
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {Promise}
 */
 const stream = (params, {onError = function(){}, onFields = function(){}, onResult = function(){}, onEnd = function(){}}) => new Promise((resolve, reject) => {
    // If params is a string, assume userID
    if(typeof params === 'string' || typeof params === 'number') params = {userID: params};
    // If no params, return all
    const query = params == undefined ? 'SELECT * FROM UserFollower' : 'SELECT * FROM UserFollower WHERE ?';
    Connection.connections['user-followers-read'].query(query, params)
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result => {
            Connection.connections['user-followers-read'].pause();
            await onResult(result);
            Connection.connections['user-followers-read'].resume();
        })
        .on('end', async ()=>{
            await onEnd();
            resolve();
        })
});


// TODO: Remove and replace
// These exist only ofr compatibility
const bulkCreate = createMany;
const purge = removeUnexistant;

const UserFollowerService = {fetchAPI, fetchAPIFollowings, create, createMany, removeUnexistant, read, stream, bulkCreate, purge}
module.exports = UserFollowerService;