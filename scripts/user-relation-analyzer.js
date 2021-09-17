const Connection = require("../Data")
const UserRelationAnalysisModel = require("../Models/User/UserRelationAnalysisModel")


Connection.Database.connect().then(async ()=>{
    // Read influential users (10k+ followers)
    Connection.connections['user-stats-read'].query(`
        SELECT userID FROM view_UserStatsLast
        LEFT JOIN UserRelationAnalysis ON UserRelationAnalysis.aUserID = view_UserStatsLast.userID
        WHERE UserRelationAnalysis.aUserID IS NULL AND
        view_UserStatsLast.followersCount >= 10000
    `).on('result', async influentialUser => {
        // Compare with each of the rest users (1k+ followers)
        Connection.connections['user-stats-write'].query(`
            SELECT userID FROM view_UserStatsLast
            LEFT JOIN UserRelationAnalysis ON UserRelationAnalysis.bUserID = view_UserStatsLast.userID
            WHERE UserRelationAnalysis.aUserID IS NULL
                AND view_UserStatsLast.followersCount > 10000
                AND view_UserStatsLast.followersCount >= 1000
        `).on('result', async otherUser => {
            Connection.connections['user-stats-write'].pause()
            // Log both ids
            console.log(influentialUser.userID, otherUser.userID);
            let model = new UserRelationAnalysisModel(influentialUser.userID, otherUser.userID);
            // Execute all tests
            await model.executeAll();
            // Upload to db
            await model.uploadToDatabase();
            // Print resutls
            console.log(model.getJSON())
            Connection.connections['user-stats-write'].resume()
        }).on('error', console.log)
    }).on('error', console.log)
})