const {UserFollowerService} = require("../../Services/User/UserService");

class UserFollowerModel {
    /**@type {String} ID of User in Twitter and Database*/
    userID;
    /**@type {Array<{userID: String, followerID: string}>} */
    latestFollowers = []
    /**@type {Array<{userID: String, followerID: string}>} */
    savedFollowers = []
    constructor({userID}){
        this.userID = userID;
    }
    async fetchFromAPI(){
        if(this.userID == -1 || this.latestFollowers.length > 0) return;
        try{
            this.latestFollowers = await UserFollowerService.fetchAPI(this.userID);
            return this.latestFollowers;
        } catch(e){
            throw e;
        }
    }
    async read(){
        if(this.userID == -1) return;
        try{
            this.savedFollowers = await UserFollowerService.read(this.userID);
            return this.savedFollowers;
        } catch (e){
            throw e;
        }
    }
    async upload(){
        try{
            await UserFollowerService.bulkCreate(
                [[this.userID, this.userID], ...this.latestFollowers.map(followerID=>[this.userID, followerID])]
            );
            await UserFollowerService.purge(this.userID);
            console.log('Uploaded followers for', this.userID);
        } catch(e){
            throw e;
        }
    }

}

module.exports = UserFollowerModel;
