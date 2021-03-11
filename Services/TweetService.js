const Data = require("../Data");
const UserService = require('./UserService');

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
 * 
 * @property {Array<TweetService_TweetEntity>} entities Array with entities
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
  * @property {String|Number} tweetID
  * @property {String} translation
  * @property {Number} sentiment_negativity
  * @property {Number} sentiment_neutrality
  * @property {Number} sentiment_positivity
  * @property {Number} sentiment_compound
  * @property {Number} sentiment_polarity
  * @property {Number} sentiment_subjectivity
  * @property {Number} sentiment_anger
  * @property {Number} sentiment_anticipation
  * @property {Number} sentiment_disgust
  * @property {Number} sentiment_fear
  * @property {Number} sentiment_joy
  * @property {Number} sentiment_negative
  * @property {Number} sentiment_positive
  * @property {Number} sentiment_sadness
  * @property {Number} sentiment_surprise
  * @property {Number} sentiment_trust
  * @property {Number} bert_toxicity
  * @property {Number} bert_irony
  * @property {Number} bert_stance
  * @property {Number} bert_hateSpeech
  * @property {String} processedTweet
  * @property {String} bert_generalClassification

 */

/**
  * TweetService_TweetEntity Common structure for communication
  * @typedef {Object} TweetService_TweetEntity
  * @property {hashtag|url|symbol|userMention} type Type of entity
  * @property {Number|String} value Value of entity
 */


const TweetService = {
    TweetStatsFreeze: {},
    TweetAnalysis: {},
    TweetEntities: {},
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
        placeLng: data.coordinates && data.coordinates.coordinates ? data.coordinates.coordinates[0] : null,
        placeLat: data.coordinates && data.coordinates.coordinates ? data.coordinates.coordinates[1] : null,
        placeDescription: data.place && data.place.full_name ? data.place.full_name : null,
        updateDate: new Date().toISOString(),
        retweetCount: data.retweet_count, 
        favoriteCount: data.favorite_count, 
        replyCount: data.reply_count || 0,

        entities: TweetService.TweetEntities.normalize(data.entities)
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
                // console.log(`[TweetService] readFromDatabase successful. results`);
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
    },
    /**
     * Twitter API - Get Retweets
     * @param {Number|String} id 
     * @returns {Promise<Map<String, Object>>}
     */
    fetchRetweetAPI: async (id)=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('/statuses/retweets', {id, count: 100}, (error, data, response)=>{
                if(error) reject(error);
                if(data==undefined) return []
                let parsedData = data.map(d=>TweetService.normalize(d)) || [];
                resolve( parsedData.map(d=>({
                    creationDate: d.creationDate,
                    authorID: d.authorID
                })) )
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
                if(results.length < 0) resolve([undefined])

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
            `CREATE TABLE \`TweetAnalysis\` (
                \`id\` int(11) NOT NULL AUTO_INCREMENT,
                \`tweetID\` bigint(8) NOT NULL,
                \`translation\` text DEFAULT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`tweetID\` (\`tweetID\`),
                KEY \`id\` (\`id\`),
                CONSTRAINT \`tweetAnalysis_tweetID\` FOREIGN KEY (\`tweetID\`) REFERENCES \`Tweet\` (\`tweetID\`) ON DELETE CASCADE
            )`
            Data.Database.query(query, (error, results, fields)=>{
            if(error) reject(error);
            console.log("[TweetService.TweetAnalysis} createTable successful");
            resolve(results);
        })
    },
    /**
     * Database - Read TweetAnalysis row(s) from table
     * @param {Object | Number | String} query_params Parameters to execute query | Id of row to read
     * @returns {Promise<Array<TweetService_TweetAnalysis>>}
     */
    read: async (query_params)=>{
        return new Promise((resolve, reject)=>{
            if(typeof query_params == 'string' || typeof query_params == 'number'){
                query_params = {tweetID: query_params};
            }
            let query = `
                SELECT * FROM TweetAnalysis WHERE ${query_params != undefined && Object.keys(query_params).length!=0 ? '?' : '1=1'}`;
            let q = Data.Database.query(query, query_params, (error, results, fields)=>{
                if(error) reject(error);
                if(results.length<1) reject();
                console.log(`[TweetService] readFromDatabase successful. results`);
                resolve(results.map(r=>({...r}) ));
            })
        })
    },
    /**
     * Database - Update TweetAnalysis row with new data
     * @param {TweetService_TweetAnalysis} data Data to be updated
     * @returns {Promise}
     */
    update: async (data)=>{
        return new Promise((resolve, reject)=>{
            let q = Data.Database.query(`REPLACE INTO TweetAnalysis SET ?`, data, (error, results, fields)=>{
                // console.log(q.sql, data)
                if(error && error.code != 'ER_DUP_ENTRY') reject(error);
                console.log(`[TweetService.TweetAnalysis] (${data.tweetID}) was updated`)
                resolve(results)
            })
        })
    }
}

