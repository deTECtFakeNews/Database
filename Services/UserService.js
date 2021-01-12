const { DATE } = require("mysql/lib/protocol/constants/types");
const Data = require("../Data");

/**
 * UserServiceJSON Common structure for communication
 * @typedef {Object} UserServiceJSON
 * @property {String} userID 
 * @property {Number} followersCount 
 * @property {Number} followingsCount 
 * @property {Number} listedCount 
 * @property {Number} favoritesCount 
 * @property {Number} statusesCount 
 * @property {Date | String} creationDate 
 * @property {String} fullName 
 * @property {String} screenName 
 * @property {String} biography 
 * @property {Boolean} isProtected 
 * @property {Boolean} isVerified 
 * @property {String} language 
 * @property {String} placeDescription 
 */

 /**
  * UserService_StatsFreezeJSON Common structure for communication
  * @typedef {Object} UserService_StatsFreezeJSON
  */

const UserService = {
    UserStatsFreeze: {},
    UserAnalysis: {}, 

    /**
     * Normalize into UserService_JSON
     * @param {Object} data Data object received from Twitter API
     * @returns {UserServiceJSON}
     */
    normalize: data=>({
        userID: data.id_str, 
        followersCount: data.followers_count,
        followingsCount: data.friends_count,
        listedCount: data.listed_count, 
        favoritesCount: data.favourites_count, 
        statusesCount: data.statuses_count, 
        creationDate: data.created_at, 
        fullName: data.name, 
        screenName: data.screen_name, 
        biography: data.description,
        isProtected: data.protected,
        isVerified: data.verified, 
        language: data.lang || null, 
        placeDescription: data.location || null 
    }),
    /**
     * Database - Create new Table
     * @returns {Promise}
     */
    createTable: async ()=>{
        return new Promise((resolve, reject)=>{
            let query = 
                `CREATE TABLE IF NOT EXISTS \`User\` (
                    id int NOT NULL AUTO_INCREMENT, 
                    userID bigINT(8) NOT NULL UNIQUE,
                    creationDate timestamp NOT NULL,
                    fullName varchar(25) NOT NULL,
                    screenName varchar(25) NOT NULL,
                    biography text NULL default NULL,
                    isProtected bool NOT NULL,
                    isVerified bool NOT NULL,
                    language varchar(3) NULL default NULL,
                    placeDescription varchar(30) NULL default NULL,
                    PRIMARY KEY (\`id\`), KEY \`id\` (\`id\`)
                    -- KEY \`userID\` (\`userID\`)
                );`
            Data.Database.query(query, (error, results, fields)=>{
                if(error) reject(error);
                console.log(`[UserService] createTable successfully`);
                resolve(results);
            });
        })
    },
    /**
     * 
     * @param {UserServiceJSON} user User data (in normalized form) to be inserted
     */
    create: async (user)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query("INSERT INTO `User` SET ?", user, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject (error);
                console.log(`[UserService] insertToDatabase successful.`);
                resolve(results);
            })
        });
    },
    /**
     * Database - Read  
     * @param {Object} query_params 
     * @returns {Array<UserServiceJSON>}
     */
    read: async (query_params)=>{
        return new Promise((resolve, reject)=>{
            let query = `
                SELECT * FROM (( User
                    INNER JOIN UserStatsFreeze ON User.userID = UserStatsFreeze.userID)
                    -- INNER JOIN UserAnalysis ON User.userID = UserAnalysis.userID
                ) WHERE ${query_params != undefined && Object.keys(query_params).length!=0 ? '?' : '1=1'}`;
            Data.Database.query(query, query_params, (error, results, fields)=>{
                if(error) reject(error);
                if(results == undefined) reject();
                console.log(`[UserService] readFromDatabase successful. results`);
                resolve( results.map(r=>this.normalize(r)) )
            })
        })
    },
    /**
     * Database - Update
     * @param {Number | String} id user identifier
     * @param {UserServiceJSON} user user data
     * @returns {Promise}
     */
    update: async (id, user)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query(`UPDATE User SET ? WHERE User.userID=${id}`, user, (error, results, fields)=>{
                if(error) reject(error);
                console.log(`[UserService] updateToDatabase successful.`);
                resolve(results);
            })
        })
    }, 
    // Dataabase - Delete
    delete: async(id, user)=>{
        return new Promise((resolve, reject)=>{
            // TODO: implement
            resolve("To be implemented");
        })
    }, 
    /**
     * Twitter API - Fetch 
     * @param {Number || String} id 
     * @returns {UserServiceJSON}
     */
    fetchAPI: async(id)=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('users/show', {user_id: id}, (error, data, response)=>{
                if(error) reject(error);
                resolve(this.normalize(data))
            })
        })
    }
};

