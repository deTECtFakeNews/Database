const Connection = require("../Data");
const UserModel = require("../Models/User/UserModel");

Connection.Database.connect().then(()=>{
    Connection.connections['user-main-read'].query(`
        SELECT 
            User.*
        FROM User
        JOIN view_UserStatsLast USING (userID)
        WHERE view_UserStatsLast.followersCount >= 10000
    `).on('result', async row => {
        Connection.connections['user-main-read'].pause();
        let user = new UserModel(row); 
        try{
            // Get stats
            await user.latestStats.getFromDatabase();
            // Log
            console.log("Getting data from", user.userID, "Following: ", user.latestStats.last().getJSON());
            // Get from API
            await user.followings.getFromAPIAndUploadToDatabase();
            console.log(user.userID, 'Success');
        } catch(e){
            console.log(user.userID, "Error", e);
        }
        Connection.connections['user-main-read'].resume();
    })
})