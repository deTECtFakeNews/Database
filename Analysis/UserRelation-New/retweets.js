const connection = require('../../Data/index')

const countRetweetedTweets = (userID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-retweets-read'].query(`
        SELECT COUNT(DISTINCT tweetID) AS count FROM 
        (
            SELECT
                tweetID
            FROM TweetRetweet
            WHERE authorID = ${userID}
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const countRetweetsToUser = (aUserID, bUserID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-retweets-read'].query(`
        SELECT COUNT(DISTINCT tweetID) AS count FROM
        (
            SELECT 
                Tweet.tweetID
            FROM
                TweetRetweet
                JOIN
                Tweet USING (tweetID)
            WHERE 
                TweetRetweet.authorID = ${aUserID}
                AND Tweet.authorID = ${bUserID}
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const countRetweetedUsers = (userID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-retweets-read'].query(`
    SELECT COUNT(DISTINCT authorID) AS count FROM
    (
        SELECT
            Tweet.authorID
        FROM
            TweetRetweet
            JOIN
            Tweet USING (tweetID)
        WHERE
            TweetRetweet.authorID = ${userID}
    ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const countCommonRetweetedUsers = (aUserID, bUserID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-retweets-read'].query(`
        SELECT COUNT(DISTINCT authorID) FROM 
        (
            SELECT
                Tweet.authorID 
            FROM
                TweetRetweet
                JOIN
                Tweet USING (tweetID)
            WHERE
                TweetRetweet.authorID = ${aUserID}
                AND Tweet.authorID IN (
                    SELECT
                        Tweet.authorID 
                    FROM
                        TweetRetweet
                        JOIN
                        Tweet USING (tweetID)
                    WHERE
                        TweetRetweet.authorID = ${bUserID}
                )
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const calculate = async (aUserID, bUserID) => {
    let usersRetweetedByA = await countRetweetedUsers(aUserID), 
        usersRetweetedByB = await countRetweetedUsers(bUserID), 
        usersRetweetedByBoth = await countCommonRetweetedUsers(aUserID, bUserID),
        tweetsRetweetedByA = await countRetweetedTweets(aUserID), 
        tweetsRetweetedByB = await countRetweetedTweets(bUserID),
        retweetsFromAToB = await countRetweetsToUser(aUserID, bUserID),
        retweetsFromBToA = await countRetweetsToUser(bUserID, aUserID);
    return usersRetweetedByBoth/(Math.sqrt(usersRetweetedByA) * Math.sqrt(usersRetweetedByB)) || 0 + (retweetsFromAToB + retweetsFromBToA)/(tweetsRetweetedByA * tweetsRetweetedByB) || 0;
}

module.exports = calculate;