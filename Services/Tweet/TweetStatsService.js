const Connection = require("../../Data");

/**
 * @typedef {TweetStatsJSON} 
 * @property {String} tweetID Id of Tweet in Twitter these stats correspond to
 * @property {Date} updateDate Date this stats were fetched
 * @property {Number} retweetCount Number of times this Tweet has been retweeted
 * @property {Number} favoriteCount Number of times people have liked this Tweet
 * @property {Number} replyCount Number of Tweets that reply to this Tweet
 * */


const create = (tweetStats) => new Promise(async (resolve, reject) => {
    const database = await Connection.connections['tweet-stats-write'];
    database.query('INSERT INTO TweetStatsFreeze SET ?', tweetStats, (error, results, fields) => {
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        if(results == undefined) reject();
        resolve(results);
    })
})

const read = (query_params) => new Promise(async (resolve, reject) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {tweetID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM TweetStatsFreeze' : 'SELECT * FROM TweetStatsFreeze WHERE ?';
    const database = await Connection.connections['tweet-stats-read'];
    database.query(query, query_params, (error, results, fields)=>{
        if(error) reject(error);
        if(results == undefined) reject();
        resolve(results);
    })
})

const stream = async (query_params, {onError=()=>{}, onFields=()=>{}, onResult=()=>{}, onEnd=()=>{}}) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {userID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM TweetStatsFreeze' : 'SELECT * FROM TweetStatsFreeze WHERE ?';
    const database = await Connection.connections['tweet-stats-read'];
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

const update = async (tweetID, tweetStats) => new Promise(async (resolve, reject) => {
    const database = await Connection.connections['tweet-stats-write'];
    database.query('UPDATE TweetStatsFreeze SET ? WHERE ?', [tweetStats, {tweetID}], (error, results, fields)=>{
        if(error) reject(error);
        resolve(results);
    })
})

const TweetStatsService = {create, read, stream, update};
module.exports = TweetStatsService;
