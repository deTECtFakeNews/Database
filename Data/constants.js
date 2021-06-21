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

const twitter = [
    {
        consumer_key: 'sHL0MJor5Avq0MEhI1F92k84R',
        consumer_secret: 'W5EQssAKUKwaDYHcWcJx3EhIweEezSLMNx3uFy9DAgZQnOzcDi',
        access_token_key: '780387937108299776-Ls0o5Nw468RrGTu5SjnJYT8NIdJ2bRM',
        access_token_secret: 'OSu5PSjMOGohifRhgSZizm9ZR3m2Wngd6coh6oyVGYF0U'
    }, 
    {
        consumer_key: 'yV0a5aPMXLcW3aKMSvxE9jjzu',
        consumer_secret: 'CH7t2e1hEX0WY48xVP9bKq5kvriwSf5lo9NEov6j50uJRB9wC2',
        access_token_key: '57733058-dMO5On1f6s1OfCPUSSSgSOScTlDmJbzGFaqgl6VbH',
        access_token_secret: '3PGA7ukcygjWy5s4aiilMVi0nhGuAJH1oQjgRTXIOeLXk'
    }, 
    {
        bearer_token: 'AAAAAAAAAAAAAAAAAAAAAKcVKwEAAAAA%2BmSfUUG%2BXU5EGBARSsFpv2V5ij0%3D8uu71THVjwvT8BLavr9AGKPRz8mQSAzfu7dej9vlD0yrzHMm7x',
    },
    {
        bearer_token: 'AAAAAAAAAAAAAAAAAAAAAG15NAEAAAAAFlZbssLOSRpbHQ4%2BwZfxYx73oUc%3DRYJXGLfaonLI5X1yH621w8cR8eGNIKuoVS6ytOzdYDoBaxshHd', 
        fullArchiveAccess: true
    }, 
    {
        // Edgar. Está pendiente acceso académico
        bearer_token: 'AAAAAAAAAAAAAAAAAAAAANOdQwEAAAAA2nCrK%2B8cGj%2BpEe1E9FooIvQZDig%3DGcz8lWvT0wSkCwCeVr90CScNgM5Hw2bkXacBTueT45ZZRG1Qsc'
    }
]
const seed = 0;
module.exports = {ssh, mysql, twitter, seed}