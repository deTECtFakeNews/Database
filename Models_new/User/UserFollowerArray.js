const UserService = require("../../Services/User/UserService");

class UserFollowerArray extends Array {
    /**@type {String} */
    #userID;
    /**@type {Boolean} */
    #shouldUpload;
    /**
     * @constructor
     * @param {{userID: String}} data Initial data to load (userID)
     */
    constructor(data){
        super();
        this.#userID = data?.userID || -1;
    }
    /**
     * Push new user-relationship
     * @param {{userID: String, followerID: String}} param0 user-relationship
     */
    push({userID, followerID} = {}){
        if(userID == undefined && followerID == undefined) return;
        this.#shouldUpload = false;
        super.push({userID, followerID});
    }
    /**
     * Get all user-relationships from database
     * @returns {Promise<void>}
     */
    getFromDatabase(){
        if(this.#userID == -1) return false;
        // Avoid uploading existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Push for each, then resolve
        return new Promise(async (resolve, reject) => {
            await UserService.UserFollowerService.stream(this.#userID, {
                onResult: super.push,
                onError: reject, 
                onEnd: resolve
            })
        })
    }
    /**
     * Get user-relationship from API
     * @returns {Promise<void>}
     */
    async getFromAPI(){
        if(this.#userID == -1) return false;
        // Allow to upload
        this.#shouldUpload = true;
        // Empty
        this.length = 0;
        try{
            for(followerIDID of await UserService.UserFollowerService.fetchAPI(this.#shouldUpload)){
                super.push({userID: this.#userID, followerID})
            }
        } catch(e){
            throw e;
        }
    }
    /**
     * Upload all user-relationships to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.#userID == -1 || !this.#shouldUpload) return;
        try{
            const data = [
                [this.#userID, this.#userID], 
                ...this.map(({userID, followerID}) => [userID, followerID] )
            ];
            await UserService.UserFollowerArray.bulkCreate(data)
        } catch(e) {
            throw e;
        }
    }
}
module.exports = UserFollowerArray;