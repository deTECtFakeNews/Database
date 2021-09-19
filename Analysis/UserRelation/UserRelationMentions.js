const Connection = require("../../Data");

/**
 * Counts the weighted mentions (1/mentions_in_tweet) made by both users to the same accounts
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<Number>}
 */
const getCommonWeightedMentions = (a, b) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-entities-read'].query(`
        SELECT COUNT(DISTINCT mentionedUser) AS count FROM
        (
            SELECT
                TweetEntities.value AS mentionedUser,
                COUNT(*) AS a_count
            FROM TweetEntities
            JOIN Tweet USING (tweetID)
            WHERE Tweet.authorID = ${a}
            AND TweetEntities.value != ${a}
            AND TweetEntities.type = 'userMention'
            GROUP BY TweetEntities.value
        ) AS a_mentions
        JOIN
        (
            SELECT
                TweetEntities.value AS mentionedUser,
                COUNT(*) AS b_count
            FROM TweetEntities
            JOIN Tweet USING (tweetID)
            WHERE Tweet.authorID = ${b}
            AND TweetEntities.value != ${b}
            AND TweetEntities.type = 'userMention'
            GROUP BY TweetEntities.value
        ) AS b_mentions
        USING (mentionedUser)
    `, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results?.[0]?.count);
    })
})

/**
 * Counts the (weighted) mentions made by user A
 * @param {String} a Id of user A
 * @returns {Promise<Number>}
 */
const countMentions = (a) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-entities-read'].query(`
        SELECT
            COUNT(DISTINCT tweetID) AS count
        FROM TweetEntities
        JOIN Tweet USING (tweetID)
        WHERE TweetEntities.type = 'userMention'
        AND TweetEntities.value != ${a}
        AND Tweet.authorID = ${a};
    `, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results?.[0]?.count);
    })
})

/**
 * Counts the (weighted) mentions made by user A to B
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<Number>}
 */
const countMentionsToUser = (a, b) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-entities-read'].query(`
        SELECT
            COUNT(DISTINCT tweetID) AS count
        FROM TweetEntities
        JOIN Tweet USING (tweetID)
        WHERE TweetEntities.type = 'userMention'
        AND TweetEntities.value != ${a}
        AND TweetEntities.value = ${b}
        AND Tweet.authorID = ${a};
    `, (error, results, fields) => {
        if(error) reject(error);
        else resolve(results?.[0]?.count);
    })
})

const calculate = async (a, b) => {
    // sim_mentions(i, j) = (c_w_mentions/( sqrt(mentions_i) * sqrt(mentions_j) )) + (n_ij + nji)/(mentions_i*mentions_j)
    let commonWeightedMentions = await getCommonWeightedMentions(a, b);
    let aMentions = await countMentions(a);
    let bMentions = await countMentions(b);
    let aMentionsToB = await countMentionsToUser(a, b);
    let bMentionsToA = await countMentionsToUser(b, a);
    if(aMentions * bMentions == 0 || aMentions*bMentions == NaN) return 0;
    return (commonWeightedMentions/( Math.sqrt(aMentions) * Math.sqrt(bMentions) )) + (aMentionsToB + bMentionsToA)/(aMentions * bMentions);
};


const UserRelationMentionsAnalysis = {calculate};
module.exports = UserRelationMentionsAnalysis;