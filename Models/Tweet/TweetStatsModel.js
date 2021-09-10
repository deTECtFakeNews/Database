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
    /**
     * @constructor
     * @param {import("../../Services/Tweet/TweetService").TweetStatsJSON} data Stats snapshot data
     */
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.updateDate = data?.updateDate || new Date();
        this.retweetCount = data?.retweetCount;
        this.favoriteCount = data?.favoriteCount;
        this.replyCount = data?.replyCount;
        this.status = data?.status;
    }
    /**
     * Returns data in JSON format
     * @returns {import("../../Services/Tweet/TweetService").TweetStatsJSON}
     */
    getJSON(){
        return {
            tweetID: this.tweetID,
            updateDate: this.updateDate,
            retweetCount: this.retweetCount,
            favoriteCount: this.favoriteCount,
            replyCount: this.replyCount,
            status: this.status
        }
    }
    /**
     * Returns true if all properties are undefined
     * @returns {Boolean}
     */
    isEmpty(){
        return this.retweetCount == undefined && 
            this.favoriteCount == undefined && 
            this.replyCount == undefined && 
            this.status == undefined
    }
}

class TweetStatsModel extends Array {
    /**
     * Twitter API error codes
     * @static
     * @type {Object.<Number, String>}
     */
    static errorCodes = {
        34: 'NOT_FOUND',
        144: 'NOT_FOUND',
        179: 'UNAUTHORIZED',
        421: 'REMOVED', 
        422: 'SUSPENDED'
    }
    /**@type {String} */
    #tweetID;
    /**@type {Boolean} */
    #shouldUpload;
    /**
     * @constructor
     * @param {import("../../Services/Tweet/TweetStatsService").TweetStatsJSON} data Initial data to load
     */
    constructor(data){
        super();
        this.#tweetID = data?.tweetID || -1;
        this.push( data );
    }
    /**
     * Push new stats snapshot
     * @param {import("../../Services/Tweet/TweetStatsService").TweetStatsJSON} data Stats snapshot to be uploaded
     * @returns 
     */
    push(data){
        let row = new TweetStatsModelRow(data);
        if(row.isEmpty()) return;
        this.#shouldUpload  = true;
        super.push( row )
    }
    /**
     * Return the last stats record
     * @returns {TweetStatsModelRow}
     */
    last(){
        return this[this.length-1];
    }
    /**
     * Get all stats from database
     * @returns {Promise<void>}
     */
    async getFromDatabase(){
        if(this.#tweetID == -1) return false;
        // Avoid uploading duplicates
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Get
        try{
            for(let stats of await TweetService.TweetStatsService.read(this.#tweetID)){
                super.push( new TweetStatsModelRow(stats) )
            }
        } catch(e){
            throw e;
        }
    }
    /**
     * Upload last stat to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.#tweetID == -1) return false;
        if(this.last() == undefined) return false;
        try{
            await TweetService.TweetStatsService.create(this.last().getJSON());
        } catch(e){
            throw e;
        }
    }
    /**
     * Given a Twitter API error number, uploads the error to the stats
     * @param {Number} e Twitter API error number
     */
    pushError(e){
        this.push({
            favoriteCount: 0, 
            replyCount: 0, 
            retweetCount: 0, 
            status: TweetStatsModel.errorCodes[e],
            tweetID: this.#tweetID, 
            updateDate: new Date()
        })
    }

}

module.exports = TweetStatsModel;