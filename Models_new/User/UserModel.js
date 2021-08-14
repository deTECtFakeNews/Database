const UserService = require("../../Services/User/UserService");
const MemoryModel = require("../MemoryModel");
const UserFollowerArray = require('./UserFollowerArray');
const UserStatsModel = require('./UserStatsModel')

class UserModel {
    /**@type {String} */
    userID;
    /**@type {Date} */
    creationDate;
    /**@type {String} */
    fullName;
    /**@type {String} */
    screenName;
    /**@type {String} */
    biography;
    /**@type {Boolean} */
    isProtected;
    /**@type {Boolean} */
    isVerified;
    /**@type {String} */
    language;
    /**@type {String} */
    placeDescription;
    /**@type {UserStatsModel} */
    latestStats;
    /**@type {UserFollowerArray} */
    followers;
    /**@type {MemoryModel} */
    _memory;
    /**
     * @constructor
     * @param {import("../../Services/User/UserService").UserJSON} data User data in UserJSON
     */
    constructor(data){
        this.userID = data?.userID || -1;
        this.creationDate = data?.creationDate;
        this.fullName = data?.fullName;
        this.screenName = data?.screenName;
        this.biography = data?.biography;
        this.isProtected = data?.isProtected;
        this.isVerified = data?.isVerified;
        this.language = data?.language;
        this.placeDescription = data?.placeDescription;

        this.latestStats = new UserStatsModel({userID: data?.userID, ...data?.latestStats});
        this.followers = new UserFollowerArray(data);

        this._memory = new MemoryModel();
    }
    /**
     * Get data in JSON format
     * @returns {import("../../Services/User/UserService").UserJSON}
     */
    getJSON(){
        return {
            userID: this.userID.toString(),
            creationDate: this.creationDate,
            fullName: this.fullName,
            screenName: this.screenName,
            biography: this.biography,
            isProtected: this.isProtected,
            isVerified: this.isVerified,
            language: this.language,
            placeDescription: this.placeDescription,
        }
    }
    /**
     * Return true if required fields are empty
     * @returns {Boolean}
     */
    isEmpty(){
        return this.fullName == undefined && this.screenName == undefined
    }
    /**
     * Get data from database
     * @returns {Promise<void>}
     */
    async getFromDatabase(){
        if(this.userID == -1) return;
        try{
            const [data] = await UserService.read(this.userID);
            if(data==undefined) return false;
            Object.assign(this, new UserModel(data));
            await this.latestStats.getFromDatabase();
        } catch(e){
            throw e;
        }
    }
    /**
     * Get data from API
     * @returns {Promise<void>}
     */
    async getFromAPI(){
        if(this.userID == -1) return;
        try{
            const data = await UserService.fetchAPI(this.userID);
            if(data==undefined) return false;
            Object.assign(this, new UserModel(data));
        } catch(e){
            // If service error, then user is unavailable.
            // Set empty values and push error
            if( UserStatsModel.errorCodes[ e?.[0]?.code ] != undefined ){
                this.fullName = '_';
                this.screenName = '_';
                this.latestStats.pushError(e?.[0]?.code);
            }
        }
    }
    /**
     * Get from database or API
     * @returns {Promise<void>}
     */
    async get(){
        if(this.userID == -1) return false;
        if(this._memory.users[this.userID] != undefined){
            Object.assign(this, this._memory.users[this.userID])
        }
        try{
            await this.getFromDatabase();
            if(this.latestStats.last() == undefined) await this.getFromAPI()
        } catch(e){
            throw e;
        }
    }
    /**
     * Upload user data to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.userID == -1) return false;
        try{
            if(this.isEmpty()) await this.get();
            await UserService.create(this.getJSON());
            await this.latestStats.uploadToDatabase();
            console.log(`[Models/User] Uploaded user ${this.userID} (${this.latestStats.last()?.followersCount} followers)`)
            
        } catch(e){ 
            throw e
        }
    }
}

module.exports = UserModel;