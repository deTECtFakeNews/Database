const TweetService = require("../../Services/Tweet/TweetService");

class TweetStatsModelRow {
    /**@type {String} */
    tweetID;
    /**@type {Date} */
    updateDate;
    /**@type {Number} */
    retweetCount;
    /**@type {Number} */
    favoriteCount;
    /**@type {Number} */
    replyCount;
    /**@type {String} */
    status;
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.updateDate = data?.updateDate || new Date();
        this.retweetCount = data?.retweetCount;
        this.favoriteCount = data?.favoriteCount;
        this.replyCount = data?.replyCount;
        this.status = data?.status;
    }
    getData(){
        return {
            tweetID: this.tweetID,
            updateDate: this.updateDate,
            retweetCount: this.retweetCount,
            favoriteCount: this.favoriteCount,
            replyCount: this.replyCount,
            status: this.status
        }
    }
    isEmpty(){
        return this.retweetCount == undefined && this.favoriteCount == undefined && this.replyCount == undefined && this.status == undefined
    }
}

class TweetStatsModel extends Array<TweetStatsModelRow> {
    /**@type {String} */
    #tweetID;
    /**@type {Boolean} */
    #shouldUpload;
    constructor(data){
        super();
        this.#tweetID = data?.tweetID || -1;
        this.push(data);
    }
    push(data){
        let row = new TweetStatsModelRow(data);
        if(row.isEmpty()) return;
        this.#shouldUpload  = true;
        super.push( row )
    }
    last(){
        return this[this.length-1];
    }
    async getFromDatabase(){
        if(this.#tweetID == -1) return false;
        // Avoid uploading duplicates
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Get
        try{
            for(let stats of await TweetService.TweetStatsService.reaad(this.#tweetID)){
                super.push( new TweetStatsModelRow(stats) )
            }
        } catch(e){
            throw e;
        }
    }
    async uploadToDatabase(){
        if(this.#tweetID == -1) return false;
        try{
            await TweetService.TweetStatsService.create(this.last().getData());
        } catch(e){
            throw e;
        }
    }
}

module.exports = TweetStatsModel;