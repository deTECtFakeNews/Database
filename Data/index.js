const Twitter = require("./twitter");
const Database = require("./database");

const connections = Database.connections;
const connect = Database.connect;

const Connection = {Twitter, Database, connections, connect};
module.exports = Connection