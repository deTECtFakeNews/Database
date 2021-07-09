const Connection = require("../../Data");
const UserService = require("../../Services/User/UserService");

class UserStatsModel {
    userID;
    followersCount;
    followingCount;
    listedCount;
    favoritesCount;
    statusesCount;
    updateDate;
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
}

class UserStatsArray extends Array{
    #userID;
    #shouldUpload;
    constructor(data){
        super();
        this.#userID = data?.userID || -1;
        this.push( data )
    }
    push(data){
        this.#shouldUpload = true;
        super.push(new UserStatsModel(data));
    }
    last(){
        return this[this.length-1];
    }
    async getFromDatabase(){
        if(this.#userID == -1) return false;
        // Avoid updating existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Get from database
        try{
            for(let stats of await UserService.UserStatsService.read(this.#userID)){
                super.push( new UserStatsModel(stats) )
            }
        } catch(e){
            return false;
        }
        if(this.length == 0) return false;
    }
    async uploadToDatabase(){
        if(this.#userID == -1) return false;
        if(this.#shouldUpload == false) return false;
        // Upload only latest
        const latest = this.last();
        try{
            await UserService.UserStatsService.create(latest.getData())
        } catch(e){
            throw e;
        }
    }
}

class UserFollowerArray extends Array {
    #userID;
    #shouldUpload
    constructor(data){
        super();
        this.#userID = data?.userID || -1;
    }
    push(data){
        this.#shouldUpload = true;
        super.push(data);
    }
    async getFromDatabase(){
        if(this.#userID == -1) return false;
        // Avoid updating existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Get from database
        await UserService.UserFollowerService.stream(this.#userID, {
            onResult: ({userID, followerID}) => {
                super.push({userID, followerID})
            },
            onError: e => {throw e},
            onEnd: ()=>{
                if(this.length == 0) return false;
            }
        })
    }
    async getFromAPI(){
        if(this.#userID == -1) return false;
        // Allow to upload
        this.#shouldUpload = true;
        // Empty
        this.length = 0;
        // Get from api
        const followers = await UserService.UserFollowerService.fetchAPI(this.#userID);
        for(followerID of followers){
            this.push({userID: this.#userID, followerID: followerID})
        }
    }
    async uploadToDatabase(){
        // if(this.#userID == -1) return false;
        if(this.#shouldUpload == false) return;
        // Upload only latest
        const latest = this[this.length-1];
        try{
            // Normalize
            const data = [[this.#userID, this.#userID], ...this.map(({userID, followerID})=> [userID, followerID])];
            await UserService.UserFollowerService.bulkCreate(data);
        } catch(e){
            console.log(e)
        }
    }
}

class UserModel {
    /**@type {String} Unique identifier of user in Twitter and Database */
    userID;
    /**@type {Date} Date and time of account creation */
    creationDate;
    /**@type {String} Full name of user account */
    fullName;
    /**@type {String} Twitter username (e.g., \@edvilme) */
    screenName;
    /**@type {String} Profile description (can contain entities) */
    biography;
    /**@type {Boolean} Is account protected/private? */
    isProtected;
    /**@type {Boolean} Is account's identity verified by Twitter? */
    isVerified;
    /**@type {String} User's language preference */
    language;
    /**@type {String} Place selected by user to be displayed on their profile */
    placeDescription;
    /**@type {UserStatsArray} Latest statistical data  */
    latestStats;
    /**@type {UserFollowerArray} Array of followers*/
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
        
        this.latestStats = new UserStatsArray({userID: data?.userID, ...data?.latestStats});
        this.followers = new UserFollowerArray(data)
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
    async getFromDatabase(){
        if(this.userID == -1) return false;
        try{
            const [data] = await UserService.read(this.userID);
            if(data==undefined) return false;
            this.userID = data?.userID || -1;
            this.creationDate = data?.creationDate;
            this.fullName = data?.fullName;
            this.screenName = data?.screenName;
            this.biography = data?.biography;
            this.isProtected = data?.isProtected;
            this.isVerified = data?.isVerified;
            this.language = data?.language;
            this.placeDescription = data?.placeDescription;
            await this.latestStats.getFromDatabase();
            await this.followers.getFromDatabase();
            return true;
        } catch(e){
            throw e;
        }
    }
    async getFromAPI(){
        if(this.userID == -1) return false;
        try{
            const data = await UserService.fetchAPI(this.userID);
            if(data==undefined) return false;
            this.creationDate = data?.creationDate;
            this.fullName = data?.fullName;
            this.screenName = data?.screenName;
            this.biography = data?.biography;
            this.isProtected = data?.isProtected;
            this.isVerified = data?.isVerified;
            this.language = data?.language;
            this.placeDescription = data?.placeDescription;
            this.latestStats.push(data?.latestStats)
        } catch(e){
            throw e;
        }
    }
    async get(){
        if(this.userID == -1) return false;
        try{
            if( await this.latestStats.getFromDatabase() == false ){
                await this.getFromAPI();
            }
        } catch(e){
            throw e;
        }
    }
    async uploadToDatabase(){
        if(this.userID == -1) return false;
        try{
            await UserService.create(this.getData());
            await this.latestStats.uploadToDatabase();
            await this.followers.uploadToDatabase();
            console.log(`[Models/User] Uploaded user ${this.userID} (${this.latestStats.last().followersCount} followers)`)
        } catch(e){
            throw e;
        }
    }
    async uploadToDatabaseComplete(){
        try{
            await this.uploadToDatabase();
            if(this.latestStats.last().followersCount >= 10000){
                    await this.followers.getFromDatabase();
                    if(this.followers.length == 0){
                        await this.followers.getFromAPI();
                        await this.followers.uploadToDatabase();
                    }
            }
        } catch(e){
            console.log(e)
        }
    }
}

module.exports = {UserModel, UserStatsModel, UserStatsArray, UserFollowerArray}

/* Connection.Database.connect().then(async () => {
    const user = new UserModel({userID: '68844197'});
    await user.getFromDatabase();
    await user.getFromAPI();
    console.dir(user, {depth: null})
}) */