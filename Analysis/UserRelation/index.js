const Connection = require("../../Data");

const UserRelation = require('./model');


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


let bufferDB = [];

Connection.Database.connect().then(async () => {
    Connection.Database.connections['user-main-read'].query(`
        SELECT userID FROM view_UserStatsLast
        WHERE followersCount >= 10000
    `)
    .on('result', async a => {
        Connection.Database.connections['user-main-read'].pause();

        if(bufferDB.length >= 10){
                await Promise.all(bufferDB);
                bufferDB.length = 0;
            }
            bufferDB.push(new Promise(async (resolve, reject) => {
                let buffer = new UserRelationBuffer(20, {
                    weightCommunities: 0.4, 
                    weightMentions: 0.24, 
                    weightRetweets: 0.24,
                    weightHashtags: 0.08,
                    weightProfile: 0.04
                });
                Connection.Database.connections['user-main-write'].query(`
                    SELECT 
                    view_UserStatsLast.userID 
                    FROM view_UserStatsLast
                    WHERE followersCount < 10000 AND followersCount > 1000
                `)
                .on('result', async b => {
                    Connection.Database.connections['user-main-write'].pause();
                        let analysis = new UserRelation(a.userID, b.userID);
                        await buffer.push(analysis);
                    Connection.Database.connections['user-main-write'].resume();
                })
                .on('error', reject)
                .on('end', resolve)
            }))
        Connection.Database.connections['user-main-read'].resume();
    })
    .on('error', console.error)
})