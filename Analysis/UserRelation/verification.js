const Connection = require("../../Data");
const UserRelation = require("./model");

Connection.Database.addConnection('user-followers-read').then(async()=>{
    await Connection.Database.addConnection('user-followers-write')
    Connection.Database.connections['user-followers-read'].query(`
        SELECT * FROM UserRelationAnalysis WHERE verificationResult IS NULL
        ORDER BY executionDate DESC
    `).on('result', async row=>{
        Connection.Database.connections['user-followers-read'].pause();
        let model = new UserRelation(row.aUserID, row.bUserID);
        await model.verify();
        Connection.Database.connections['user-followers-read'].resume();
    }).on('end', ()=>{
        process.exit();
    })
})