const connection = require('../../Data/index')

const countFriends = (userID) => new Promise((resolve, reject) => {
    connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT userID) AS count FROM
        (
            SELECT userID FROM UserFollower WHERE followerID = ${userID}
        ) AS A
    `, (error, results, fields)=>{
        if(error) reject(error);
        resolve(results?.[0]?.count)
    })
})

const countCommonFriends = (aUserID, bUserID) => new Promise((resolve, reject) => {
    connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT userID) AS count FROM
        (
            SELECT userID FROM UserFollower WHERE followerID = ${aUserID}
            AND userID IN (
                SELECT userID FROM UserFollower WHERE followerID = ${bUserID}
            )
        ) AS A
    `, (error, results, fields)=>{
        if(error) reject(error);
        resolve(results?.[0]?.count)
    })
})

const countFollowers = (userID) => new Promise((resolve, reject) => {
    connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT followerID) AS count FROM
        (
            SELECT followerID FROM UserFollower WHERE userID = ${userID}
        ) AS A
    `, (error, results, fields)=>{
        if(error) reject(error);
        resolve(results?.[0]?.count)
    })
})

const countCommonFollowers = (aUserID, bUserID) => new Promise((resolve, reject) => {
    connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT followerID) AS count FROM
        (
            SELECT followerID FROM UserFollower WHERE userID = ${aUserID}
            AND followerID IN (
                SELECT followerID FROM UserFollower WHERE userID = ${bUserID}
            )
        ) AS A
    `, (error, results, fields)=>{
        if(error) reject(error);
        resolve(results?.[0]?.count)
    })
})
    
/**
 * Calculates community similarities
 * @param {String} aUserID userID of user A
 * @param {String} bUserID userID of user B
 * @returns {Promise<Number>}
 */
const calculate = async (aUserID, bUserID) => {
    let friends_i = await countFriends(aUserID),
        friends_j = await countFriends(bUserID), 
        commonFriends = await countCommonFriends(aUserID, bUserID),
        followers_i = await countFollowers(aUserID),
        followers_j = await countFollowers(bUserID),
        commonFollowers = await countCommonFollowers(aUserID, bUserID);
    let sum = 0;
    if(friends_i != 0 && friends_j != 0){
        sum+=commonFriends/(Math.sqrt(friends_i)*Math.sqrt(friends_j))
    }
    if(followers_i != 0 && followers_j != 0){
        sum+=commonFollowers/(Math.sqrt(followers_i)*Math.sqrt(followers_j))
    }
    return sum;
}

module.exports = calculate;