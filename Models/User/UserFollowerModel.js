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
            this.latestFollowers = this.latestFollowers.map(l=>({userID: this.userID, followerID: l}))
            return this.latestFollowers;
        } catch(e){
            console.error(e)
        }
    }
    async read(){
        if(this.userID == -1) return;
        try{
            this.savedFollowers = await UserFollowerService.read(this.userID);
            return this.savedFollowers;
        } catch (e){

        }
    }
    async upload(){
        if(this.userID == -1) return;
        /* let count = 0;
        for(let follower of this.latestFollowers){
            if(this.savedFollowers.find(({followerID})=>followerID==follower)) continue;
            try{
                await UserFollowerService.create({userID: this.userID, followerID: follower});
                count++;
                console.log(`Added follower ${follower} to ${this.userID}`)
            } catch(e){
                if(e.code != 'ER_NO_REFERENCED_ROW_2' && e.code != 'ER_DUP_ENTRY') throw e;
            }
        }
        console.log(`Added ${count} followers to ${this.userID}`) */
        console.log('Uploading followers')
        await UserFollowerService.bulkCreate(
            // Make 2D array
            this.latestFollowers.map(({userID, followerID})=>[userID, followerID])
        );
    }

}

module.exports = UserFollowerModel;