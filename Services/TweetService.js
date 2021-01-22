const Data = require("../Data");

/**
 * TweetServiceJSON Common structure for communication
 * @typedef {Object} TweetService_data
 * @property {String | Number} tweetID
 * @property {String | Number} authorID (references userID)
 * @property {String | Number} inReplyToUserID (references userID)
 * @property {String | Number} inReplyToTweetID (references tweetID) 
 * @property {String | Number} quotesTweetID (references tweetID)
 * @property {Date | String} creationDate
 * @property {String} fullText
 * @property {String} language 3 letter code
 * @property {Float} placeLng longitude
 * @property {Float} placeLat latitude
 * @property {String} placeDescription
 * @property {Date | String} updateDate
 * @property {Date | String} updateDate
 * @property {Number} retweetCount
 * @property {Number} favoriteCount
 * @property {Number} replyCount
 */

 /**
  * TweetService_StatsFreeze_Data Common structure for communication
  * @typedef {Object} TweetService_StatsFreeze_Data 
  * @property {String | Number} tweetID
  * @property {Date | String} updateDate
  * @property {Number} retweetCount
  * @property {Number} favoriteCount
  * @property {Number} replyCount
  */

/**
 * TweetService_TweetAnalysis Common structure for communication
 * @typedef {Object} TweetService_TweetAnalysis
 */


const TweetService = {
    TweetStatsFreeze: {},
    TweetAnalysis: {},
    /**
     * Internal - Receives data from Twitter object and returns in normalized form with the same nomenclature as database.
     * @param {Object} data Data object as receoved from Twitter API
     * @returns {TweetService_data}
     */
    normalize: (data)=>({
        tweetID: data.id_str, 
        authorID: data.user.id_str, 
        inReplyToUserID: data.in_reply_to_user_id_str || null,
        inReplyToTweetID: data.in_reply_to_status_id_str || null, 
        quotesTweetID: data.quoted_status_id_srt || null, 
        creationDate: data.created_at,
        fullText: data.full_text || data.text, 
        language: data.lang || null, 
        // placeLng = data.coordinates && data.coordinates.coordinates ? data.coordinates.coordinates[0] : null,
        // placeLat = data.coordinates && data.coordinates.coordinates ? data.coordinates.coordinates[0] : null,
        // placeDescription = data.place.full_name || null
        updateDate: new Date().toISOString(),
        retweetCount: data.retweet_count, 
        favoriteCount: data.favorite_count, 
        replyCount: data.reply_count || 0
    }),
    /**
     * Database - Creates Table Tweet in Database. (For backup and maintenance)
     * @returns {Promise}
     */
    createTable: async ()=>{
        return new Promise((resolve, reject)=>{
            let query =
                `CREATE TABLE IF NOT EXISTS \`Tweet\` (
                    id int NOT NULL AUTO_INCREMENT,
                    tweetID BIGINT(8) NOT NULL UNIQUE,
                    authorID BIGINT(8) NOT NULL,
                    inReplyToUserID BIGINT(8) NOT NULL default -1,
                    inReplyToTweetID BIGINT(8) NOT NULL default -1,
                    quotesTweetID BIGINT(8) NOT NULL default -1,
                    creationDate timestamp,
                    \`fullText\` text NOT NULL,
                    placeLng float(10, 6) NULL,
                    placeLat float(10, 6) NULL,
                    placeDescription varchar(30) NULL,
                    isPossiblySensitive boolean NULL,
                    PRIMARY KEY (\`id\`),
                    KEY \`id\` (\`id\`),
                    -- KEY \`tweetID\` (\`tweetID\`),
                    KEY \`authorID\` (\`authorID\`),
                    KEY \`inReplyToUserID\` (\`inReplyToUserID\`),
                    KEY \`inReplyToTweetID\` (\`inReplyToTweetID\`),
                    KEY \`quotesTweetID\` (\`quotesTweetID\`),
                    CONSTRAINT \`Tweet_authorID_User\` FOREIGN KEY (\`authorID\`)
                        REFERENCES \`User\` (\`userID\`) ON DELETE CASCADE,
                    CONSTRAINT \`Tweet_inReplyToUserID_User\` FOREIGN KEY (\`inReplyToUserID\`)
                        REFERENCES \`User\` (\`userID\`) ON DELETE CASCADE,
                    CONSTRAINT \`Tweet_inReplyToTweetID_Tweet\` FOREIGN KEY (\`inReplyToTweetID\`)
                        REFERENCES \`Tweet\` (\`tweetID\`) ON DELETE CASCADE
                );`
            Data.Database.query(query, (error, results, fields)=>{
                if(error) reject(error);
                console.log("[TweetService} createTable successful");
                resolve(results);
            })
        })
    }, 
    /**
     * Database - Creates (inserts into new row) new Tweet in table
     * @param {TweetService_data} tweet Tweet data in normalized form to be added into new row
     * @returns {Promise<JSON>}
     */
    create: async (tweet)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query("INSERT INTO `Tweet` SET ?", tweet, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject (error);
                console.log(`[TweetService] insertToDatabase successful.`);
                resolve(results);
            })
        });
    },
    /**
     * Database - Read Tweet row(s) from table
     * @param {Object | Number | String} query_params Parameters to execute query | Id of row to read
     * @returns {Promise<Array<TweetService_data>>}
     */
    read: async (query_params)=>{
        return new Promise((resolve, reject)=>{
            if(typeof query_params == 'string' || typeof query_params == 'number'){
                query_params = {tweetID: query_params};
            }
            let query = `
                SELECT * FROM Tweet WHERE ${query_params != undefined && Object.keys(query_params).length!=0 ? '?' : '1=1'}`;
            let q = Data.Database.query(query, query_params, (error, results, fields)=>{
                if(error) reject(error);
                if(results.length<1) reject();
                console.log(`[TweetService] readFromDatabase successful. results`);
                resolve(results.map(r=>({...r}) ));
            })
        })
    },
    /**
     * 
     * @param {Number | String} id Id of row to be updated with data 
     * @param {TweetService_data} tweet Data of tweet to be updated 
     * @returns {Promise}
     */
    update: async (id, tweet)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query(`UPDATE Tweet SET ? WHERE Tweet.tweetID=${id}`, tweet, (error, results, fields)=>{
                if(error) reject(error);
                console.log(`[TweetService] updateToDatabase successful.`);
                resolve(results);
            })
        })
    }, 
    /**
     * Database - Delete Tweet row
     * @param {Number | String} id Id of the tweet to be deleted
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
     * @returns {Promise<TweetService_data>}
     */
    fetchAPI: async (id)=>{
        return new Promise((resolve, reject)=>{ 
            Data.Twitter.get(`statuses/show/${id}`, {tweet_mode: 'extended'}, (error, data, response)=>{
                if(error != undefined && error != null) reject (error);
                else resolve(TweetService.normalize(data));
            })
        });
    },
    /**
     * Twitter API - Get HTML of embeddable tweet
     * @param {Number | String} id 
     * @returns {Promise<Text>}
     */
    getCardAPI: async (id)=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('/statuses/oembed.json', {id: id, align: 'center', dnt: true}, (error, data, response)=>{
                if(error) reject(error);
                else resolve(data['html'])
            })
        })
    }
}

