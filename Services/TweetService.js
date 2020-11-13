const Data = require("../Data");

const TweetService = {
    TweetStatsFreeze: {},
    TweetAnalysis: {},
    // Database - Create table
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
    // Database - Insert into row
    insertToDatabase: async (tweet)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query("INSERT INTO `Tweet` SET ?", tweet, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject (error);
                console.log(`[TweetService] insertToDatabase successful.`);
                resolve(results);
            })
        });
    },
    // Database - Read from
    readFromDatabase: async (query_params)=>{
        return new Promise((resolve, reject)=>{
            let query = `
                SELECT * FROM (( Tweet
                    INNER JOIN TweetStatsFreeze ON Tweet.tweetID = TweetStatsFreeze.tweetID)
                    -- INNER JOIN Tweet Analysis ON Tweet.tweetID = TweetAnalysis.tweetID
                ) WHERE ${query_params != undefined && Object.keys(query_params).length!=0 ? '?' : '1=1'}`;
            let q = Data.Database.query(query, query_params, (error, results, fields)=>{
                console.log(q.sql, query_params)
                if(error) reject(error);
                console.log(`[TweetService] readFromDatabase successful. results`);
                resolve(results.map(r=>({...r})));
            })
        })
    },
    // Database - Update
    updateToDatabase: async (id, tweet)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query(`UPDATE Tweet SET ? WHERE Tweet.tweetID=${id}`, tweet, (error, results, fields)=>{
                if(error) reject(error);
                console.log(`[TweetService] updateToDatabase successful.`);
                resolve(results);
            })
        })
    }, 
    // Dataabase - Delete
    deleteFromDatabase: async(id, user)=>{
        return new Promise((resolve, reject)=>{
            // TODO: implement
            resolve("To be implemented");
        })
    }, 
    getFromAPI: async (id)=>{
        return new Promise((resolve, reject)=>{ 
            Data.Twitter.get(`statuses/show/${id}`, (error, data, response)=>{
                console.log("erororororor", error)
                if(error != undefined && error != null) reject (error);
                else resolve({
                    tweetID: data.id_str, 
                    authorID: data.user.id_str, 
                    inReplyToUserID: data.in_reply_to_user_id_str || null,
                    inReplyToTweetID: data.in_reply_to_status_id_str || null, 
                    quotesTweetID: data.quoted_status_id_srt || null, 
                    creationDate: data.created_at,
                    fullText: data.text, 
                    language: data.lang || null, 
                    // placeLng = data.coordinates && data.coordinates.coordinates ? data.coordinates.coordinates[0] : null,
                    // placeLat = data.coordinates && data.coordinates.coordinates ? data.coordinates.coordinates[0] : null,
                    // placeDescription = data.place.full_name || null
                    updateDate: new Date().toISOString(),
                    retweetCount: data.retweet_count, 
                    favoriteCount: data.favorite_count, 
                    replyCount: data.reply_count || 0
                });
            })
        });
    },
    getCard: async (id)=>{
        return new Promise((resolve, reject)=>{
            Data.Twitter.get('/statuses/oembed.json', {id: id, align: 'center', dnt: true}, (error, data, response)=>{
                if(error) reject(error);
                else resolve(data['html'])
            })
        })
    }
}

TweetService.TweetStatsFreeze = {
    // Database - create table
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
    // Database - insert table
    insertToDatabase: (tweet)=>{
        return new Promise((resolve, reject)=>{
            Data.Database.query("INSERT INTO `TweetStatsFreeze` SET ?", tweet, (error, results, fields)=>{
                if(error && error.code != 'ER_DUP_ENTRY') reject(error);
                console.log(`[TweetService.TweetStatsFreeze] (${tweet.tweetID}) was uploaded`)
                resolve(results)
            })
        })
    },
    // Database - Update
    updateToDatabase: async (id, tweet)=>{
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
    // Database - create table
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
}


module.exports = TweetService;