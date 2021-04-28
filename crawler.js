const Connection = require("./Data");
const UserModel = require("./Models/User/UserModel");
const UserService = require("./Services/User/UserService");
Connection.connect().then(()=>{
    UserService.stream(undefined, {
        onResult: async row => {
            try{
                console.log('Updating followers for user', row.userID)
                let user = new UserModel(row);
                await user.stats.fetchFromAPI();
                await user.stats.upload();
                if(user.stats.latestStats?.followersCount > 10000){
                    await user.followers.read();
                    if(user.followers.savedFollowers.length == 0){
                        await user.followers.fetchFromAPI();
                        await user.followers.upload();
                    }
                }
                console.log('Uploaded followers for user ', user.userID)
            } catch(e){
                console.log('Error', e);
            }
        }
    })
})