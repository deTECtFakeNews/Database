const Connection = require("../../Data");
const QueryService = require("../../Services/Query/QueryService");
const { TweetModel } = require("../Tweet/TweetModel");

class QueryModel {
    queryID;
    executeDate;
    query;
    shouldExecute;
    // historicNext;
    oldestDate;

    #next_token;

    constructor(data){
        this.queryID = data?.queryID;
        this.executeDate = data?.executeDate;
        this.query = data?.query;
        this.shouldExecute = data?.shouldExecute;
        // this.historicNext = data?.historicNext;
        this.oldestDate = data?.oldestDate;
    }
    async executeHistoric(){
        await QueryService.fetchAPI_historic(this.query, {
            start_time: '2020-01-01T00:00:00Z',
            end_time: this.oldestDate.toISOString(),
            next_token: this.#next_token
        }, {
            onResult: async t => {
                try{
                    console.log(t.fullText.substring(0, 10)+'...');
                    const tweet = new TweetModel(t);
                    // Upload
                    await tweet.uploadToDatabase();
                    // Get author stats
                    if(tweet.author.latestStats.last().followerCount >= 10000){
                        // Get and upload followers
                        await tweet.author.followers.getFromAPI();
                        await tweet.author.followers.uploadToDatabase();
                        console.log('[Models/Query] Uploaded tweet user followers')
                    }
                    // Get tweet stats
                    if(tweet.latestStats.last().retweetCount >= 20){
                        try{
                            await tweet.retweets.getFromAPI();
                            await tweet.retweets.uploadToDatabase();
                            console.log('[Models/Query] Uploaded tweet retweets')
                        } catch(e){}
                    }
                    // Get connection
                    await QueryService.QueryTweetService.create({tweetID: tweet.tweetID, queryID: this.queryID});
                    // Update execution date
                    await QueryService.update(this.queryID, {executeDate: new Date(), oldestDate: tweet.creationDate})
                    console.log('[Models/Query] Uploaded query tweet')
                    console.log('');
                } catch(e){
                    console.error("[Models/Query] Error inserting tweet")
                }
            }, 
            onPage: async next_token => {
                try{
                    await this.executeHistoric()
                } catch(e){
                    console.log(e)
                }
            }, 
            onEnd: async () => {
                try{  
                    // Mark as completed
                    await QueryService.update(this.queryID, {isComplete: true})
                } catch(e){
                    console.log(e)
                }
            }
        })
    }
}

module.exports = QueryModel;

/* Connection.Database.connect().then(async ()=>{
    const [q] = await QueryService.read(162);
    const query = new QueryModel(q);
    await query.executeHistoric();
    // console.dir(query, {depth: null})
}) */