TweetService.TweetStatsFreeze = {
   /**
    * Database - Create table
    * @returns {Promise}
    */
    createTable: async()=>{
        let query = 
            `CREATE TABLE IF NOT EXISTS \`TweetStatsFreeze\` (
                id int NOT NULL AUTO_INCREMENT, 
                tweetID BIGINT(8) NOT NULL UNIQUE, 
                updateDate timestamp NOT NULL default CURRENT_TIMESTAMP,
                retweetCount BIGINT(8) NOT NULL default 0,
                favoriteCount BIGINT(8) NOT NULL default 0,
                replyCount BIGINT(8) NOT NULL default 0,
                PRIMARY KEY (\`id\`), KEY \`id\` (\`id\`),
                -- KEY \`tweetID\` (\`tweetID\`),
                CONSTRAINT \`tweetStatsFreeze_tweetID\` FOREIGN KEY (\`tweetID\`)
                    REFERENCES \`Tweet\` (\`tweetID\`) ON DELETE CASCADE
            );`
            Data.Database.query(query, (error, results, fields)=>{
            if(error) reject(error);
            console.log("[TweetService.TweetStatsFreeze} createTable successful");
            resolve(results);
        })
    },
    /**
     * Database - Creates (inserts into new row) new TweetStatsFreeze to table
     * @param {TweetService_StatsFreeze_Data} tweetStats Tweet statistics to be inserted
     * @returns {Promise}
     */
    create: (tweetStats)=>{
        return new Promise((resolve, reject)=>{
            let {tweetID, updateDate, retweetCount, favoriteCount, replyCount} = tweetStats;
            Data.Database.query('INSERT INTO TweetStatsFreeze SET ?', tweetStats, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject(error);
                console.log(`[TweetService.TweetStatsFreeze] (${tweetStats.tweetID}) was uploaded`)
                resolve(results)
            })
        })
    },
    /**
     * Database - Read TweetStatsFreeze row(s) from table
     * @param {Map | Number | String} query_params Parameters to execute query | Id of Tweet
     * @returns {Promise<Array<TweetService_StatsFreeze_Data>>}
     */
    read: async(query_params)=>{
        return new Promise((resolve, reject)=>{
            if(typeof query_params == 'string' || typeof query_params == 'number'){
                query_params = {tweetID: query_params};
            }
            let query = `SELECT * FROM TweetStatsFreeze WHERE ${query_params != undefined && Object.keys(query_params).length!=0 ? '?' : '1=1'}`
            Data.Database.query(query, query_params, (error, results, fields)=>{
                if(results.length < 0) resolve(undefined)

                if(error) reject(error);
                resolve({...results});
            })
        })
    },
    /**
     * Database - Update TweetStatsFreeze with new data
     * @param {Number | String} id Id of row to be updated with data
     * @param {TweetService_StatsFreeze_Data} tweet Data to be updated
     * @returns {Promise}
     */
    update: async (id, tweet)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query(`UPDATE TweetStatsFreeze SET ? WHERE TweetStatsFreeze.tweetID=${id}`, tweet, (error, results, fields)=>{
                if(error) reject(error);
                console.log(`[TweetService.TweetStatsFreeze] updateToDatabase successful.`);
                resolve(results);
            })
        })
    }, 
}

