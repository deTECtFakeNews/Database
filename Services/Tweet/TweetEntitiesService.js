const Connection = require("../../Data");
const UserService = require("../User/UserService");

/**
 * @typedef {Object} TweetEntityJSON
 * @property {String} tweetID Id of Tweet this entitiy belongs to
 * @property {'userMention'|'hashtag'|'symbol'|'url'|String} type Type of entity
 * @property {String} value Value of entity (parsed)
 */

/**
 * Extract grouped entities from text
 * @param {String} text Text to extract entities from
 * @returns {{mentions: Array<String>, hashtags: Array<String>, symbols: Array<String>, urls: Array<String>}}
 */
 const get = (text) => {
    // Mentions - Single words after @
    let mentions = text.match(/\B@\w+/g) || [];
    // Hashtags - Single words after #
    let hashtags = text.match(/\B\#\w+/g) || [];
    // Symbols - Single words after $
    let symbols = text.match(/\B\$\w+/g) || [];
    // URLS
    let urls = text.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)|| [];
    urls.pop();
    // Get mentions as ids
    return {mentions, hashtags, symbols, urls}
}

/**
 * Parses entities, fetches mentions user ID's and groups them in array
 * @param {{mentions: Array<String>, hashtags: Array<String>, symbols: Array<String>, urls: Array<String>}} param0 Entities object to parse and analyze
 * @returns {Promise<Array<TweetEntityJSON>>}
 */
const parse = async ({mentions, hashtags, symbols, urls}) => {
    let mentionsParsed = await Promise.all(mentions.map( async mention => {
        try{
            let userID = await UserService.screenNameUserID(mention.substr(1));
            return {type: 'userMention', value: userID}
        } catch(e){
            return {type: 'userMention', value: mention.substr(1)}
        }
    }));
    let hashtagsParsed = hashtags.map(value => ({type: 'hashtag', value: value.substr(1)}))
    let symbolsParsed = symbols.map(value => ({type: 'symbol', value: value.substr(1)}))
    let urlsParsed = urls.map(value => ({type: 'url', value}))
    return [...mentionsParsed, ...hashtagsParsed, ...symbolsParsed, ...urlsParsed]
}

/**
 * Extracts entities from text and returns parsed array
 * @param {String} text Text to extract entities from
 * @returns {Promise<Array<TweetEntityJSON>>}
 */
const getAndParse = async text => {
    return await parse( get(text) );
}

/**
 * Database - Creates a new row in `TweetEntities`
 * @param {TweetEntityJSON} tweetEntity TweetEntitiyJSON with data to be added 
 * @returns {Promise}
 */
const create = (tweetID, tweetEntity) => new Promise(async (resove, reject) => {
    const database = await Connection.connections['tweet-entities-write'];
    let query = `
        INSERT INTO TweetEntities (tweetID, type, value)
        SELECT ${tweetID}, '${tweetEntity.type}', '${tweetEntity.value}' FROM DUAL
        WHERE NOT EXISTS (
            SELECT * FROM TweetEntities 
            WHERE tweetID=${tweetID} AND type='${tweetEntity.type}' AND value='${tweetEntity.value}'
        );
    `;
    database.query(query, (error, results, fields) => {
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        resolve(results);
    })
})


/**
 * Database - Read rows from `TweetEntities` table
 * @param {TweetEntityJSON|String} query_params Parameters to search | tweetID of TweetEntities to read
 * @returns {Promise<Array<TweetEntityJSON>>}
 */
 const read = (query_params) => new Promise( async (resolve, reject) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {tweetID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM TweetEntities' : 'SELECT * FROM TweetEntities WHERE ?';
    const database = await Connection.connections['tweet-entities-read'];
    database.query(query, query_params, (error, results, fields)=>{
        database.release();
        if(error) reject(error);
        if(results == undefined) reject();
        resolve(results);
    })
} )

/**
 * Database - Stream rows from `TweetEntities` table
 * @param {TweetEntityJSON|String} query_params Parameters to search | tweetID of TweetEntities to read
 * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} param1 Callback functions
 * @returns {VoidFunction}
 */
 const stream = async (query_params, {onError=()=>{}, onFields=()=>{}, onResult=()=>{}, onEnd=()=>{}}) => {
    if(typeof query_params == 'string' || typeof query_params == 'number'){
        query_params = {tweetID: query_params}
    }
    let query = query_params == undefined ? 'SELECT * FROM TweetEntities' : 'SELECT * FROM TweetEntities WHERE ?';
    const database = await Connection.connections['tweet-entities-read'];
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

const TweetEntitiesService = {create, read, stream, getAndParse, parse, get};
module.exports = TweetEntitiesService;