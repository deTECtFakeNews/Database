const TweetService = require("../../Services/Tweet/TweetService");
const { UserModel } = require("../User/UserModel");

class TweetRetweetModelRow {
    /**@type {String} */
    tweetID;
    /**@type {String} */
    authorID;
    /**@type {Date} */
    creationDate;
    /**@type {require('../User/UserModel')} */
    author;
    constructor(data){
        this.tweetID = data?.tweetID || -1;
        this.authorID = data?.authorID || -1;
        this.creationDate = data?.creationDate;
        this.user = new UserModel(data?.author)
    }
    getData(){
        return {
            tweetID: this.tweetID,
            authorID: this.authorID;
            creationDate: this.creationDate
        }
    }
    async uploadToDatabase(){
        if(this.tweetID == -1) return false;
        try{
            // First upload the user
            await this.user.uploadToDatabase();
            // Upload relationship
            await TweetService.TweetRetweetService.create(this.getData())
        } catch(e){
            throw e;
        }
    }
    isEmpty(){
        return this.authorID == undefined
    }
}

class TweetRetweetArray extends Array<TweetRetweetModelRow>{
    #tweetID;
    #shouldUpload;
    constructor(data){
        super();
        this.#tweetID = data?.tweetID || -1;
        this.push(data)
    }
    push(data){
        let row = new TweetRetweetModelRow(data);
        if(row.isEmpty()) return;
        this.#shouldUpload = true;
        super.push(row);
    }
    last(){
        return this[this.length-1]
    }
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
    async getFromAPI(){
        if(this.#tweetID == -1) return false;
        // Allow to upload
        this.#shouldUpload = true;
        // Empty
        this.length = 0;
        for(let retweet of await TweetService.TweetRetweetService.fetchAPI(this.#tweetID)){
            this.push(retweet)
        }
    }
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