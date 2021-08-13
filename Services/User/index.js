const Connection = require("../../Data");
const UserService = require("./new_UserService");

Connection.Database.connect().then(()=>{
    UserService.stream(undefined, {
        onResult: async u => {
            // console.log(u)
            try{
                // let dataFromAPI = await UserService.fetchAPI(u.userID)
                await UserService.UserFollowerService.stream({UserID: u.userID}, {
                    onResult: async follower=>{
                        // console.log(follower)
                        const followerData = await UserService.UserStatsService.read(follower.followerID)
                        console.log(followerData);
                    }
                })
            } catch(e){
                console.log(e)
            }
        }
    })
})