UserService.UserStatsFreeze = {
    /**
     * Database - Create table
     * @returns {Promise}
     */
    createTable: async ()=>{
        return new Promise((resolve, reject)=>{
            let query = 
                `CREATE TABLE IF NOT EXISTS \`UserStatsFreeze\` (
                    id int NOT NULL AUTO_INCREMENT, 
                    userID BIGINT(8) NOT NULL UNIQUE,
                    updateDate timestamp NOT NULL default CURRENT_TIMESTAMP,
                    followersCount BIGINT(8) NOT NULL default 0,
                    followingCount BIGINT(8) NOT NULL default 0,
                    listedCount BIGINT(8) NOT NULL default 0,
                    favoritesCount BIGINT(8) NOT NULL default 0,
                    statusesCount BIGINT(8) NOT NULL default 0,
                    PRIMARY KEY (\`id\`), KEY \`id\` (\`id\`),
                    -- KEY \`userID\` (\`userID\`),
                    CONSTRAINT \`userStatsFreeze_userID\` FOREIGN KEY (\`userID\`)
                        REFERENCES \`User\` (\`userID\`) ON DELETE CASCADE
                );`
            connection.query(query, (error, results, fields)=>{
                if(error) reject(error)
                console.log("[UserService.UserStatsFreeze] createTable successfully");
                resolve(results);
            })
        })
    },
    /**
     * Database - Insert into row
     * @param {UserService_StatsFreezeJSON} userStats data to be inserted
     * @returns {Promise}
     */
    create: async(userStats)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query("INSERT INTO `UserStatsFreeze` SET ?", userStats, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject(error);
                console.log(`[UserService.UserStatsFreeze] insertToDatabase successful. userID=${userStats.userID}`);
                resolve(results);
            })
        })
    },
    /**
     * Database - Read
     * @param {Object} query_params Parameters for querying in db
     * @returns {Promise}
     */
    read: async(query_params)=>{
        return await UserService.readFromDatabase(query_params);
    },
    /**
     * Database - Update
     * @param {Number | String} id User identifier
     * @param {UserService_StatsFreezeJSON} userStats data to be updated
     * @returns {Promise}
     */
    update: async(id, userStats)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query(`UPDATE UserStatsFreeze SET ? WHERE UserStatsFreeze.userID=${id}`, userStats, (error, results, fields)=>{
                if(error) reject(error);
                console.log(`[UserService.UserStatsFreeze] updateToDatabase successful.`);
                resolve(results);
            })
        })
    },
}

UserService.UserAnalysis = {
    // Database - Create Table
    createTable: async()=>{
        return new Promise((resolve, reject)=>{
            let query = 
                `CREATE TABLE IF NOT EXISTS \`UserAnalysis\` (
                    id int NOT NULL AUTO_INCREMENT, 
                    userID BIGINT(8) NOT NULL UNIQUE,
                    sentimentIndexAvg float NOT NULL default -1,
                    sentimentIndexStDev float NOT NULL default -1,
                    keywords text NOT NULL default '',
                    analysisIndexAvg float NOT NULL default -1,
                    analysisIndexStDev float NOT NULL default -1,
                    analysisIndex float NOT NULL default -1,
                    tweetFrequency float,
                    PRIMARY KEY (\`id\`), 
                    KEY \`id\` (\`id\`),
                    -- KEY \`userID\` (\`userID\`),
                    KEY \`analysisIndex\` (\`analysisIndex\`),
                    CONSTRAINT \`userAnalysis_userID\` FOREIGN KEY (\`userID\`)
                        REFERENCES \`User\` (\`userID\`) ON DELETE CASCADE
                );`
            connection.query(query, (error, results, fields)=>{
                if(error) reject(error);
                console.log("[UserService.UserAnalysis} createTable sucessful");
                resolve(results);
            })
        })
    }
} 


module.exports = UserService;