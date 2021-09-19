const Connection = require("../../Data");

/**
 * Gets number of common friends for user A and user B
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<Number>}
 */
const getCommonFriends = (a, b) => new Promise((resolve, reject) => {
    Connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT userID) AS count FROM 
        (
            SELECT userID FROM UserFollower WHERE followerID=${a}
        ) AS a_friends 
        JOIN
        (
            SELECT userID FROM UserFollower WHERE followerID=${b}
        ) AS b_friends 
        USING (userID)
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result?.[0]?.count);
    })
})

/**
 * Gets number of common followers for user A and user B
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<Number>}
 */
const getCommonFollowers = (a, b) => new Promise((resolve, reject) => {
    Connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT followerID) AS count FROM 
        (
            SELECT followerID FROM UserFollower WHERE userID=${a}
        ) AS a_followers
        JOIN
        (
            SELECT followerID FROM UserFollower WHERE userID=${b}
        ) AS b_followers 
        USING (followerID)
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result?.[0]?.count);
    })
})

/**
 * Gets number of followers
 * @param {String} a Id of user
 * @returns {Promise<Number>}
 */
const countFollowers = (a) => new Promise((resolve, reject) => {
    Connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT followerID) AS count FROM UserFollower WHERE userID=${a}
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result?.[0]?.count);
    })
})

/**
 * Gets number of friends
 * @param {String} a Id of user
 * @returns {Promise<Number>}
 */
const countFriends = (a) => new Promise((resolve, reject) => {
    Connection.Database.connections['user-followers-read'].query(`
        SELECT COUNT(DISTINCT userID) AS count FROM UserFollower WHERE followerID=${a}
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result?.[0]?.count);
    })
})

const calculate = async (a, b) => {
    // sim_follow(i, j) = c_friend/(sqrt(friends_i) + sqrt(friends_j)) + c_follower/(sqrt(followers_i) + sqrt(followers_j))
    let commonFriends = await getCommonFriends(a, b) || 0;
    let commonFollowers = await getCommonFollowers(a, b) || 0;
    let aFriends = await countFriends(a) || 1;
    let bFriends = await countFriends(b) || 1;
    let aFollowers = await countFollowers(a) || 1;
    let bFollowers = await countFollowers(b) || 1;
    return (commonFriends/( Math.sqrt(aFriends) * Math.sqrt(bFriends)) || 0) + (commonFollowers/( Math.sqrt(aFollowers) * Math.sqrt(bFollowers)) || 0);
}

const UserRelationCommunitiesAnalysis = {calculate};
module.exports = UserRelationCommunitiesAnalysis;