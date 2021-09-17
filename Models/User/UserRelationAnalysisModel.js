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
        this.aUser = new UserModel({userID: aUserID});
        this.bUser = new UserModel({userID: bUserID});
    }
    async getSimCommunity(){
        // TODO: Improve performance
        let communityA = await UserRelationAnalysisService.getCommunity(this.aUser.userID);
        let communityB = await UserRelationAnalysisService.getCommunity(this.bUser.userID);
        let communityIntersection = await UserRelationAnalysisService.getCommunityIntersection(this.bUser.userID, this.aUser.userID);

        this.simCommunity = communityIntersection/(communityA + communityB);
        return this.simCommunity;
    }
    async getSimMentions(){
        this.simMentions = 0.5*(await UserRelationAnalysisService.weightUserMentions(this.aUser.userID, this.bUser.userID))
            + 0.5*(await UserRelationAnalysisService.weightUserMentions(this.bUser.userID, this.aUser.userID));
        return this.simMentions;
    }
    async getSimRetweets(){
        this.simRetweets = 0.5*(await UserRelationAnalysisService.weightUserRetweets(this.aUser.userID, this.bUser.userID))
            + 0.5*(await UserRelationAnalysisService.weightUserRetweets(this.bUser.userID, this.aUser.userID));
        return this.simRetweets;
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
        this.simProfile = ((sameLanguages ? 1 : 0) + (samePlaces ? 1 : 0) + dateWeight)/3;
        return this.simProfile;
    }
    getJSON(){
        return{
            aUser: this.aUser.userID, 
            bUser: this.bUser.userID, 
            simCommunity: this.simCommunity,
            simMentions: this.simMentions, 
            simRetweets: this.simRetweets,
            simLikes: this.simLikes,
            simHashtags: this.simHashtags,
            simTopics: this.simTopics,
            simProfile: this.simProfile
        }
    }
    async getAll(){
        await Promise.all([
            this.getSimCommunity(),
            this.getSimMentions(), 
            this.getSimRetweets(),
            this.getSimProfile()
        ])
    }

    /* async getResult({ weightSimCommunity, weightSimMentions, weightSimRetweets, weightSimHashtags, weightSimLikes, weightSimTopics, weightSimProfile }){
        return weightSimCommunity*(await this.getSimCommunity()) + 
            weightSimMentions*(await this.getSimMentions()) + 
            weightSimRetweets*(await this.getSimRetweets()) + 
            weightSimHashtags*(await this.weightSimHashtags()) + 
            weightSimProfile*(await this.getSimProfile());
    } */
    async uploadToDatabase(){

    }
    async verifyWithAPI(){

    }
}
Connection.Database.connect().then(async ()=>{
    Connection.connections['user-stats-read'].query(`
        SELECT userID FROM view_UserStatsLast
        WHERE view_UserStatsLast.followersCount >= 10000
    `).on('result', async significantUser => {
        Connection.connections['user-stats-write'].query(`
            SELECT userID FROM view_UserStatsLast
            WHERE view_UserStatsLast.followersCount > 10000
                AND view_UserStatsLast.followersCount >= 1000
        `).on('result', async otherUser => {
            Connection.connections['user-stats-write'].pause()
            console.log(significantUser.userID, otherUser.userID);
            let model = new UserRelationAnalysisModel(significantUser.userID, otherUser.userID);
            await model.getAll();
            console.log(model.getJSON())
            Connection.connections['user-stats-write'].resume()
        }).on('error', console.log)
    }).on('error', console.log)
    
    
    // await model.getAll();
    // console.log(model.getJSON());
    /* console.log("Sim community", await model.getSimCommunity());
    let model = new UserRelationAnalysisModel('1248695848298373120', '165832833');
    console.log("Sim mentions", await model.getSimMentions());
    console.log("Sim retweets", await model.getSimRetweets()); */
    // model.getSimCommunity();
})