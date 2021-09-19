const Connection = require("../../Data");
const UserRelationAnalysisService = require("./service");
const UserRelationCommunitiesAnalysis = require("./UserRelationCommunities");
const UserRelationHashtagAnalysis = require("./UserRelationHashtag");
const UserRelationMentionsAnalysis = require("./UserRelationMentions");
const UserRelationProfileAnalysis = require("./UserRelationProfile");
const UserRelationRetweetsAnalysis = require("./UserRelationRetweets");

class UserRelation {
    aUserID;
    bUserID;

    simCommunity;
    simHashtags;
    simMentions;
    simProfile;
    simRetweets;
    constructor(aUserID, bUserID){
        this.aUserID = aUserID;
        this.bUserID = bUserID;
    }

    async getSimCommunities(){
        this.simCommunity = await UserRelationCommunitiesAnalysis.calculate(this.aUserID, this.bUserID);
        return this.simCommunity;
    }

    async getSimHashtags(){
        this.simHashtags = await UserRelationHashtagAnalysis.calculate(this.aUserID, this.bUserID);
        return this.simCommunities;
    }

    async getSimMentions(){
        this.simMentions = await UserRelationMentionsAnalysis.calculate(this.aUserID, this.bUserID);
    }

    async getSimProfile(){
        this.simProfile = await UserRelationProfileAnalysis.calculate(this.aUserID, this.bUserID);
    }

    async getSimRetweets(){
        this.simRetweets = await UserRelationRetweetsAnalysis.calculate(this.aUserID, this.bUserID);
    }

    async calculate({ weightCommunities = 1/5, weightHashtags = 1/5, weightMentions = 1/5, weightProfile = 1/5, weightRetweets = 1/5 } = {}){
        await Promise.all([
            this.getSimCommunities(),
            this.getSimHashtags(), 
            this.getSimMentions(), 
            this.getSimProfile(), 
            this.getSimRetweets()
        ]);
        if(Object.values(this).filter(value => value > 0).length <=3){
            console.log(this.aUserID, this.bUserID, '❌');
            return;
        }
        try{
            this.executionDate = new Date();
            await UserRelationAnalysisService.create(this);
            console.log(this.aUserID, this.bUserID, '✔️', prediction)
        } catch(e){
            console.error("An error ocurred", this.aUserID, this.bUserID, e);
        }
    }
}

class UserRelationBuffer extends Array{
    maxElements;
    params;
    constructor(maxElements, params){
        super();
        this.maxElements = maxElements;
        this.params = params;
    }
    async push(item){
        super.push(item);
        if(this.length >= this.maxElements){
            await this.calculate();
            this.length = 0;
        }
    }
    async calculate(){
        await Promise.all(this.map(userRelation=>userRelation.calculate(this.params)))
    }
}

let buffer = new UserRelationBuffer(20, {
    weightCommunities: 0.4, 
    weightMentions: 0.24, 
    weightRetweets: 0.24,
    weightHashtags: 0.08,
    weightProfile: 0.04
});

Connection.Database.connect().then(async () => {
    Connection.Database.connections['user-main-read'].query(`
        SELECT userID FROM view_UserStatsLast
        WHERE followersCount >= 10000
    `)
    .on('result', async a => {
        Connection.Database.connections['user-main-read'].pause();
            Connection.Database.connections['user-main-write'].query(`
                SELECT 
                view_UserStatsLast.userID 
                FROM view_UserStatsLast
                LEFT JOIN Tweet ON Tweet.authorID = view_UserStatsLast.userID
                WHERE followersCount < 10000 AND followersCount > 1000
            `)
            .on('result', async b => {
                Connection.Database.connections['user-main-write'].pause();
                    let analysis = new UserRelation(a.userID, b.userID);
                    await buffer.push(analysis);
                Connection.Database.connections['user-main-write'].resume();
            })
            .on('error', console.error)
        Connection.Database.connections['user-main-read'].resume();
    })
    .on('error', console.error)
})