TweetService.TweetEntities = {
    /**
     * Database - Create table
     */
    createTable: ()=>{
        return new Promise((resolve, reject)=>{
            let query = `CREATE TABLE \`TweetEntities\` (
                \`tweetID\` bigint(8) NOT NULL,
                \`type\` enum('hashtag','media','userMention','url','symbol','poll') COLLATE utf8_unicode_ci DEFAULT NULL,
                \`value\` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
                KEY \`fk_TweetEntities_Tweet\` (\`tweetID\`),
                CONSTRAINT \`fk_TweetEntities_Tweet\` FOREIGN KEY (\`tweetID\`) REFERENCES \`Tweet\` (\`tweetID\`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;`
            Data.Database.query(query, (error, results, fields)=>{
                if(error) reject(error);
                console.log("[TweetService.TweetEntities] createTable successful");
                resolve(results);
            })

        })
    },
    /**
     * Normalize into array of entities
     * @param {Object} entities Entities object received from API
     * @returns {Array<TweetService_TweetEntity>}
     */
    normalize: (entities)=>{
        let hashtags = entities.hashtags.map(h=>({type: 'hashtag', value: h.text}));
        let userMentions = entities.user_mentions.map(u=>({type: 'userMention', value: u.id}));
        let urls = entities.urls.map(u=>({type: 'url', value: u.expanded_url}));
        let symbols = entities.symbols.map(s=>({type: 'symbol', value: s.text}));
        return [...hashtags, ...userMentions, ...urls, ...symbols]
    },
    /**
     * Get entities from string of text
     * @param {String} text Text to analyze
     * @returns {Array<TweetService_TweetEntity>}
     */
    getFromText: async (text)=>{
        let mentions = text.match(/\B@\w+/g) || [];
        let hashtags = text.match(/\B\#\w+/g) || [];
        let symbols = text.match(/\B\$\w+/g) || [];
        let urls = text.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig)|| [];
        urls.pop()
        let mentions_ids = await Promise.all(mentions.map(async m=> await UserService.getID(m) ));
        return [
            ...hashtags.map(h=>({type: 'hashtag', value: h.substr(1)})),
            ...mentions_ids.map(m=>({type: 'userMention', value: m})),
            ...symbols.map(s=>({type: 'symbol', value: s.substr(1)})),
            ...urls.map(u=>({type: 'url', value: u}))
        ];
    },
    /**
     * Database - Creates (inserts into new row) new TweetEntity in table
     * @param {TweetService_TweetEntity} entity
     */
    create: async (entity)=>{
        return new Promise((resolve, reject)=>{
            let query = `
            INSERT INTO TweetEntities (tweetID, type, value)
            SELECT ${entity.tweetID}, '${entity.type}', '${entity.value}' FROM DUAL
            WHERE NOT EXISTS (SELECT * FROM TweetEntities 
                WHERE tweetID=${entity.tweetID} AND
                type='${entity.type}' AND 
                value='${entity.value}');`;
            // console.log(query)            
            Data.Database.query(query, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject (error);
                console.log(`[TweetService.TweetEntity] insertToDatabase successful.`);
                resolve(results);
            })
        })
    },
    /**
     * Database - Read TweetEntities rows from Table
     * @param {Object | Number | String} query_params Parameters to execute query | Id of tweet
     * @returns {Promise<Array<TweetService_TweetEntity>>}
     */
    read: async (query_params)=>{
        return new Promise((resolve, reject)=>{
            if(typeof query_params == 'string' || typeof query_params == 'number') query_params = {tweetID: query_params};
            let query = `
                SELECT * FROM TweetEntities WHERE ${query_params != undefined && Object.keys(query_params).length!=0 ? '?' : '1=1'}`;
                Data.Database.query(query, query_params, (error, results, fields)=>{
                    if(error) reject(error);
                    // if(results.length<1) reject();
                    console.log(`[TweetService] readFromDatabase successful. results`);
                    resolve(results.map(r=>({...r}) ));
                })
        })
    }
}

module.exports = TweetService;