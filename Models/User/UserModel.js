const UserService = require("../../Services/User/UserService");
const UserFollowerModel = require("./UserFollowerModel");
const UserStatsModel = require("./UserStatsModel");
class UserModel {
    /**@type {String} ID of User in Twitter and Database*/
    userID;
    /**@type {Date} Date and time of User creation */
    creationDate;
    /**@type {String} Full name as seen in User profile*/
    fullName;
    /**@type {String} User handle name (e.g., @edvilme)*/
    screenName;
    /**@type {Boolean} `false` if User is visible to the public*/
    isProtected;
    /**@type {Boolean} `true` if Twitter has verified User with blue check*/
    isVerified;
    /**@type {String} User prefered language*/
    language;
    /**@type {String} Place description as seen in User's profile. **Note: does not necessarily correspond to reality** */
    placeDescription;
    /**@type {String} Profile description*/
    biography;
    /**@type {UserStatsModel} */
    stats;
    /**@type {UserFollowerModel} */
    followers;

    /**
     * Creates a new object for managing User
     * @param {import("../../Services/User/UserService").UserJSON} userJSON Data to load into object
     */
    constructor(userJSON){
        this.userID = userJSON?.userID || -1;
        this.creationDate = userJSON?.creationDate;
        this.fullName = userJSON?.fullName;
        this.screenName = userJSON?.screenName;
        this.isProtected = userJSON?.isProtected;
        this.isVerified = userJSON?.isVerified;
        this.language = userJSON?.language;
        this.placeDescription = userJSON?.placeDescription;
        this.biography = userJSON?.biography;
        this.stats = new UserStatsModel(userJSON?.latestStats || {userID: this.userID});
        this.followers = new UserFollowerModel({userID: this.userID});
    }
    toJSON(){
        return {
            userID: this.userID,
            creationDate: this.creationDate, 
            fullName: this.fullName, 
            screenName: this.screenName, 
            isProtected: this.isProtected, 
            isVerified: this.isVerified, 
            language: this.language, 
            placeDescription: this.placeDescription, 
            biography: this.biography
        }
    }

    async fetchSelfFromAPI(){
        if(this.userID == -1) return;
        try{
            let userJSON = await UserService.fetchAPI(this.userID);
            this.creationDate = userJSON.creationDate;
            this.fullName = userJSON.fullName;
            this.screenName = userJSON.screenName;
            this.isProtected = userJSON.isProtected;
            this.isVerified = userJSON.isVerified;
            this.language = userJSON.language;
            this.placeDescription = userJSON.placeDescription;
            this.stats = new UserStatsModel(userJSON.latestStats || {userID: this.userID});
            this.followers = new UserFollowerModel(userJSON);
        } catch(e){
            throw e;
        }
    }

    async fetchFromAPI(){
        if(this.userID == -1) return;
        try{
            await this.stats.fetchFromAPI();
            // Only fetch followers for accounts with 10k+ followers
            if(this.stats.latestStats == undefined) return;
            if(this.stats.latestStats.followersCount < 10000) return;
            await this.followers.fetchFromAPI();
        } catch (e){
            throw e;
        }
    }

    async readSelf(){
        if(this.userID == -1) return;
        try{
            let userJSON = (await UserService.read(this.userID))[0];
            if(userJSON == undefined) throw 'No results';
            this.creationDate = userJSON.creationDate;
            this.fullName = userJSON.fullName;
            this.screenName = userJSON.screenName;
            this.isProtected = userJSON.isProtected;
            this.isVerified = userJSON.isVerified;
            this.language = userJSON.language;
            this.placeDescription = userJSON.placeDescription;
            this.biography = userJSON.biography;
        } catch(e){
            throw e;
        }
    }

    async getSelf(){
        try{
            await this.readSelf();
        } catch(e){
            try{
                await this.fetchSelfFromAPI();
            } catch(ee){
                throw ee;
            }
        }
        return this;
    }

    async read(){
        if(this.userID == -1) return;
        try{
            await this.stats.read();
            await this.followers.read();
        } catch (e){
            throw e;
        }
    }

    async upload({uploadFollowers = true} = {}){
        if(this.userID == -1) return;
        try{
            await UserService.create(this.toJSON());
            if(this.stats.latestStats == undefined) await this.stats.readSelf();
            await this.stats.upload();
            console.log(`Uploaded User ${this.userID} (followers: ${this.stats.latestStats?.followersCount})`)
            if(this.stats.latestStats.followersCount >= 10000 && uploadFollowers){
                if(this.followers.savedFollowers.length == 0) await this.followers.read();
                if(this.followers.savedFollowers.length == 0){
                    await this.followers.fetchFromAPI();
                    await this.followers.upload();
                } else {
                    return;
                }
            }
        } catch(e){
            throw e;
        }
    }

}

module.exports = UserModel;
