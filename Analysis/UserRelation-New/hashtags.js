const connection = require('../../Data/index')

const countTweetsWithHashtags = (userID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-entities-read'].query(`
        SELECT COUNT(*) AS count FROM 
        (
            SELECT
                TweetEntities.\`value\` AS hashtag
            FROM 
                TweetEntities
                JOIN
                Tweet USING (tweetID)
            WHERE 
                Tweet.authorID = ${userID}
                AND TweetEntities.\`type\` = 'hashtag'
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const countTweetsWithSpecificHashtag = (userID, hashtag) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-entities-read'].query(`
        SELECT COUNT(*) AS count FROM
        (
            SELECT
                TweetEntities.\`value\` AS hashtag
            FROM
                TweetEntities
                JOIN
                Tweet USING (tweetID)
            WHERE
                Tweet.authorID = ${userID}
                AND TweetEntities.\`type\` = 'hashtag'
                AND TweetEntities.\`value\` = '${hashtag}'
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const getCommonHashtags = (aUserID, bUserID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-entities-read'].query(`
        SELECT DISTINCT hashtag FROM
        (
            SELECT
                TweetEntities.\`value\` AS hashtag
            FROM 
                TweetEntities
                JOIN
                Tweet USING (tweetID)
            WHERE 
                Tweet.authorID = ${aUserID}
                AND TweetEntities.\`type\` = 'hashtag'
                AND TweetEntities.\`value\` IN (
                    SELECT
                        TweetEntities.\`value\` AS hashtag
                    FROM 
                        TweetEntities
                        JOIN
                        Tweet USING (tweetID)
                    WHERE 
                        Tweet.authorID = ${bUserID}
                        AND TweetEntities.\`type\` = 'hashtag'
                )
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(
            result?.map(({hashtag}) => hashtag)
        )
    })
})

const calculate = async (aUserID, bUserID) => {
    let tweetsWithHastagsFromA = await countTweetsWithHashtags(aUserID),
        tweetsWithHastagsFromB = await countTweetsWithHashtags(bUserID),
        commonHashtags = await getCommonHashtags(aUserID, bUserID);
    if(tweetsWithHastagsFromA == 0 || tweetsWithHastagsFromB == 0) return 0;
    let sum = 0;
    for(let hashtag of commonHashtags){
        let tweetsWithSpecificHashtagFromA = await countTweetsWithSpecificHashtag(aUserID, hashtag), 
            tweetsWithSpecificHashtagFromB = await countTweetsWithSpecificHashtag(bUserID, hashtag);
        sum+=(1 - Math.abs( tweetsWithSpecificHashtagFromA/tweetsWithHastagsFromA - tweetsWithSpecificHashtagFromB/tweetsWithHastagsFromB )) * ((tweetsWithSpecificHashtagFromA + tweetsWithSpecificHashtagFromB)/(tweetsWithHastagsFromA + tweetsWithHastagsFromB));
    }
    return sum;
}

module.exports = calculate;