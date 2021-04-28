let Connection = require('../../Data/index');

/**
 * @typedef {Object} UserStatsJSON
 * @property {String} userID ID of User in Twitter these stats correspond to
 * @property {Number} followersCount Number of Users that follow this account
 * @property {Number} followingCount Number of Users this account follows
 * @property {Number} listedCount Number of lists this account appears in 
 * @property {Number} favoritesCount Number of Tweets this account has liked
 * @property {Number} statusesCount Number of Tweets (including cites and quotes) this account has posted
 * @property {Date} updateDate Date of last update
 */

/**
 * Database - Creates a new row in `UserStatsFreeze` table
 * @param {UserStatsJSON} userStats UserStatsJSON data to be inserted into table
 * @returns {Promise}
 */
const create = (userStats) => new Promise(async (resolve, reject) => {
    const database = await Connection.connections['user-stats-write'];
    database.query('INSERT INTO UserStatsFreeze SET ?', userStats, (error, result, fields) => {
        database.release();
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        resolve(result);
    })
})

/**
 * Database - Read rows from `UserStatsFreeze` table
 * @param {UserStatsJSON|String} query_params Parameters to search | userID of user to fetch 
 * @returns {Promise<Array<UserStatsJSON>>}
 */
const read = (query_params) => new Promise(async (resolve, reject) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM UserStatsFreeze' : 'SELECT * FROM UserStatsFreeze WHERE ?';
    const database = await Connection.connections['user-stats-read'];
    database.query(query, query_params, (error, result, fields) => {
        database.release();
        if(error) reject(error);
        resolve(result);
    })
});

const stream = async (query_params, { onError = ()=>{}, onFields = ()=>{}, onResult = ()=>{}, onEnd = ()=>{} })=>{
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM UserStatsFreeze' : 'SELECT * FROM UserStatsFreeze WHERE ?';
    /**@type {import('mysql').PoolConnection}*/ const database = await Connection.connections['user-stats-read'];
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

const UserStatsService = {create, read, stream}
module.exports = UserStatsService;