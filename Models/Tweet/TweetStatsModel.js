const TweetService = require("../../Services/Tweet/TweetService");
const { TweetStatsService } = require("../../Services/Tweet/TweetService");

class TweetStats{
    tweetID;
    updateDate;
    retweetCount;
    favoriteCount;
    replyCount;
    status;
    constructor({tweetID, updateDate, retweetCount, favoriteCount, replyCount, status}){
        this.tweetID = tweetID;
        this.updateDate = updateDate || new Date();
        this.retweetCount = retweetCount || -1;
        this.favoriteCount = favoriteCount || -1;
        this.replyCount = replyCount || -1;
        this.status = status || 'active';
    }
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
        let {tweetID, updateDate, retweetCount, favoriteCount, replyCount, status} = tweetStats;   
        if(updateDate || retweetCount || favoriteCount || replyCount){
            this.latestStats = new TweetStats({tweetID: this.tweetID, updateDate, retweetCount, favoriteCount, replyCount})
        }     
    }
    async fetchFromAPI(){
        if(this.tweetID == -1) return;
        try{
            let {latestStats} = await TweetService.fetchAPI(this.tweetID);
            this.latestStats = latestStats;
            return this.latestStats;
        } catch(e) {
            if(e[0].code == '144'){
                this.latestStats = new TweetStats({tweetID: this.tweetID, status: 'not found'})
            } else if(e[0].code == '179'){
                this.latestStats = new TweetStats({tweetID: this.tweetID, status: 'private'})
            } else if(e[0].code == '34'){
                this.latestStats = new TweetStats({tweetID: this.tweetID, status: 'not exits'})
            } else if(e[0].code == '63'){
                this.latestStats = new TweetStats({tweetID: this.tweetID, status: 'user suspended'})
            } else {
                throw e;
            }
        }
    }
    async readSelf(){
        try{
            await this.fetchFromAPI();
        } catch(e){
            try{
                await this.read();
            } catch(ee){
                throw ee;
            }
        }
    }
    async read(){
        if(this.tweetID == -1) return;
        try{
            this.savedStats = await TweetStatsService.read(this.tweetID);
            if(this.latestStats == undefined) this.latestStats = this.savedStats[this.savedStats.length-1];
        } catch(e){
            throw e;
        }
        return this.savedStats;
    }
    async upload(){ 
        if(this.tweetID == -1) return;
        if(this.latestStats == undefined) return;
        try{ 
            await TweetStatsService.create(this.latestStats);
            this.savedStats.push(this.latestStats);
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