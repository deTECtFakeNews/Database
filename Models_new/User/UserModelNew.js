const UserService = require("../../Services/User/UserService");
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
    }
    getData(){
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
    isEmpty(){
        return this.fullName == undefined && this.screenName == undefined
    }

    async getFromDatabase(){
        if(this.userID == -1) return;
        try{
            const [data] = await UserService.read(this.userID);
            if(data==undefined) return false;
            Object.assign(this, new UserModel(data));
            await this.latestStats.getFromDatabase();
            await this.followers.getFromDatabase();
        } catch(e){
            throw e;
        }
    }
    async getFromAPI(){
        if(this.userID == -1) return;
        try{
            const data = await UserService.fetchAPI(this.userID);
            if(data==undefined) return false;
            Object.assign(this, new UserModel(data));
            await this.followers.getFromAPI();
        } catch(e){
            throw e;
        }
    }
    async get(){
        if(this.userID == -1) return false;
        try{
            if( await this.latestStats.getFromDatabase() && this.latestStats.length == 0 ){
                await this.getFromAPI();
            }
        } catch(e){
            throw e;
        }
    }
    async uploadToDatabase(){
        if(this.userID == -1) return false;
        try{
            // Upload user data
            await UserService.create(this.getData());
            console.log(`[Models/User] Uploaded user ${this.userID} (${this.latestStats.last().followersCount} followers)`)
            // Upload latest stats
            console.group()
            await this.latestStats.uploadToDatabase();
            // Upload followrs
            if(this.latestStats.uploadToDatabase().followersCount >= 10000){
                await this.followers.uploadToDatabase();
            }
            console.groupEnd();
        } catch(e){

        }
    }
}