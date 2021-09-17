const Connection = require("../../Data");
const UserRelationAnalysisService = require("../../Services/User/UserRelationAnalysisService");
const UserModel = require("./UserModel");

class UserRelationAnalysisModel{
    aUser;
    bUser;
    simCommunity;
    simMentions;
    simRetweets;
    simLikes;
    simHashtags;
    simTopics;
    simProfile;
    constructor(aUserID, bUserID){
        this.aUser = new UserModel(aUserID);
        this.bUser = new UserModel(bUserID);
    }
    async getSimCommunity(){
        let communityA = await UserRelationAnalysisService.getCommunity(this.aUser.userID);
        let communityB = await UserRelationAnalysisService.getCommunity(this.bUser.userID);
        let sharedDirectCommunity = [...communityA, ...communityB];
        // intersection(communityA, communityB)/(union(community A, community B) - intersection(communityA, communityB))
        // repeat for 2deg (is it thaat necessary?)
    }
    async getSimMentions(){
        return 0.5*UserRelationAnalysisService.weightUserMentions(this.aUser.userID, this.bUser.userID)
            + 0.5*UserRelationAnalysisService.weightUserMentions(this.bUser.userID, this.aUser.userID);
    }
    async getSimRetweets(){
        return 0.5*UserRelationAnalysisService.weightUserRetweets(this.aUser.userID, this.bUser.userID) 
            + 0.5*UserRelationAnalysisService.weightUserRetweets(this.bUser.userID, this.aUser.userID);
    }
    async getSimHastags(){
        let topA = await UserRelationAnalysisService.getTopHashtags(this.aUser.userID);
        let topB = await UserRelationAnalysisService.getTopHashtags(this.bUser.userID);
        // Get intersection
    }
    async getSimProfile(){
        await this.aUser.getFromDatabase();
        await this.bUser.getFromDatabase();
        // Compare languages
        let sameLanguages = this.aUser.language != undefined && this.bUser.language != undefined && this.aUser.language == this.bUser.language;
        // Compare places
        let samePlaces = this.aUser.placeDescription != undefined && this.bUser.placeDescription != undefined && this.aUser.placeDescription == this.bUser.placeDescription;
        // Get dates
        let dateWeight = Math.min( new Date() - this.aUser.creationDate, new Date() - this.bUser.creationDate ) / Math.max( new Date() - this.aUser.creationDate, new Date() - this.bUser.creationDate );
        let result = (sameLanguages ? 1 : 0) + (samePlaces ? 1 : 0) + dateWeight;
        return result/3;
    }
    async getResult({ weightSimCommunity, weightSimMentions, weightSimRetweets, weightSimHashtags, weightSimLikes, weightSimTopics, weightSimProfile }){
        return weightSimCommunity*(await this.getSimCommunity()) + 
            weightSimMentions*(await this.getSimMentions()) + 
            weightSimRetweets*(await this.getSimRetweets()) + 
            weightSimHashtags*(await this.weightSimHashtags()) + 
            weightSimProfile*(await this.getSimProfile());
    }
    async uploadToDatabase(){

    }
    async verifyWithAPI(){
        
    }
}