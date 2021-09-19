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

const UserRelationAnalysisService = {create};
module.exports = UserRelationAnalysisService;