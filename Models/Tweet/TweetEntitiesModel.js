const {TweetEntitiesService} = require("../../Services/Tweet/TweetService");


class TweetEntitiesModel{
    tweetID;
    fullText;
    entities = []
    constructor({tweetID, fullText}){
        this.tweetID = tweetID;
        this.fullText = fullText;
    }
    async fetchFromAPI(){
        if(this.tweetID == -1) return;
        try{
            this.entities = await TweetEntitiesService.getAndParse(this.fullText);
        } catch(e){
            throw e;
        }
    }
    async read(){
        if(this.tweetID == -1) return;
        try{
            this.entities = await TweetEntitiesService.read(this.tweetID);
        } catch(e){
            throw e;
        }
    }
    async upload(){
        if(this.tweetID == -1) return;
        try{
            for(let entity of this.entities){
                await TweetEntitiesService.create(this.tweetID, entity)
            }
        } catch(e){
            throw e;
        }
    }
}

module.exports = TweetEntitiesModel;