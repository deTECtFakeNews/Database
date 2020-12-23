const QueryModel = require("./Models/QueryModel");

/* QueryModel.getFromAPI({q: 'coronavirus'}).then(data=>{
    let model = data;
    model.printResults()
}) */

QueryModel.getFromAPI({q: 'coronavirus'}, {
    lang: 'es'
}).then(data=>{
    data.printResults()
})