const TweetService = require("../../Services/Tweet/TweetService");
const { TweetStatsService } = require("../../Services/Tweet/TweetService");

const areDifferentStats = (stat1, stat2)=>{
    return(
        stat1.retweetCount != stat2.retweetCount ||
        stat1.favoriteCount != stat2.favoriteCount ||
        stat1.replyCount != stat2.replyCount
    )
}

class TweetStatsModel {
    /**@type {String} ID of Tweet in Twitter and Database */
    tweetID;
    /**@type {Array<TweetStatsJSON>} */
    savedStats = [];
    /**@type {TweetStatsJSON} */
    latestStats;
    constructor(tweetStats){
        this.tweetID = tweetStats?.tweetID || -1;
        if(tweetStats == undefined) return;

        this.latestStats = {
            tweetID: this.tweetID, 
            updateDate: tweetStats?.updateDate || new Date(),
            retweetCount: tweetStats?.retweetCount || 0, 
            favoriteCount: tweetStats?.retweetCount || 0, 
            replyCount: tweetStats?.replyCount || 0
        }
    }
    async fetchFromAPI(){
        if(this.tweetID == -1) return;
        try{
            let {latestStats} = await TweetService.fetchAPI(this.tweetID);
            this.latestStats = latestStats;
            return this.latestStats;
        } catch(e) {
            const defaultStats = {tweetID: this.tweetID, updateDate: new Date(), retweetCount: -1, replyCount: -1, favoriteCount: -1}
        }
    }
    async read(){
        if(this.tweetID == -1) return;
        this.savedStats = await TweetStatsService.read(this.tweetID);
        return this.savedStats;
    }
    async upload(){ 
        if(this.tweetID == -1) return;
        if(this.latestStats == undefined) return;
        try{ 
            if(this.savedStats.length == 0 || areDifferentStats(this.savedStats[this.savedStats.length-1], this.latestStats)){
                await TweetStatsService.create(this.latestStats);
                this.savedStats.push(this.latestStats);
            }
        } catch(e){
            throw e;
        }
    }
    getMax(stat){
        if(this.tweetID == -1) return -1;
        if(this.savedStats.length == 0) return -1;
        return Math.max( ...this.savedStats.map(s=>s[stat]) );
    }
}

module.exports = TweetStatsModel;