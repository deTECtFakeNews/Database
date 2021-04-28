/** Options to connect to SSH server */
const ssh = {
    host: '10.4.27.75',
    port: 22, 
    username: 'A01023646',
    password: 'TEC.Lalongo1606', 
    tryKeyboard: true
}

const mysql = {
    host: '10.4.27.75', 
    user: 'DataUser', 
    password: 'TEC.F4keNews', 
    port: 3306, 
    supportBigNumbers: true, 
    bigNumberStrings: true, 
    multipleStatements: true, 
    connectionLimit: 100,
    database: 'FakeNews'
}

const twitter = {
    consumer_key: 'sHL0MJor5Avq0MEhI1F92k84R',
    consumer_secret: 'W5EQssAKUKwaDYHcWcJx3EhIweEezSLMNx3uFy9DAgZQnOzcDi',
    access_token_key: '780387937108299776-Ls0o5Nw468RrGTu5SjnJYT8NIdJ2bRM',
    access_token_secret: 'OSu5PSjMOGohifRhgSZizm9ZR3m2Wngd6coh6oyVGYF0U'
}


module.exports = {ssh, mysql, twitter}