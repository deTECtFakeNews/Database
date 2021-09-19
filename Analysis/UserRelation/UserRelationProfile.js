const Connection = require("../../Data");
// This is not relevant yet, more features will be added

/**
 * 
 * @param {String} a Id of user A
 * @param {String} b Id of user B
 * @returns {Promise<[Object, Object]>}
 */
const getData = (a, b) => new Promise((resolve, reject) => {
    // Uses tweet because user is used elsewhere
    Connection.connections['tweet-main-read'].query(`
        SELECT * FROM User WHERE userID = ${a} OR userID = ${b}
    `, (error, result, fields) => {
        if(error) reject(error);
        else resolve(result);
    })
})

const calculate = async (a, b) => {
    let [aUser, bUser] = await getData(a, b)
    let count = 0;
    if(aUser.isVerified && bUser.isVerified) count+=1/3;
    if(aUser.placeDescription && bUser.placeDescription && aUser.placeDescription == bUser.placeDescription) count+=1/3;
    if(aUser.language && bUser.language && aUser.language == bUser.language) count+=1/3;
    return count;
}

const UserRelationProfileAnalysis = {calculate};
module.exports = UserRelationProfileAnalysis;