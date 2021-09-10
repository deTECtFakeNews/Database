const { Promise } = require("node-fetch");
const TweetEntityService = require("../../Services/Tweet/TweetEntityService");

class TweetEntity {
    tweetID;
    type;
    value;
    constructor({tweetID, type, value}){
        this.tweetID = tweetID;
        this.type = type;
        this.value = value;
    }
    getJSON(){
        return {
            tweetID: this.tweetID, 
            type: this.type, 
            value: this.value
        }
    }
    async uploadToDatabase(){
        try{
            await TweetEntityService.create(this.getJSON())
        } catch(e){
            // throw e;
        }
    }
}

class TweetEntitiesModel extends Array {
    tweetID;
    fullText;
    constructor({tweetID, fullText}){
        super();
        this.tweetID = tweetID;
        this.fullText = fullText;
        TweetEntityService.extract(fullText).forEach(this.push.bind(this));
    }
    push({type, value}){
        let entity = new TweetEntity({tweetID: this.tweetID, type, value});
        super.push(entity);
    }
    async uploadToDatabase(){
        let uploads = this.map(entity => entity.uploadToDatabase)
        await Promise.all(uploads);
        console.log('Uploaded entities')
    }
}

module.exports = TweetEntitiesModel;