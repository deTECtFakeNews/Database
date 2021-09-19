const TweetService = require("../../Services/Tweet/TweetService");
const UserModel = require("../User/UserModel");

class TweetRetweetModelRow {
    tweetID;
    authorID;
    constructor(tweetID, authorID){
        this.tweetID = tweetID;
        this.authorID = authorID;
    }
    async uploadToDatabase({verifyUser = false} = {}){
        let userExistsInDB = false;
        if(verifyUser){
            let user  = new UserModel({userID: this.authorID});
            userExistsInDB = await user.getFromDatabase();
        }
        if(verifyUser && !userExistsInDB) return;
        try{
            await TweetService.TweetRetweetService.create(this);
            // console.log(this.tweetID, this.authorID, "Uploaded rt")
        } catch(e){
            console.error(this.tweetID, this.authorID, "Error uploading rt");
            // throw e;
        }
    }
}

class TweetRetweetArray extends Array{
    /**@type {String} */
    #tweetID;
    /**@type {Boolean} */
    #shouldUpload;
    constructor(data){
        super();
        this.#tweetID = data?.tweetID || -1;
    }
    push(authorID){
        if(authorID == undefined) return;
        this.#shouldUpload = false;
        super.push( new TweetRetweetModelRow(this.#tweetID, authorID) );
    }
    getFromDatabase(){
        if(this.#tweetID == -1) return false;
        this.#shouldUpload = false;
        this.length = 0;
        return new Promise((resolve, reject) => {
            TweetService.TweetRetweetService.stream(this.#tweetID, {
                onResult: row=>{
                    this.push(row.authorID);
                }, 
                onError: reject,
                onEnd: resolve
            })
        })
    }
    async getFromAPI(){
        if(this.#tweetID == -1) return false;
        this.#shouldUpload = true;
        this.length = 0;
        try{
            let data = await TweetService.TweetRetweetService.fetchAPIFast(this.#tweetID, {next_cursor: this.api_next_cursor});
            for(let authorID of data.ids){
                this.push(authorID);
            }
            this.api_next_cursor = data.next_cursor;
            console.log(this.#tweetID, `Fetched ${this.length} items from API. Next cursor is ${data.next_cursor}`)
        } catch(e){
            throw e;
        }
    }
    async uploadToDatabase(){
        // console.log(this.#tweetID == -1);
        if(this.#tweetID == -1) return;
        try{
            await Promise.all(
                this.map(rt => rt.uploadToDatabase())
            )
        } catch(e){
            throw e;
        }
    }
    async getFromAPIAndUploadToDatabase(){
        this.#shouldUpload = true;
        if(this.api_next_cursor == "0") return;
        try{
            await this.getFromAPI();
            await this.uploadToDatabase();
            this.length = 0;
            await this.getFromAPIAndUploadToDatabase();
        } catch(e){
            throw e;
        }
    }
}

module.exports = TweetRetweetArray;