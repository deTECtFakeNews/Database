var twitterText = require('twitter-text');
const Connection = require("../../Data");

/**
 * @typedef {Object} TweetEntityJSON
 * @property {String} tweetID Id of tweet
 * @property {('hashtag'|'cashtag'|'mention'|'url')} type Type of entity
 * @property {String} value Value of entity
 */

/**
 * Text - Extract entities
 * @param {String} text Text to extract entities from
 * @returns {Array<TweetEntityJSON>}
 */
const extract = text => {
    let hashtags = twitterText.extractHashtags(text).map(value=>({type: 'hashtag', value}));
    let cashtags = twitterText.extractCashtags(text).map(value=>({type: 'cashtag', value}));
    let mentions = twitterText.extractMentions(text).map(value=>({type: 'mention', value}));
    let urls = twitterText.extractUrls(text).map(value=>({type: 'url', value}));
    return [...hashtags, ...cashtags, ...mentions, ...urls];
}

/**
 * Database - Creates a ner entity row in database
 * @param {TweetEntityJSON} tweetEntityJSON Entity data to insert to database
 * @returns {Promise}
 */
const create = tweetEntityJSON => new Promise((resolve, reject) => {
    // Do not create if empty or null
    if(tweetEntityJSON.tweetID == undefined || tweetEntityJSON.tweetID == -1) return resolve();
    Connection.connections['tweet-entities-write'].query('INSERT INTO TweetEntities SET ?', tweetEntityJSON, (error, results, fields) => {
        // Reject on error
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        // Else return newly added row
        else resolve(tweetEntityJSON);
    })
})

/**
 * Database - Creates many connections between pairs of users
 * @param {Array<Array<String>>} arrayValues Array containing tweetID, type and value
 * @returns {Promise}
 */
const createMany = arrayValues => new Promise((resolve, reject)=>{
    Connection.connections['tweet-entities-write'].query('INSERT IGNORE INTO TweetEntities (tweetID, type, value) VALUES ?', [arrayValues], (error, result, fields) => {
        if(error) reject(error);
        else resolve();
    })
})

const expandURL = text => {
    // return twitterText.link
}

const TweetEntityService = {extract, create, createMany, expandURL};
module.exports = TweetEntityService;