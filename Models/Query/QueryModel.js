const { QueryTweetService } = require("../../Services/Query/QueryService");
const QueryService = require("../../Services/Query/QueryService");
const TweetService = require("../../Services/Tweet/TweetService");
const TweetModel = require("../Tweet/TweetModel");

class QueryModel {
    /**@type {String} Identifier of Query in Database and Spreadsheet */
    queryID;
    /**@type {Date} Date of last execution */
    executeDate;
    /**@type {String} Text to be searched */
    query;
    /**@type {Date} Date of addition and first execution */
    firstExecuteDate;
    /**@type {Boolean} Execute the query automatically? */
    shouldExecute;
    /**@type {String} Parameter to be used to get the next page of results in Full Archive Search*/
    historicNext;
    /**@type {String} */
    oldestDate;
    /**@type {Array<TweetModel>} */
    savedTweets = [];
    /**@type {Array<TweetModel>} */
    latestTweets = [];
    /**
     * Creates a new object for managing queries
     * @param {import("../../Services/Query/QueryService").QueryJSON} query QueryJSON data
     */
    constructor(query){
        this.queryID = query.queryID;
        this.executeDate = query.executeDate;
        this.query = query.query;
        this.firstExecuteDate = new Date(query.firstExecuteDate);
        this.shouldExecute = query.shouldExecute;
        
        this.historicNext = query.historicNext || undefined;
        this.oldestDate = new Date(query.oldestDate) || new Date();
    }

    /* async execute({historic = false} = {}){
        try{
            if(!historic){
                this.latestTweets = (await QueryService.fetchAPI(this.query)).tweets
                    .map(tweet => new TweetModel(tweet));
            } else {
                this.latestTweets = (await QueryService.fetchAPIHistoric(this.query)).tweets
                    .map(tweet => new TweetModel(tweet));
            }
            for(let tweet of this.latestTweets){
                try{
                    await tweet.upload({shouldUploadRetweets: true});
                    this.savedTweets.push(tweet);
                    await QueryTweetService.create({tweetID: tweet.tweetID, queryID: this.queryID});
                    await QueryService.update(this.queryID, {executeDate: new Date()});
                    console.log(`Added tweet ${tweet.tweetID} to query ${this.queryID}`)
                } catch(e){
                    console.log(`Error inserting tweet with tweetID=${tweet.tweetID} and userID=${tweet.authorID}`, e)
                }
            }
        } catch(e){
            console.log("Error executing query", e)
        }
    } */

    async execute({historic = false}) {
        try{
            if(!historic) return await this.executeLatest();
            else return await this.executeAll();
        } catch(e){
            throw e;
        }
    }

    async executeLatest(){
        try{
            (await QueryService.fetchAPI(this.query)).tweets
            .forEach(async t => {
                const tweet = new TweetModel(t);
                try{
                    await tweet.upload({shouldUploadRetweets: true});
                    this.savedTweets.push(tweet);
                    await QueryTweetService.create({tweetID: tweet.tweetID, queryID: this.queryID});
                    await QueryService.update(this.queryID, {executeDate: new Date()});
                    console.log(`Added tweet ${tweet.tweetID} to query ${this.queryID}`)
                } catch(e){
                    console.log(`Error inserting tweet with tweetID=${tweet.tweetID} and userID=${tweet.authorID}`, e)
                }
            })
        } catch(e){
            console.log("Error executing query", e)
        }
    }

    executeAll(){
        return new Promise((resolve, reject) => {
            QueryService.fetchAPIHistoric(this.query, 
                {
                    next_token: this.historicNext, 
                    start_time: "2020-01-01T00:00:00Z", 
                    end_time: this.oldestDate.toISOString(), 
                    // until_id: this.oldestID
                }, 
                {
                    onResult: async id=>{
                        try{
                            const t  = await TweetService.fetchAPI(id);
                            const tweet = new TweetModel(t);
                            await tweet.upload({shouldUploadRetweets: true});
                            this.savedTweets.push(tweet);
                            await QueryTweetService.create({tweetID: tweet.tweetID, queryID: this.queryID});
                            await QueryService.update(this.queryID, {executeDate: new Date(), oldestDate: tweet.creationDate});
                            console.log(`Added tweet ${tweet.tweetID} to query ${this.queryID}`);
                        } catch(e){
                            console.error(`Error inserting tweet with tweetID=${id}`, e)
                        } 
                    }, 
                    onPage: async (next_token)=>{
                        try{
                            await QueryService.update(this.queryID, {historicNext: next_token});
                            this.historicNext = next_token;
                            await this.executeAll();
                        } catch(e){
                            reject(e);
                        }
                    },
                    onEnd: resolve, 
                    onError: reject, 
                }
            )
        })
    }

    streamTweets({onResult = ()=>{}, onError = ()=>{}}){
        QueryService.QueryTweetService.stream(this.queryID, {
            onResult: async (tweet)=>{
                await onResult(new TweetModel(tweet))
            }, 
            onError
        })
    }

    async pause(){
        if(this.shouldExecute == false) return;
        try{
            await QueryService.update(this.queryID, {shouldExecute: false});
        } catch(e){

        }
    }

    async resume(){
        if(this.shouldExecute == true) return;
        try{
            await QueryService.update(this.queryID, {shouldExecute: true});
        } catch(e){

        }
    }

}

module.exports = QueryModel;