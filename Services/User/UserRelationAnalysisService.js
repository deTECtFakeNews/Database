const Connection = require("../../Data");

const getCommunity = userID => new Promise((resolve, reject) => {
    Connection.connections['user-follower-read'].query(`
        SELECT DISTINCT userID FROM (
            SELECT 
                followerID 
            FROM UserFollower 
            WHERE ?
            UNION
            SELECT
                userID
            FROM UserFollower
            WHERE ?
        ) AS a
    `,  [userID, userID], (error, results, fields) => {
        if(error) reject(error);
        resolve([...new Set(results)]);
    })
})

const getCommunity2Deg = userID => new Promise(async (resolve, reject) => {
    let users = [];
    try{
        for(let user of await getCommunity(userID)){
            users.push(...(await getCommunity(user)));
        }
    } catch(e){
        reject(e);
    }
    resolve([...new Set(users)])
})

const weightUserMentions = (aUserID, bUserID) => new Promise((resolve, reject) => {
    let value = 0;
    let mentionCount = 0;
    let tweetIDs = new Set();
    Connection.connections['tweet-entities-read'].query(`
        SELECT 
            * 
        FROM view_UserMentions 
        JOIN view_TweetEntitiesStats USING (tweetID)
        WHERE ?
    `, {authorID: aUserID, userID: bUserID})
        .on('result', row=>{
            if(tweetIDs.has(row.tweetID)) return;
            tweetIDs.add(row.tweetID);
            if(row.userMentions != 0) value+=1/row.userMentions;
            mentionCount++;
        })
        .on('end', row=>{
            if(mentionCount == 0) resolve(0);
            resolve(value/mentionCount);
        })
        .on('error', reject);
})

const weightUserRetweets = (aUserID, bUserID) => new Promise((resolve, reject) => {
    let retweets = 0;
    Connection.connections['tweet-retweet-read'].query(`
        SELECT
            *
        FROM view_UserRetweet
        WHERE ?
    `, {authorID: bUserID, retweeterID: aUserID})
        .on('result', row=>{
            retweets++;
        })
        .on('end', row=>{
            if(retweets == 0) resolve(0);
            Connection.connections['tweet-retweet-write'].query(`SELECT COUNT(*) AS count FROM view_UserRetweet WHERE`, {retweeterID: aUserID})
                .on('result', r=>{
                    resolve(retweets/r.count)
                })
                .on('error', reject)
        })
        .on('error', reject);
})

const getTopHashtags = (userID) => new Promise((resolve, reject) => {
    Connection.connections['tweet-entities-write'].query(`
        SELECT
            *,
            COUNT(*) as count
        FROM view_UserHashtags
        WHERE ?
        GROUP BY value
        ORDER BY count DESC
        LIMIT 10
    `, {userID}, (error, results, fields) => {
        if(error) reject(error);
        resolve(results);
    })
})

const UserRelationAnalysisService = {getCommunity, getCommunity2Deg, weightUserMentions, weightUserRetweets, getTopHashtags};
module.exports = UserRelationAnalysisService;