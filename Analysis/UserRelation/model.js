const { UserFollowerService } = require("../../Services/User/UserService");
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
            console.log(this.aUserID, this.bUserID, '✔️')
        } catch(e){
            console.error("An error ocurred", this.aUserID, this.bUserID, e);
        }
    }

    async verify(){
        try{
            let relationshipData = await UserFollowerService.fetchAPIVerify(this.aUserID, this.bUserID);
            let verificationResult = 0;
            if(relationshipData.length>0){
                for(let relation of relationshipData){
                    try{
                        await UserFollowerService.create(relation);
                    } catch(e){
                        console.log("Error uploading pair", relation)
                    }
                }
                verificationResult = 1;
            }
            await UserRelationAnalysisService.update({aUserID: this.aUserID, bUserID: this.bUserID}, {
                verificationDate: new Date(), 
                verificationResult
            })
            console.log(this.aUserID, this.bUserID, verificationResult == 0 ? '❌' : '✔️');
        } catch(e){
            console.error(e)
        }
    }
}

module.exports = UserRelation;