TweetService.TweetAnalysis = {
    /**
     * Database - Create table
     * @returns {Promise}
     */
    createTable: async()=>{
        let query = 
            `CREATE TABLE IF NOT EXISTS \`TweetAnalysis\` (
                id int NOT NULL AUTO_INCREMENT, 
                tweetID BIGINT(8) NOT NULL UNIQUE,
                sentimentIndex float NOT NULL default -1,
                keywords text NOT NULL default '',
                analysisIndex float NOT NULL default -1,
                sentiment_negativity float,
                sentiment_neutrality float, 
                sentiment_positivity float,
                sentiment_compund float, 
                sentiment_polarity float, 
                sentiment_subjectivity float, 
                sentiment_anger float, 
                sentiment_anticipation float, 
                sentiment_disgust float, 
                sentiment_fear float, 
                sentiment_joy float, 
                sentiment_negative float,
                sentiment_postivie float, 
                sentiment_sadness float, 
                sentiment_surprise float, 
                sentiment_trust float,
                PRIMARY KEY (\`id\`), 
                -- KEY \`tweetID\` (\`tweetID\`),
                KEY \`id\` (\`id\`),
                KEY \`analysisIndex\` (\`analysisIndex\`),
                CONSTRAINT \`tweetAnalysis_tweetID\` FOREIGN KEY (\`tweetID\`)
                    REFERENCES \`Tweet\` (\`TweetID\`) ON DELETE CASCADE
            );`
            Data.Database.query(query, (error, results, fields)=>{
            if(error) reject(error);
            console.log("[TweetService.TweetAnalysis} createTable successful");
            resolve(results);
        })
    },
    /**
     * Database - Creates (inserts into new row) new TweetAnalysis in table
     * @param {Number | String} tweet Tweet id
     * @param {*} analysis TweetAnalysis data in normalized form to be added into a new row
     * @returns {Promise}
     */
    create: async (tweet, analysis)=>{
        return new Promise((resolve, reject)=>{
            let data = {
                tweetID: tweet.tweetID,
                ...analysis
            }
            delete data['sentiment_fullText']

            let q = Data.Database.query("INSERT INTO `TweetAnalysis` SET ?", data, (error, results, fields)=>{
                console.log(q.sql)
                if(error && error.code != 'ER_DUP_ENTRY') reject(error);
                console.log(`[TweetService.TweetAnalysis] (${tweet.tweetID}) was uploaded`)
                resolve(results)
            })
        })
    },
    /**
     * Database - Read TweetAnalysis row(s) from table
     * @param {Object | Number | String} query_params Parameters to execute query | Id of row to read
     * @returns {void}
     */
    read: async (query_params)=>{

    },
    /**
     * Database - Update TweetAnalysis row with new data
     * @param {Number | String} id Id of row to be updated with data
     * @param {TweetService_TweetAnalysis} analysis Data to be updated
     * @returns {Promise}
     */
    update: async (id, analysis)=>{
        return new Promise((resolve, reject)=>{
            delete data['sentiment_fullText']
            let q = Data.Database.query(`UPDATE TweetAnalysis SET ? WHERE TweetAnalysis.tweetID=${id}`, analysis, (error, results, fields)=>{
                console.log(q.sql, data)
                if(error && error.code != 'ER_DUP_ENTRY') reject(error);
                console.log(`[TweetService.TweetAnalysis] (${tweet.tweetID}) was updated`)
                resolve(results)
            })
        })
    }
}


module.exports = TweetService;