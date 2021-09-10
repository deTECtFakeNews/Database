const Connection = require("../Data");
const QueryModel = require("../Models/Query/QueryModel");
const QueryService = require("../Services/Query/QueryService");

Connection.Database.connect().then(async ()=>{
    const [q] = await QueryService.read(process.argv[2])
    const query = new QueryModel(q);
    await query.executeHistoric();
})