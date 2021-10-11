const connection = require('../../Data/index')

const countTweetsWithMentions = (userID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-entities-read'].query(`
        SELECT COUNT(*) AS count FROM 
        (
            SELECT 
                TweetEntities.\`value\` AS mention
            FROM
                TweetEntities
                JOIN
                Tweet USING (tweetID)
            WHERE
                Tweet.authorID = ${userID}
                AND TweetEntities.\`type\` = 'userMention'
                AND TweetEntities.\`value\` != Tweet.authorID
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const countTweetsWithMentionsTo = (aUserID, bUserID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-entities-read'].query(`
        SELECT COUNT(*) AS count FROM 
        (
            SELECT 
                TweetEntities.\`value\` AS mention
            FROM
                TweetEntities
                JOIN
                Tweet USING (tweetID)
            WHERE
                Tweet.authorID = ${aUserID}
                AND TweetEntities.\`type\` = 'userMention'
                AND TweetEntities.\`value\` = ${bUserID}
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(result?.[0]?.count);
    })
})

const getCommonMentionedUsers = (aUserID, bUserID) => new Promise((resolve, reject) => {
    connection.Database.connections['tweet-entities-read'].query(`
        SELECT DISTINCT mention FROM (
            SELECT 
                TweetEntities.\`value\` AS mention
            FROM
                TweetEntities
                JOIN
                Tweet USING (tweetID)
            WHERE
                Tweet.authorID = ${aUserID}
                AND TweetEntities.\`type\` = 'userMention'
                AND TweetEntities.\`value\` != Tweet.authorID
                AND TweetEntities.\`value\` IN (
                    SELECT 
                        TweetEntities.\`value\` AS mention
                    FROM
                        TweetEntities
                        JOIN
                        Tweet USING (tweetID)
                    WHERE
                        Tweet.authorID = ${bUserID}
                        AND TweetEntities.\`type\` = 'userMention'
                        AND TweetEntities.\`value\` != Tweet.authorID
                )
        ) AS A
    `, (error, result, fields) => {
        if(error) reject(error);
        resolve(
            result?.map(({mention}) => mention)
        )
    })
})

const calculate = async (aUserID, bUserID) => {
    let mentionsFromAToB = await countTweetsWithMentionsTo(aUserID, bUserID),
        mentionsFromBToA = await countTweetsWithMentionsTo(bUserID, aUserID),
        mentionsFromA = await countTweetsWithMentions(aUserID), 
        mentionsFromB = await countTweetsWithMentions(bUserID),
        commonMentionedUsers = await getCommonMentionedUsers(aUserID, bUserID);
    if(mentionsFromA == 0 || mentionsFromB == 0) return 0;
    let sum = 0;
    for(let user of commonMentionedUsers){
        let mentionsFromAToU = await countTweetsWithMentionsTo(aUserID, user), 
            mentionsFromBToU = await countTweetsWithMentionsTo(bUserID, user)
        sum+=(1 - Math.abs( mentionsFromAToU/mentionsFromA - mentionsFromBToU/mentionsFromB ))*( (mentionsFromAToU + mentionsFromBToU)/(mentionsFromA + mentionsFromB) )
    }
    sum+=(mentionsFromAToB + mentionsFromBToA)/(mentionsFromA * mentionsFromB);
    return sum;
}

module.exports = calculate;