const Data = require("../Data");
const TweetService = require("../Services/TweetService");
const UserService = require("../Services/UserService");
const TweetModel = require("./TweetModel");

class UserModel{
    /**
     * Creates User table in database
     * @returns {Promise}
     */
    static async createTable(){
        return await UserService.createTable();
    }
    /**
     * Search for Users in database
     * @param {Object|Number|String} query_params Parameters to execute search in database
     * @returns {Promise<Array<UserModel>>}
     */
    static async read(query_params){
        try{
            let entries = await UserService.read(query_params);
            return entries.map( e=> new UserModel(e) );
        } catch(e){
            console.error("[UserModel] readFromDatabase error", e);
            return;
        }
    }
    /**
     * Search for Users in API
     * @param {Number|String} id Id of User
     * @returns {Promise<UserModel>}
     */
    static async getFromAPI(id){
        try{
            let data = await UserService.fetchAPI(id);
            return new UserModel(data)
        } catch(e){

        }
    }
    /**
     * Creates a new UserModel object with methods for executing several services
     * @constructor
     * @param {import("../Services/UserService").UserService_Data} data Data of the user
     */
    constructor(data){
        this.userID = data.userID || -1;
        this.creationDate = new Date(data.creationDate) || new Date();
        this.fullName = data.fullName;
        this.screenName = data.screenName;
        this.biography = data.biography;
        this.isProtected = data.isProtected;
        this.isVerified = data.isVerified;
        this.language = data.language;
        this.placeDescription = data.placeDescription;

        this._UserStatsFreeze = new UserModel.UserStatsFreeze(data);
    }
    /**
     * Returns user data in UserService_Data format
     * @returns {import("../Services/UserService").UserService_Data}
     */
    getData(){
        return {
            userID: this.userID,
            creationDate: this.creationDate,
            fullName: this.fullName,
            screenName: this.screenName,
            biography: this.biography,
            isProtected: this.isProtected,
            isVerified: this.isVerified,
            language: this.language,
            placeDescription: this.placeDescription
        }
    }
    /**
     * Returns all tweets in database of author
     * @returns {Promise<Array<TweetModel>>}
     */
    async getAllTweets(){
        return await TweetModel.read({authorID: this.userID})
    }
    /**
     * Returns all tweets in reply to user
     * @returns {Promise<Array<TweetModel>>}
     */
    async getAllReplies(){
        return await TweetModel.read({inReplyToUserID: this.userID})
    }
    /**
     * Insert this to database (and all dependencies)
     * @returns {Promise}
     */
    async insertToDatabase(){
        try{
            if(this.userID == -1 || this.userID == null) return;
            await UserService.create(this.getData());
            await UserService.UserStatsFreeze.create(this._UserStatsFreeze.getData());
            return;
        } catch(e){
            console.error('[UserModel] insertToDatabase failed')
        }
    }
    /**
     * Update current record in database
     */
    async updateToDatabase(){
        // await UserService.updateToDatabase(this.userID, this.getData());
        // await UserService.UserStatsFreeze.updateToDatabase(this.userID, this.getStats());
        return
    }
    /**
     * Delete current record from database
     */
    async deleteFromDatabase(){
        return await UserService.delete();
    }
}

UserModel.UserStatsFreeze = class{
    /**
     * Create table
     */
    static async createTable(){
        return await UserService.UserStatsFreeze.createTable();
    }
    constructor(user){
        this.userID = user.userID;
        this.updateDate = new Date().toISOString().slice(0, 19).replace('T', ' ');;
        this.followersCount = user.followersCount;
        this.followingsCount = user.followingsCount;
        this.listedCount = user.listedCount;
        this.favoritesCount = user.favoritesCount;
        this.statusesCount = user.statusesCount;
    }
    getData(){
        return {
            userID:  this.userID,
            updateDate: this.updateDate,
            followersCount:  this.followersCount,
            followingCount:  this.followingsCount,
            listedCount:  this.listedCount,
            favoritesCount:  this.favoritesCount,
            statusesCount:  this.statusesCount,
        } 
    }
    async updateToDatabase(){
        return await UserService.UserStatsFreeze.update(this.userID, this.getData());
    }
}

module.exports = UserModel;