const Connection = require("../../Data");

/**
 * Get number of times user A and B retweeted the same person
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<Number>}
 */
const getCommonRetweets = (a, b) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-retweets-read'].query(`
        SELECT COUNT(DISTINCT authorID) AS count FROM 
        (
            SELECT
                Tweet.authorID 
            FROM Tweet JOIN TweetRetweet USING (tweetID)
            WHERE TweetRetweet.authorID = ${a}
        ) AS a_retweets
        JOIN
        (
            SELECT
                Tweet.authorID
            FROM Tweet JOIN TweetRetweet USING (tweetID)
            WHERE TweetRetweet.authorID = ${b}
        ) AS b_retweets 
        USING (authorID)
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count)
    })
})

/**
 * Get number of retweets from user
 * @param {String} a Id of user
 * @returns {Promise<Number>}
 */
const countRetweets = (a) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-retweets-read'].query(`
        SELECT COUNT(DISTINCT tweetID) AS count FROM TweetRetweet WHERE authorID=${a}
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result?.[0]?.count);
    })
})

/**
 * Get number of retweets from user A to B
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<Number>}
 */
const countRetweetsBetweenUsers = (a, b) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-retweets-read'].query(`
        SELECT COUNT(DISTINCT tweetID) AS count
        FROM TweetRetweet
        JOIN Tweet USING (tweetID)
        WHERE TweetRetweet.authorID=${a} AND Tweet.authorID=${b}
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result?.[0]?.count);
    })
})

const calculate = async (a, b) => {
    // sim_retweet(i, j) = c_retweet/(sqrt(R_i) + sqrt(R_j)) + (n_{ij} + n_{ji})/(R_i * R_j)
    let commonRetweets = await getCommonRetweets(a, b) || 0;
    let aRetweets = await countRetweets(a) || 1;
    let bRetweets = await countRetweets(b) || 1;
    let aRetweetsToB = await countRetweetsBetweenUsers(a, b) || 0;
    let bRetweetsToA = await countRetweetsBetweenUsers(b, a) || 0;

    return (commonRetweets/( Math.sqrt(aRetweets) * Math.sqrt(bRetweets) ) || 0) + ((aRetweetsToB + bRetweetsToA)/(aRetweets * bRetweets) || 0) ;
}


const UserRelationRetweetsAnalysis = {calculate};
module.exports = UserRelationRetweetsAnalysis;