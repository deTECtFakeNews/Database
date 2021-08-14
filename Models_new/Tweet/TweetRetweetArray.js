const TweetService = require("../../Services/Tweet/TweetService");
const UserModel = require("../User/UserModel");

class TweetRetweetModelRow {
    /**@type {String} */
    tweetID;
    /**@type {String} */
    authorID;
    /**@type {Date} */
    creationDate;
    /**@type {require('../User/UserModel')} */
    author;
    /**
     * @constructor
     * @param {import("../../Services/Tweet/TweetRetweetService").TweetRetweetJSON} data Retweet data
     */
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.authorID = data?.authorID || -1;
        this.creationDate = data?.creationDate;
        this.user = new UserModel(data?.author || {userID: data?.authorID})
    }
    /**
     * Get data in JSON format
     * @returns {import("../../Services/Tweet/TweetRetweetService").TweetRetweetJSON}
     */
    getJSON(){
        return {
            tweetID: this.tweetID,
            authorID: this.authorID,
            creationDate: this.creationDate
        }
    }
    /**
     * Upload tweet-retweet relationship to database 
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.tweetID == -1) return false;
        if(this.isEmpty()) return false;
        try{
            // First upload the user
            await this.user.uploadToDatabase();
            // Upload relationship
            await TweetService.TweetRetweetService.create(this.getJSON())
        } catch(e){
            throw e;
        }
    }
    /**
     * Return true if required fields are empty
     * @returns {Boolean}
     */
    isEmpty(){
        return this.authorID == undefined
    }
}

class TweetRetweetArray extends Array{
    /**@type {String} */
    #tweetID;
    /**@type {Boolean} */
    #shouldUpload;
    /**
     * @constructor
     * @param {{tweetID: String}} data Initial data to load
     */
    constructor(data){
        super();
        this.#tweetID = data?.tweetID || -1;
        this.push(data)
    }
    /**
     * Push retweet
     * @param {import("../../Services/Tweet/TweetRetweetService").TweetRetweetJSON} data Retweet data
     * @returns 
     */
    push(data){
        let row = new TweetRetweetModelRow(data);
        if(row.isEmpty()) return;
        this.#shouldUpload = true;
        super.push(row);
    }
    /**
     * Get retweets from database
     * @returns {Promise<void>}
     */
    getFromDatabase(){
        if(this.#tweetID == -1) return false;
        // Avoid updating existing data
        this.#shouldUpload = false;
        // Empty
        this.length = 0;
        // Get
        return new Promise(async (resolve, reject) => {
            await TweetService.TweetRetweetService.stream(this.#tweetID,  {
                onResult: rt => {
                    super.push( new TweetRetweetModelRow(rt) )
                },
                onEnd: resolve, 
                onError: reject
            })
        })
    }
    /**
     * Get retweets from api
     * @returns {Promise<void>}
     */
    async getFromAPI(){
        if(this.#tweetID == -1) return false;
        // Allow to upload
        this.#shouldUpload = true;
        // Empty
        this.length = 0;
        try{
            for(let retweet of await TweetService.TweetRetweetService.fetchAPI(this.#tweetID)){
                this.push(retweet)
            }
        } catch(e){
            throw e;
        }
    }
    /**
     * Upload all retweets to database
     * @returns {Promise<void>}
     */
    async uploadToDatabase(){
        if(this.#tweetID == -1 || !this.#shouldUpload) return false;
        for(let i = 0; i < this.length; i++){
            try{
                await this[i].uploadToDatabase();
            } catch(e){
                console.log(e)
            }
        }
    }
}

module.exports = TweetRetweetArray;