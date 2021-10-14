const Connection = require("../../Data");

const mentions = require("./mentions");
const hashtags = require("./hashtags");
const retweets = require("./retweets");
const community = require("./community");
const UserRelationAnalysisService = require('./database')

class UserRelation {
    aUserID;
    bUserID;
    simMentions;
    simHashtags;
    simRetweets;
    simCommunity;
    constructor(aUserID, bUserID){
        this.aUserID = aUserID;
        this.bUserID = bUserID;
    }
    get isEmpty(){
        return this.simMentions + this.simHashtags + this.simRetweets + this.simCommunities == 0 || this.simMentions + this.simHashtags + this.simRetweets + this.simCommunities == NaN;
    }
    async calculateMentions(){
        this.simMentions = await mentions(this.aUserID, this.bUserID);
    }
    async calculateHashtags(){
        this.simHashtags = await hashtags(this.aUserID, this.bUserID);
    }
    async calculateRetweets(){
        this.simRetweets = await retweets(this.aUserID, this.bUserID);
    }
    async calculateCommunity(){
        this.simCommunity = await community(this.aUserID, this.bUserID);
    }
    async calculate(){
        await Promise.all([
            this.calculateMentions(),
            this.calculateHashtags(),
            this.calculateCommunity(),
            this.calculateRetweets(), 
        ])
        this.executionDate = new Date();
        if(!this.isEmpty){
            console.log(this);
        }
    }

    async uploadToDatabase(){
        await UserRelationAnalysisService.create(this);
    }

}

let buffer = [];


Connection.Database.connect().then(async () => {
    Connection.Database.connections['user-main-read'].query(`
        SELECT 
            userID AS aUserID, 
            followerID AS bUserID
        FROM UserFollower
    `).on('result', async ({aUserID, bUserID}) => {
        Connection.Database.connections['user-main-read'].pause();
        const analysis = new UserRelation(aUserID, bUserID);
        if(buffer.length > 10){
            await Promise.all(buffer.map(ur => ur.calculate()));
            await Promise.all(buffer.map(i => i.uploadToDatabase()))
            buffer.length = 0;
        } else {
            buffer.push(analysis);
        }
        // await analysis.calculate();
        // console.log(aUserID, bUserID)
        Connection.Database.connections['user-main-read'].resume();
    })
})