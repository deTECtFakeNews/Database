const UserService = require("../../Services/User/UserService");
const UserFollowerArray = require("./UserFollowerArray");

class UserFollowingArray extends UserFollowerArray{
    /**@type {String} */
    #userID;
    /**@type {Boolean} */
    #shouldUpload;
    constructor(data){
        super(data);
        this.#userID = data?.userID || -1;
    }
    getFromDatabase(){
        if(this.#userID == -1) return false;
        // Avoid uploading existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Push for each, then resolve
        return new Promise(async (resolve, reject) => {
            await UserService.UserFollowerService.stream({followerID: this.#userID}, {
                onResult: super.push,
                onError: reject, 
                onEnd: resolve
            })
        })
    }
    async getFromAPI(){
        if(this.#userID == -1) return false;
        // Allow to upload
        this.#shouldUpload = true;
        // Empty
        this.length = 0;
        try{
            // Data
            let data = await UserService.UserFollowerService
                .fetchAPIFollowings(this.#userID, {next_cursor: this.api_next_cursor});
            for(userID of data.ids){
                super.push({userID, followerID: this.#userID})
            }
            if(data.next_cursor != "0"){
                this.api_next_cursor = data.next_cursor;
                await this.getFromAPI();
            }
        } catch(e){
            throw e;
        }
    }
}

module.exports = UserFollowingArray;