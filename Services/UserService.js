const { response } = require("express");
const { DATE } = require("mysql/lib/protocol/constants/types");
const Data = require("../Data");

/**
 * UserServiceJSON Common structure for communication
 * @typedef {Object} UserService_Data
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
  * @typedef {Object} UserService_StatsFreeze_Data
  */

  /**
   * @namespace UserService
   */
const UserService = {
    UserStatsFreeze: {},
    UserAnalysis: {}, 
    UserFollower: {},
    /**
     * Internal - Receives data from  Twitter object and returns in normalized form with the same nomenclature as database.
     * @param {Object} data Data object as received by Twitter API
     * @returns {UserService_Data}
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
     * Database - Creates Table User in Database. (For backup and maintenance)
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
     * Database - Creates (inserts into new row) new User in table
     * @param {UserService_Data} user User data in normalized form to be added into new row
     * @returns {Promise<JSON>}
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
     * Database - Read User row(s) from table
     * @param {Object | Number | String} query_params Parameters to execute query | Id of row to read
     * @returns {Promise<Array<UserService_Data>>}
     */
    read: async (query_params)=>{
        return new Promise((resolve, reject)=>{
            if(typeof query_params == 'string' || typeof query_params == 'number') {
                query_params = {userID: query_params};
            }
            let query = '';
            if(Object.keys(query_params).length>0){
                query = 'SELECT * FROM User WHERE ?';
            } else {
                query = 'SELECT * FROM User';
            }
            Data.Database.query(query, query_params, (error, results, fields)=>{
                if(results.length == 0) resolve([undefined])
                if(error) reject(error);
                if(results == undefined) reject();
                // console.log(`[UserService] readFromDatabase successful. results`);
                resolve( results.map(r=>({...r}) ))
            })
        })
    },
    /**
     * 
     * @param {Object | Number | String} query_params Parameters to execute query | Id of row to read
     * @param {{onError: Function, onFields: Function, onResult: Function, onEnd: Function}} events
     */
    readStream: (query_params = {}, events)=>{
        if(typeof query_params == 'string' || typeof query_params == 'number') {
            query_params = {userID: query_params};
        }
        let query = '';
        if(Object.keys(query_params).length>0){
            query = 'SELECT * FROM User WHERE ?';
        } else {
            query = 'SELECT * FROM User';
        }
        Data.Database.query(query, query_params)
            .on('error', events.onError || (()=>{}))
            .on('fields', events.onFields || (()=>{}))
            .on('result', events.onResult || (()=>{}))
            .on('end', events.onEnd || (()=>{}))
    },
    /**
     * Database - Update User row with new data 
     * @param {Number | String} id Id of row to be updated with data
     * @param {UserService_Data} user Data of the user to be updated
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
    /**
     * Database - Delete User row
     * @param {Number | String} id Id of the user to be deleted
     * @returns {Promise}
     */
    delete: async(id, user)=>{
        return new Promise((resolve, reject)=>{
            // TODO: implement
            resolve("To be implemented");
        })
    }, 
    /**
     * Twitter API - Fetch 
     * @param {Number | String} id 
     * @returns {Promise<UserService_Data>}
     */
    fetchAPI: async(id)=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('users/show', {user_id: id}, (error, data, response)=>{
                if(error) reject(error);
                resolve(UserService.normalize(data))
            })
        })
    },
    /**
     * Twitter API - See if `source_id` follows `target_id`
     * @param {Number|String} source_id Id of test user
     * @param {Number|String} target_id Id of base user
     * @returns {Promise<Boolean>}
     */
    doesAFollowB: (source_id, target_id)=>{
        return new Promise((resolve, reject)=>{
            if(source_id==-1 || target_id ==-1) reject();
            Data.Twitter.get('friendships/show', {source_id, target_id}, (error, data, response)=>{
                if(error) reject(error);
                if(data.relationship.source.following) resolve(true);
                else {resolve(false)}
            })
        })
    },

    readStreamAndFetchFollowers: (id)=>{
        return new Promise(async (resolve, reject)=>{
            let followers = [];
            if(id==-1){
                resolve(followers)
                return;
            }
            /**@type {import("mysql").PoolConnection} */
            Data.Database_Slave.query(`
            SELECT * FROM User as a WHERE a.userID NOT IN (
                SELECT UserFollower.followerID FROM UserFollower WHERE a.userID = UserFollower.userID
            );
            `)
                .on('error', reject)
                .on('result', async row => {
                    Data.Database_Slave.pause();
                    try{
                        let isFollowing = await UserService.doesAFollowB(row.userID, id)
                        console.log(id, '-->', row.userID, isFollowing);
                        if(isFollowing){
                            followers.push(row.userID);
                            await UserService.UserFollower.create({userID: id, followerID: row.userID});
                        }
                    }catch(e){
                        reject(e)
                    }
                    Data.Database_Slave.resume();
                })
                .on('end', ()=>{
                    resolve(true);
                })
        })
    },

    getID: (screen_name)=>{
        return new Promise(async (resolve, reject)=>{
            try{
                let user = (await UserService.read({screenName: screen_name}))[0].userID || await UserService.fetchIdAPI(screen_name);
                return user;
            } catch (e){
                return -1;
            }
        })
    },

    fetchIdAPI: async(screen_name)=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('users/show', {screen_name}, (error, data, response)=>{
                if(error) reject(error);
                resolve(data.id)
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
     * Database - Creates (inserts into new row) new UserStatsFreeze to table
     * @param {UserService_StatsFreeze_Data} userStats User statistics to be inserted
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
     * Database - Read UserStatsFreeze row(s) from table
     * @name read_userstats
     * @param {Object | Number | String} query_params Parameters to execute query | Id of User
     * @returns {Promise}
     */
    read: async(query_params)=>{
        return await UserService.readFromDatabase(query_params);
    },
    /**
     * Database - Update UserStatsFreeze row with new data 
     * @param {Number | String} id Id of row to be updated with data
     * @param {UserService_StatsFreeze_Data} user Data to be updated
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

UserService.UserFollower = {
    /**
     * Database - Creates (inserts into new row) new UserFollower in table
     * @param {{userID: Number|String, followerID: Number|String}} param0 Id of user and follower
     */
    create: ({userID, followerID})=>{
        return new Promise((resolve, reject)=>{
            let query = `
            INSERT INTO UserFollower (userID, followerID)
            SELECT ${userID}, ${followerID} FROM DUAL
            WHERE NOT EXISTS 
            ( SELECT * FROM UserFollower WHERE userID=${userID} AND followerID=${followerID} );`;
            Data.Database_Slave2.query(query, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject(error);
                console.log(`[UserService.UserFollower] insertToDatabase successful. ${userID}-->${followerID}`);
                resolve(results)
            })
        })
    },
    /**
     * Database - Read UserFollower rows from table
     * @param {Object|Number|String} query_params Parameters to execute query | Id of user
     * @returns {Promise<Array<Object>>}
     */
    read: (query_params)=>{
        return new Promise((resolve, reject)=>{
            if(typeof query_params == 'string' || typeof query_params == 'number'){
                query_params = {userID: query_params}
            }
            let query = Object.keys(query_params).length>0 ? 'SELECT * FROM UserFollower WHERE' : 'SELECT * FROM User';
            Data.Database_Slave2.query(query, query_params, (error, results, fields)=>{
                if(results == undefined) reject();
                if(results.length == 0) resolve([]);
                if(error) reject(error);
                resolve( results.map(r=>({...r})) );
            })
        })
    },

}

module.exports = UserService;