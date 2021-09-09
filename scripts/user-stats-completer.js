const Connection = require("../Data");
const UserModel = require("../Models_new/User/UserModel");

Connection.Database.connect().then(()=>{
    Connection.connections['user-main-read'].query(`
        SELECT
            User.*
        FROM UserStatsFreeze
        RIGHT JOIN User USING (userID)
        WHERE
            UserStatsFreeze.userID IS NULL
    `).on('result', async row => {
        Connection.connections['user-main-read'].pause();
        let user = new UserModel(row)
        try{
            await user.getFromAPI();
            await user.latestStats.uploadToDatabase();
            console.log(user.userID, 'Success');
        } catch(e){
            console.log(user.userID, 'Error');
        }
        Connection.connections['user-main-read'].resume();
    })
})