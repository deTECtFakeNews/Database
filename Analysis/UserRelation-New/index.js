const Connection = require("../../Data");

const mentions = require("./mentions");
const hashtags = require("./hashtags");
const retweets = require("./retweets");
const communities = require("./communities");

class UserRelation {
    aUserID;
    bUserID;
    simMentions;
    simHashtags;
    simRetweets;
    simCommunities;
    constructor(aUserID, bUserID){
        this.aUserID = aUserID;
        this.bUserID = bUserID;
    }
    get isEmpty(){
        this.simMentions + this.simHashtags + this.simRetweets + this.simCommunities == 0;
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
    async calculateCommunities(){
        this.simCommunities = await communities(this.aUserID, this.bUserID);
    }
    async calculate(){
        await Promise.all([
            this.calculateMentions(),
            this.calculateHashtags(),
            this.calculateCommunities(),
            this.calculateRetweets(), 
        ])
        if(!this.isEmpty){
            console.log(this);
        }
    }
}

let buffer = [];


Connection.Database.connect().then(async () => {
    Connection.Database.connections['user-main-read'].query(`
        SELECT * FROM 
        (
            SELECT
                userID AS 'aUserID'
            FROM
                \`User\`
                JOIN
                view_UserStatsLast USING (userID)
            WHERE
                view_UserStatsLast.followersCount >= 10000
        ) influential_users
        CROSS JOIN
        (
            SELECT
                userID AS 'bUserID'
            FROM
                \`User\`
                JOIN
                view_UserStatsLast USING (userID)
            WHERE
                view_UserStatsLast.followersCount < 10000
        ) regular_users
    `).on('result', async ({aUserID, bUserID}) => {
        Connection.Database.connections['user-main-read'].pause();
        const analysis = new UserRelation(aUserID, bUserID);
        if(buffer.length > 10){
            await Promise.all(buffer.map(ur => ur.calculate()));
        } else {
            buffer.push(analysis);
        }
        // await analysis.calculate();
        // console.log(aUserID, bUserID)
        Connection.Database.connections['user-main-read'].resume();
    })
})