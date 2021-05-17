const Connection = require("../../Data");
const SystemService = require("../System/SystemService");

/**
 * Database - Creates a new row in `UserFollower` table
 * @param {{userID: String, followerID: String}} param0 userID of _baseUser_ and _follower_
 * @returns {Promise}
 */
const create = ({userID, followerID}) => new Promise(async (resolve, reject) => {
    if(userID == undefined || userID == -1 || followerID == undefined || followerID == -1) resolve();
    const database = Connection.connections['user-followers-write'];
    let query = `INSERT INTO UserFollower SET ?`;
    database.query(query, {userID, followerID}, (error, results, fields)=>{
        database.release();
        if(error) reject(error);
        resolve(results)
    })
});

const bulkCreate = (values) => new Promise((resolve, reject)=>{
    const database = Connection.connections['user-followers-write'];
    let query = `SET FOREIGN_KEY_CHECKS = 0; INSERT INTO UserFollower (userID, followerID) VALUES ?; SET FOREIGN_KEY_CHECKS = 1;`;
    database.query(query, [values], (error, results, fields)=>{
        database.release();
        if(error) reject(error);
        resolve(results)
    })
})

/**
 * Database - Read rows from `UserFollower` table
 * @param {{userID: String, followerID: String}|String} query_params Parameters to search | userID of user to fetch
 * @returns {Promise<Array<{userID: String, followerID: String}>>}
 */
const read = (query_params) => new Promise(async (resolve, reject) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM UserFollower' : 'SELECT * FROM UserFollower WHERE ?';
    const database = Connection.connections['user-followers-read'];
    database.query(query, query_params, (error, result, fields) => {
        database.release();
        if(error) reject(error);
        resolve(result);
    })
})

const stream = async (query_params, { onError = ()=>{}, onFields = ()=>{}, onResult = ()=>{}, onEnd = ()=>{} }) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM UserFollower' : 'SELECT * FROM UserFollower WHERE ?';
    const database = Connection.connections['user-followers-read'];
    database.query(query, query_params)
        .on('end', ()=>{
            database.release();
            onEnd();
        })
        .on('error', onError)
        .on('fields', onFields)
        .on('result', async result=>{
            database.pause();
            await onResult(result)
            database.resume();
        })
}

/**
 * API - Fetch ids of followers
 * @param {String} userID ID of User to fetch followers from
 * @returns {Promise<Array<String>>}
 */
const fetchAPI = userID => new Promise(async (resolve, reject) => {
    if(userID == -1) return;
    await Connection.Twitter.delay('followers/ids');
    Connection.Twitter.get('followers/ids', {user_id: userID, cursor: -1}, (error, data, response) => {
        if(error) reject (error[0]);
        else if(data){
            resolve(data.ids)
        }
    })
});

const UserFollowerService = {create, bulkCreate, read, stream, fetchAPI};
module.exports = UserFollowerService;