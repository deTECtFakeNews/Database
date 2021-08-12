const UserService = require("../../Services/User/UserService");

class UserFollowerArray extends Array {
    /**@type {String} */
    #userID;
    /**@type {Boolean} */
    #shouldUpload;
    constructor(data){
        super();
        this.#userID = data?.userID || -1;
    }
    /**
     * Pushes new user follower relationship
     * @param {{userID: String, followerID: String}} param0 Relationship data
     */
    push({userID, followerID}){
        this.#shouldUpload = false;
        super.push({userID, followerID});
    }
    /**
     * Gets all user follower relationships from database
     * @returns {Promise<void>}
     */
    getFromDatabase(){
        if(this.#userID == -1) return false;
        // Avoid uploading existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        return new Promise(async (resolve, reject) => {
            await UserService.UserFollowerService.stream(this.#userID, {
                onResult: super.push,
                onError: reject, 
                onEnd: resolve
            })
        })
    }
    /**
     * Gets all user follower relationships from API
     * @returns {Promise<void>}
     */
    async getFromAPI(){
        if(this.#userID == -1) return false;
        // Allow to upload
        this.#shouldUpload = true;
        // Empty
        this.length = 0;
        for(followerIDID of await UserService.UserFollowerService.fetchAPI(this.#shouldUpload)){
            super.push({userID: this.#userID, followerID})
        }
    }
    /**
     * Uploads all records to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.#userID == -1 || !this.#shouldUpload) return;
        try{
            const data = [[this.#userID, this.#userID], ...this.map(({userID, followerID}) => [userID, followerID] )];
            await UserService.UserFollowerArray.bulkCreate(data)
        } catch(e) {
            throw e;
        }
    }
}
module.exports = UserFollowerArray;