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
        // Data 
        try{
            let data = await UserService.UserFollowerService
                .fetchAPI(this.#userID, {next_cursor: this.api_next_cursor});
            for(followerID of data.ids){
                super.push({userID: this.#userID, followerID})
            }
            this.api_next_cursor = data.next_cursor;
            console.log(this.#userID, `Fetched ${this.length} items from API. Next cursor is ${data.next_cursor}`)
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

    async getFromAPIAndUploadToDatabase(){
        if(this.api_next_cursor == "0") return;
        try{
            await this.getFromAPI();
            await this.uploadToDatabase();
            this.length = 0;
            await this.getFromAPIAndUploadToDatabase();
        } catch(e){
            throw e;
        }
    }
}
module.exports = UserFollowerArray;