const Connection = require("../Data");
const UserModel = require("../Models/User/UserModel");

Connection.Database.connect().then(()=>{
    Connection.connections['user-main-read'].query(`
        SELECT
            User.*
        FROM view_UserStatsLast
        RIGHT JOIN User USING (userID)
        WHERE
            view_UserStatsLast.userID IS NULL OR view_UserStatsLast.updateDate IS NULL
    `).on('result', async row => {
        Connection.connections['user-main-read'].pause();
        let user = new UserModel(row)
        try{
            await user.getFromAPI();
            console.log(user.latestStats.last().getJSON())
            await user.latestStats.uploadToDatabase();
            console.log(user.userID, 'Success');
        } catch(e){
            console.log(user.userID, 'Error');
        }
        Connection.connections['user-main-read'].resume();
    })
})