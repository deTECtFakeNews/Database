const Connection = require("../../Data");

const create = (userAnalysisJSON) => new Promise((resolve, reject) => {
    if(userAnalysisJSON.aUserID == undefined || userAnalysisJSON.aUserID == -1) return resolve();
    if(userAnalysisJSON.bUserID == undefined || userAnalysisJSON.bUserID == -1) return resolve();
    Connection.connections['user-followers-write'].query('INSERT INTO UserRelationAnalysis SET ?', userAnalysisJSON, (error, results, fields) => {
        // Reject on error
        if(error && error.code != 'ER_DUP_ENTRY') reject(error);
        // Else return newly aaded row
        else resolve(userAnalysisJSON);
    })
})

/**
 * Database - Gets community size (unique followers + followed) of a user
 * @param {String} userID Id of user to get community
 * @returns {Promise<Number>}
 */
const getCommunity = userID => new Promise((resolve, reject) => {
    Connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT a.userID) AS count FROM (
            SELECT 
                followerID as userID
            FROM UserFollower 
            WHERE userID=${userID}
            UNION
            SELECT
                userID as userID
            FROM UserFollower
            WHERE followerID=${userID}
        ) AS a
    `, (error, results, fields) => {
        if(error) reject(error);
        resolve(results[0].count)
    })
})

const getCommunityIntersection = (aUserID, bUserID) => new Promise((resolve, reject) => {
    Connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(*) as count FROM 
        (
            SELECT DISTINCT userID FROM (
                SELECT 
                    followerID as userID
                FROM UserFollower 
                WHERE userID=${aUserID}
                UNION
                SELECT
                    userID as userID
                FROM UserFollower
                WHERE followerID=${aUserID}
            ) AS a
        ) AS community_a
        JOIN
        (
            SELECT DISTINCT userID FROM (
                SELECT 
                    followerID as userID
                FROM UserFollower 
                WHERE userID=${bUserID}
                UNION
                SELECT
                    userID as userID
                FROM UserFollower
                WHERE followerID=${bUserID}
            ) AS a
        ) AS community_b
        USING (userID)
    `, (error, results, fields) => {
        if(error) reject(error);
        resolve(results[0].count);
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

/**
 * Database - Gets mentions weighted by amount of mentions in tweet and amount of mentions from user
 * @param {String} aUserID Id of user creating the mentions
 * @param {String} bUserID Id of user being mentioned
 * @returns {Promise<Number>}
 */
const weightUserMentions = (aUserID, bUserID) => new Promise((resolve, reject) => {
    let value = 0;
    let mentionCount = 0;
    let tweetIDs = new Set();
    let q = Connection.Database.connections['tweet-entities-read'].query(`
        SELECT 
            * 
        FROM view_UserMentions 
        JOIN view_TweetEntitiesStats USING (tweetID)
        WHERE authorID = ${aUserID} AND userID = ${bUserID}
    `)
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
        .on('error', (e)=>{
            console.log(q.sql)
            reject(e)
        });
})

/**
 * Database - Get retweets of a from b
 * @param {String} aUserID Id of user making the retweet
 * @param {String} bUserID Id of original author
 * @returns {Promise<Number>}
 */
const weightUserRetweets = (aUserID, bUserID) => new Promise((resolve, reject) => {
    let retweets = 0;
    Connection.Database.connections['tweet-retweets-read'].query(`
        SELECT
            Tweet.authorID, 
            Tweet.tweetID, 
            TweetRetweet.authorID as retweeterID
        FROM TweetRetweet
        JOIN Tweet USING (tweetID)
        WHERE Tweet.authorID = ${bUserID} AND TweetRetweet.authorID = ${aUserID}
    `,)
        .on('result', row=>{
            retweets++;
        })
        .on('end', row=>{
            if(retweets == 0) resolve(0);
            Connection.connections['tweet-retweets-write'].query(`
                SELECT
                    COUNT(*) AS count
                FROM TweetRetweet
                JOIN Tweet USING (tweetID)
                WHERE TweetRetweet.authorID = ${aUserID}
            `)
                .on('result', r=>{
                    resolve(retweets/r.count)
                })
                .on('error', reject)
        })
        .on('error', reject);
})

const getTopHashtags = (userID) => new Promise((resolve, reject) => {
    Connection.Database.connections['tweet-entities-write'].query(`
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

const UserRelationAnalysisService = {getCommunity, getCommunityIntersection, getCommunity2Deg, weightUserMentions, weightUserRetweets, getTopHashtags};
module.exports = UserRelationAnalysisService;