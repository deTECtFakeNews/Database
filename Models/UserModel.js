const Data = require("../Data");
const UserService = require("../Services/UserService");

class UserModel{
    static async _createTable(){
        return await UserService.createTable();
    }
    static async readFromDatabase(query_params){
        try{
            let entries = await UserService.readFromDatabase(query_params);
            return entries.map( e=> new UserModel(e) );
        } catch(e){
            console.error("[UserModel] readFromDatabase error", e);
        }
    }
    static async getFromAPI(id){
        let data = await UserService.getFromAPI(id);
        return new UserModel(data);
    }
    constructor(user){
        this.userID = user.userID || -1;
        this.creationDate = new Date(user.creationDate) || new Date();
        this.fullName = user.fullName;
        this.screenName = user.screenName;
        this.biography = user.biography;
        this.isProtected = user.isProtected;
        this.isVerified = user.isVerified;
        this.language = user.language;
        this.placeDescription = user.placeDescription;
        this._UserStatsFreeze = new UserModel.UserStatsFreeze(user);
    }
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
    getStats(){
        return this._UserStatsFreeze.getData();
    }
    async insertToDatabase(){
        if(this.userID == -1 || this.userID == null) return;
        await UserService.insertToDatabase(this.getData());
        await UserService.UserStatsFreeze.insertToDatabase(this.getStats());
        return;
    }
    async updateToDatabase(){
        // await UserService.updateToDatabase(this.userID, this.getData());
        // await UserService.UserStatsFreeze.updateToDatabase(this.userID, this.getStats());
        return
    }
    async deleteFromDatabase(){
        return await UserService.deleteFromDatabase();
    }

}

UserModel.UserStatsFreeze = class{
    static async _createTable(){
        return await UserService.UserStatsFreeze.createTable();
    }
    constructor(user){
        this.userID = user.userID;
        this.updateDate = new Date().toISOString();
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
        return await UserService.UserStatsFreeze.updateToDatabase(this.userID, this.getData());
    }
}

module.exports = UserModel;