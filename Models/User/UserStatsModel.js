const UserService = require("../../Services/User/UserService");
const {UserStatsService} = require("../../Services/User/UserService");

class UserStats {
    favoritesCount;
    followersCount;
    followingCount;
    listedCount;
    statusesCount;
    updateDate;
    status;
    userID;
    constructor({favoritesCount, followersCount, followingCount, listedCount, statusesCount, updateDate, status, userID}){
        this.favoritesCount = favoritesCount || -1;
        this.followersCount = followersCount || -1;
        this.followingCount = followingCount || -1;
        this.listedCount = listedCount || -1;
        this.statusesCount = statusesCount || -1;
        this.updateDate = updateDate || new Date();
        this.status = status || 'active';
        this.userID = userID;
    }
}

class UserStatsModel {
    /**@type {String} ID of User in Twitter and Database*/
    userID;
    /**@type {Array<import("../../Services/User/UserStatsService").UserStatsJSON>} */
    savedStats = [];
    /**@type {import("../../Services/User/UserStatsService").UserStatsJSON} */
    latestStats;
    /**
     * Creates a new object for managing User's stats
     * @param {import("../../Services/User/UserStatsService").UserStatsJSON} userStats Initial data to load in `stats`
     */
    constructor(userStats){
        this.userID = userStats?.userID || -1;
        let {favoritesCount, followersCount, followingCount, listedCount, statusesCount, updateDate} = userStats;
        if(favoritesCount || followersCount || followingCount || listedCount || statusesCount){
            this.latestStats = new UserStats({favoritesCount, followersCount, followingCount, listedCount, statusesCount, updateDate, userID: this.userID})
        } else {
            this.latestStats = undefined;
        }
    }
    async fetchFromAPI(){
        if(this.userID == -1) return;
        if(this.latestStats) return;
        try{
            let {latestStats} = await UserService.fetchAPI(this.userID);
            this.latestStats = latestStats;
            return this.latestStats;
        } catch(e){
            if(e[0].code == '17'){
                this.latestStats = new UserStats({userID: this.userID, status: 'no match'})
            } else if(e[0].code == '50'){
                this.latestStats = new UserStats({userID: this.userID, status: 'not found'})
            } else if(e[0].code == '63'){
                this.latestStats = new UserStats({userID: this.userID, status: 'suspended'})
            } else {
                throw e;
            }
        }
    }
    async read(){
        if(this.userID == -1) return;
        try{
            this.savedStats = await UserStatsService.read(this.userID);
            if(this.savedStats.length == 0) throw "No stats sorry";
            if(this.latestStats == undefined) this.latestStats = this.savedStats[this.savedStats.length-1];
            return this.savedStats;
        } catch(e) {
            throw e;
        }
    }
    async readSelf(){
        try{
            await this.fetchFromAPI()
        } catch(e) {
            try{
                await this.read()
            } catch(ee) {
                throw ee;
            }
        }
    }
    async upload(){
        if(this.userID == -1) return;
        if(this.latestStats == undefined) return;
        try{
            await UserStatsService.create(this.latestStats);
            this.savedStats.push(this.latestStats)
        } catch(e) {
            throw e
        }
    }
    getMax(stat){
        if(this.userID == -1) return -1;
        if(this.savedStats.length == 0) return -1;
        return Math.max( ...this.savedStats.map(s => s[stat]) );
    }
}

module.exports = UserStatsModel;