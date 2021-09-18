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
    executionDate;
    constructor(aUserID, bUserID){
        this.aUser = new UserModel({userID: aUserID});
        this.bUser = new UserModel({userID: bUserID});
    }
    async executeSimCommunity(){
        // TODO: Improve performance
        let communityA = await UserRelationAnalysisService.getCommunity(this.aUser.userID);
        let communityB = await UserRelationAnalysisService.getCommunity(this.bUser.userID);
        let communityIntersection = await UserRelationAnalysisService.getCommunityIntersection(this.bUser.userID, this.aUser.userID);
        if(communityA == 0 || communityB == 0){
            this.simCommunity = 0;
        } else {
            this.simCommunity = communityIntersection/Math.min(communityA,communityB);
        }
        return this.simCommunity;
    }
    async executeSimMentions(){
        this.simMentions = 0.5*(await UserRelationAnalysisService.weightUserMentions(this.aUser.userID, this.bUser.userID))
            + 0.5*(await UserRelationAnalysisService.weightUserMentions(this.bUser.userID, this.aUser.userID));
        return this.simMentions;
    }
    async executeSimRetweets(){
        this.simRetweets = 0.5*(await UserRelationAnalysisService.weightUserRetweets(this.aUser.userID, this.bUser.userID))
            + 0.5*(await UserRelationAnalysisService.weightUserRetweets(this.bUser.userID, this.aUser.userID));
        return this.simRetweets;
    }
    async executeSimHastags(){
        let hashtagsA = await UserRelationAnalysisService.getTopHashtags(this.aUser.userID);
        let hashtagsB = await UserRelationAnalysisService.getTopHashtags(this.bUser.userID);
        hashtagsA = new Set([...hashtagsA.slice(0, 10).map(elem=>elem.hashtag.toLowerCase())]);
        hashtagsB = new Set([hashtagsB.slice(0, 10).map(elem=>elem.hashtag.toLowerCase())]);
        let countIntersection = 0;
        hashtagsA.forEach(h=>{
            if(hashtagsB.find(h)) countIntersection++;
        })
        this.simHashtags = countIntersection/10;
    }
    async executeSimProfile(){
        await this.aUser.getFromDatabase();
        await this.bUser.getFromDatabase();
        // Compare languages
        let sameLanguages = this.aUser.language != undefined && this.bUser.language != undefined && this.aUser.language == this.bUser.language;
        // Compare places
        let samePlaces = this.aUser.placeDescription != undefined && this.bUser.placeDescription != undefined && this.aUser.placeDescription == this.bUser.placeDescription;
        // Get dates
        let dateWeight = Math.min( new Date() - this.aUser.creationDate, new Date() - this.bUser.creationDate ) / Math.max( new Date() - this.aUser.creationDate, new Date() - this.bUser.creationDate );
        this.simProfile = ((sameLanguages ? 1 : 0) + (samePlaces ? 1 : 0) + dateWeight)/3;
        return this.simProfile;
    }
    async executeAll(){
        await Promise.all([
            this.executeSimCommunity(),
            this.executeSimMentions(), 
            this.executeSimRetweets(),
            this.executeSimProfile(),
            this.executeSimHastags()
        ])
        this.executionDate = new Date()
    }
    getJSON(){
        return{
            aUserID: this.aUser.userID, 
            bUserID: this.bUser.userID, 
            simCommunity: this.simCommunity,
            simMentions: this.simMentions, 
            simRetweets: this.simRetweets,
            simLikes: this.simLikes,
            simHashtags: this.simHashtags,
            simTopics: this.simTopics,
            simProfile: this.simProfile,
            executionDate: this.executionDate
        }
    }
    async uploadToDatabase(){
        try{
            await UserRelationAnalysisService.create(this.getJSON());
        } catch(e){
            console.error(e);
        }
    }
    async verifyWithAPI(){

    }
}

module.exports = UserRelationAnalysisModel;