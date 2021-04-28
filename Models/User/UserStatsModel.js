const UserService = require("../../Services/User/UserService");
const {UserStatsService} = require("../../Services/User/UserService");

/**
 * Compares fields to determine if two stats JSON are different
 * @param {import("../../Services/User/UserStatsService").UserStatsJSON} stat1 
 * @param {import("../../Services/User/UserStatsService").UserStatsJSON} stat2 
 */
const areDifferentStats = (stat1, stat2) => {
    return (
        stat1.favoritesCount != stat2.favoritesCount ||
        stat1.followersCount != stat2.followersCount ||
        stat1.followingCount != stat2.followingCount ||
        stat1.listedCount != stat1.listedCount ||
        stat1.statusesCount != stat1.listedCount
    )
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
            this.latestStats = {favoritesCount, followersCount, followingCount, listedCount, statusesCount, updateDate, userID: this.userID}
        }
    }
    async fetchFromAPI(){
        if(this.userID == -1) return;
        try{
            let {latestStats} = await UserService.fetchAPI(this.userID);
            this.latestStats = latestStats;
            return this.latestStats;
        } catch(e){
                const defaultStats = {favoritesCount: -1, followersCount: -1, followingCount: -1, listedCount: -1, statusesCount: -1, updateDate: new Date(), userID: this.userID, isSuspended: false }
            if(e[0]?.code == 63 && e[0]?.message == 'User has been suspended.'){
                defaultStats.isSuspended = true;

            } else {
                throw e;
            }
        }
    }
    async read(){
        if(this.userID == -1) return;
        this.savedStats = await UserStatsService.read(this.userID);
        return this.savedStats;
    }
    async upload(){
        if(this.userID == -1) return;
        if(!this.latestStats == undefined) return;
        try{
            await this.read();
            if(this.savedStats.length == 0 || areDifferentStats(this.savedStats[this.savedStats.length-1], this.latestStats)){
                await UserStatsService.create(this.latestStats);
                this.savedStats.push(this.latestStats)
            }
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