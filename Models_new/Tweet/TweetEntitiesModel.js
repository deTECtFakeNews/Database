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
            // console.log(this.getJSON())
            await TweetEntityService.create(this.getJSON())
        } catch(e){
            throw e;
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
        let values = this.map(entity=>[entity.tweetID, entity.type, entity.value]);
        try{
            await TweetEntityService.createMany(values);
            console.log(this.tweetID, 'Uploaded entities')
        } catch(e){
            console.log('Error uploading entities', e)
        }
    }

    async uploadToDatabaseIndividually(){
        try{
            await Promise.all(this.map(entity => entity.uploadToDatabase()));
            console.log(this.tweetID, 'Uploaded entities')
        } catch(e){
            console.log('Error uploading entities', e)
        }
    }
}

class TweetEntitiesModelBuffer extends Array {
    maxSize;
    tweetIDs = []
    constructor(maxSize){
        super();
        this.maxSize = maxSize;
    }

    async push(entitiesModel){
        let values = entitiesModel.map(entity=>[entity.tweetID, entity.type, entity.value])
        super.push(...values);
        this.tweetIDs.push(entitiesModel.tweetID)
        if(this.length >  this.maxSize){
            await this.uploadToDatabase();
            this.length = 0;
            this.tweetIDs = [];
        }
    }

    async uploadToDatabase(){
        try{
            await TweetEntityService.createMany(this.map(v=>v));
            this.tweetIDs.forEach(tweetID=>{
                console.log(tweetID, 'Uploaded entities')
            })
        } catch(e){
            throw e;
        }
    }

}

module.exports = {TweetEntitiesModel, TweetEntitiesModelBuffer};