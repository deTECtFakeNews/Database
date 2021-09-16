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
    /**@type {String} */
    status;
    /**
     * @constructor
     * @param {import("../../Services/User/UserService").UserStatsJSON} data Stats snapshot data
     */
    constructor(data){
        this.userID = data?.userID || -1;
        this.followersCount = data?.followersCount;
        this.followingCount = data?.followingCount;
        this.listedCount = data?.listedCount;
        this.favoritesCount = data?.favoritesCount;
        this.statusesCount = data?.statusesCount;
        this.updateDate = new Date();
        this.status = data?.status;
    }
    /**
     * Returns data in JSON format
     * @returns {import("../../Services/User/UserService").UserStatsJSON}
     */
    getJSON(){
        return {
            userID: this.userID.toString(),
            followersCount: this.followersCount,
            followingCount: this.followingCount,
            listedCount: this.listedCount,
            favoritesCount: this.favoritesCount,
            statusesCount: this.statusesCount,
            updateDate: this.updateDate,
            status: this.status
        }
    }
    /**
     * Returns true if all properties are undefined
     * @returns {Boolean}
     */
    isEmpty(){
        return this.followersCount == undefined &&
            this.followingCount == undefined &&
            this.listedCount == undefined &&
            this.favoritesCount == undefined &&
            this.status == undefined &&
            this.statusesCount == undefined
    }
}

class UserStatsModel extends Array {
    /**
     * Twitter API error codes
     * @static
     * @type {Object.<Number, String>}
     */
    static errorCodes = {
        17: 'NOT_FOUND',
        34: 'NOT_FOUND', 
        50: 'NOT_FOUND', 
        109: 'NOT_FOUND',
        63: 'SUSPENDED', 
    }
    /**@type {String} */
    #userID;
    /**@type {Boolean} */
    #shouldUpload;
    /**
     * @constructor
     * @param {import("../../Services/User/UserService").UserStatsJSON} data Initial data to load
     */
    constructor(data){
        super();
        this.#userID = data?.userID || -1;
        this.push( data );
    }
    /**
     * Push new stats snapshot
     * @param {import("../../Services/User/UserService").UserStatsJSON} data Stats snapshot to be uploaded
     */
    push(data){
        let row = new UserStatsModelRow(data);
        if(row.isEmpty()) return;
        this.#shouldUpload = true;
        super.push( row )
    }
    /**
     * Return the last stats record
     * @returns {UserStatsModelRow}
     */
    last(){
        return this[this.length-1];
    }
    /**
     * Get all stats from database
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
    }
    /**
     * Upload last stat to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.#userID == -1 || !this.#shouldUpload) return false;
        if(this.last() == undefined || this.last().isEmpty()) return false;
        try{
            // console.log(JSON.stringify(this.last().getJSON()))
            await UserService.UserStatsService.create( this.last().getJSON() )
        } catch(e){
            console.log('[Models/UserStatsFreeze] ', { userID: this.#userID })
            throw e;
        }
    }
    /**
     * Given a Twitter API error number, uploads the error to the stats
     * @param {Number} e Twitter API error number
     */
    pushError(e){
        this.push({
            favoritesCount: 0,
            followersCount: 0, 
            followingCount: 0, 
            listedCount: 0, 
            status: UserStatsModel.errorCodes[0],
            statusesCount: 0, 
            updateDate: new Date(),
            userID: this.#userID
        })
    }

}

module.exports = UserStatsModel;