const UserService = require("../../Services/User/UserService");

class UserStatsModelRow {
    /**@type {String} */
    userID;
    /**@type {Number} */
    followersCount;
    /**@type {Number} */
    followingCount;
    /**@type {Number} */
    listedCount;
    /**@type {Number} */
    favoritesCount;
    /**@type {Number} */
    statusesCount;
    /**@type {Date} */
    updateDate;
    /**@type {} */
    status;

    constructor(data){
        this.userID = data?.userID || -1;
        this.followersCount = data?.followersCount;
        this.followingCount = data?.followingCount;
        this.listedCount = data?.listedCount;
        this.favoritesCount = data?.favoritesCount;
        this.statusesCount = data?.statusesCount;
        this.updateDate = data?.updateDate;
        this.status = data?.status;
    }

    getData(){
        return {
            userID: this.userID,
            followersCount: this.followersCountuserID,
            followingCount: this.followingCountuserID,
            listedCount: this.listedCountuserID,
            favoritesCount: this.favoritesCountuserID,
            statusesCount: this.statusesCountuserID,
            updateDate: this.updateDateuserID,
            status: this.statususerID
        }
    }
    isEmpty(){
        return this.followersCount == undefined &&
                this.followingCount == undefined &&
                this.listedCount == undefined &&
                this.favoritesCount == undefined &&
                this.status == undefined &&
                this.statusesCount == undefined
    }
}

class UserStatsModel extends Array<UserStatsModelRow> {
    /**@type {String} */
    #userID;
    /**@type {Boolean} */
    #shouldUpload;
    constructor(data){
        super();
        this.#userID = data?.userID || -1;
        this.push( data );
    }
    /**
     * Pushes new stats data
     * @param {Object} data Stats record to be uploaded
     */
    push(data){
        let row = new UserStatsModelRow(data);
        if(row.isEmpty()) return;
        this.#shouldUpload = true;
        super.push( row )
    }
    /**
     * Returns the last stats record
     * @returns {UserStatsModelRow}
     */
    last(){
        return this[this.length-1];
    }
    /**
     * Gets all stats from database
     * @returns {Promise<void>}
     */
    async getFromDatabase(){
        if(this.#userID == -1) return false;
        // Avoid uploading duplicate data;
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Get 
        try{
            for(let stats of await UserService.UserStatsService.read(this.#userID)){
                super.push( new UserStatsModelRow(stats) )
            }
        } catch(e){
            throw e;
        }
        // if (this.length == 0) return false;
    }
    /**
     * Uploads the latest record to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.#userID == -1 || !this.#shouldUpload) return false;
        try{
            await UserService.UserStatsService.create( this.last().getData() )
        } catch(e){
            throw e;
        }
    }
}

module.exports = UserStatsModel;