const Connection = require("../../Data");

/**
 * Returns the number of DISTINCT hashtags used by user A
 * @param {String} a Id of user A
 * @returns {Promise<Number>}
 */
const countHashtags = (a) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-entities-read'].query(`
        SELECT 
            SUM(count) AS count
        FROM (
            SELECT
                TweetEntities.tweetID, 
                COUNT(DISTINCT TweetEntities.value) AS count
            FROM TweetEntities
            JOIN Tweet USING (tweetID)
            WHERE Tweet.authorID = ${a}
            AND TweetEntities.type = 'hashtag'
            GROUP BY tweetID
        ) as A
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result?.[0]?.count);
    })
});

/**
 * Returns a list of common hashtags between both users, and the number of times they've been used by each
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<Array<{hashtag: String, a_count: Number, b_count: Number}>>}
 */
const getCommonHashtagsWithCount = (a, b) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-entities-read'].query(`
        SELECT * FROM
        (
            SELECT
                TweetEntities.value AS hashtag,
                COUNT(*) AS a_count
            FROM TweetEntities
            JOIN Tweet USING (tweetID)
            WHERE Tweet.authorID = ${a}
            AND TweetEntities.type = 'hashtag'
            GROUP BY TweetEntities.value
        ) AS a_hashtags
        JOIN
        (
            SELECT
                TweetEntities.value AS hashtag,
                COUNT(*) AS b_count
            FROM TweetEntities
            JOIN Tweet USING (tweetID)
            WHERE Tweet.authorID = ${b}
            AND TweetEntities.type = 'hashtag'
            GROUP BY TweetEntities.value
        ) AS b_hashtags
        USING (hashtag)
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result);
    })
})

const calculate = async (a, b) => {
    // sim_hashtag(i, j) = \sum_k^n ( 1 - | (N_{ik}/H_i) + (N_{jk}/H_j) | ) + (N_{ik} + N_{jk})/(H_i + H_j)

    let aTotalHashtags = await countHashtags(a);
    let bTotalHashtags = await countHashtags(b);
    let commonHashtags = await getCommonHashtagsWithCount(a, b);

    let result = 0;
    commonHashtags.forEach(hashtag => {
        let differenceOfWeights = Math.abs(hashtag.a_count/aTotalHashtags - hashtag.b_count/bTotalHashtags);
        let commonWeight = (hashtag.a_count + hashtag.b_count)/(aTotalHashtags + bTotalHashtags);
        result += (1 - differenceOfWeights)*commonWeight;
    })
    return result;
}


const UserRelationHashtagAnalysis = {calculate};
module.exports = UserRelationHashtagAnalysis;