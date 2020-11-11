class TweetClient{
    static async getFromAPI(id){
        let data = await (await fetch('/tweet/fetch/'+id)).json();
        return new TweetClient(data); 
    }
    constructor(tweet){
        this.tweetID = tweet.tweetID || -1; 
        this.authorID = tweet.authorID || -1; 
        this.inReplyToUserID = tweet.inReplyToUserID || -1; 
        this.inReplyToTweetID = tweet.inReplyToTweetID || -1; 
        this.quotesTweetID = tweet.quotesTweetID || -1; 
        this.creationDate = new Date(tweet.creationDate); 
        this.fullText = tweet.fullText; 
        this.language = tweet.language; 
        this._TweetStatsFreeze = new TweetClient.TweetStatsFreeze(tweet);
        this._TweetAnalysis = new TweetClient.TweetAnalysis(tweet);
    }
    getData(){
        return {
            tweetID: this.tweetID, 
            authorID: this.authorID, 
            inReplyToUserID: this.inReplyToUserID, 
            inReplyToTweetID: this.inReplyToTweetID, 
            quotesTweetID: this.quotesTweetID, 
            creationDate: this.creationDate, 
            fullText: this.fullText, 
        }
    }
    getStats(){
        return this._TweetStatsFreeze.getData();
    }
    getAnalysis(){

    }
    async getEmbed(){
        if(this.tweetID!=-1) return await (await fetch(`/tweet/embed/${this.tweetID}`)).text();
        return "";
    }
    async getAuthor(){
        if(this.authorID != -1){
            let user = await (await fetch(`/user/fetch/${this.authorID}`)).json();
            return new UserClient(user);
        } else {
            return new UserClient({});
        }
    }
    async getRepliedUser(){
        if(this.inReplyToUserID != -1){
            let user = await (await fetch(`/user/fetch/${this.inReplyToUserID}`)).json();
            return new UserClient(user);
        } else {
            return new UserClient({});
        }
    }
    async getRepliedTweet(){
        if(this.inReplyToTweetID != -1){
            let tweet = await (await fetch(`/tweet/fetch/${this.inReplyToTweetID}`)).json();
            return new TweetClient(tweet);
        } else{
            return new TweetClient({});
        }
    }

    getDetailsTable(){
        let container = document.createElement('div');
        let embed = document.createElement('div');
            embed.className = 'twitter-tweet-embed';
        this.getEmbed().then(data=>{
            embed.innerHTML = data;
            twttr.widgets.load(embed);
        })
        let details = new DetailsTable({
            'Tweet ID': this.tweetID, 
            'Author': {
                'text': this.authorID, 
                'click': async ()=>{
                    await (await this.getAuthor()).openDialog();
                }
            },
            'Replies to (user)': {
                'text': this.inReplyToUserID, 
                'click': async ()=>{
                    await (await this.getRepliedUser()).openDialog();
                }
            },
            'Replies to (tweet)': {
                'text': this.inReplyToTweetID, 
                'click': async ()=>{
                    await (await this.getRepliedTweet()).openDialog();
                }
            }, 
            'Creation Date': this.creationDate, 
            'Full Text': this.fullText
        }).dom;

        container.append(embed, details);
        return {dom: container}
    }

    getRelatedTables(){
        // return {dom: "Hi"}
        let container = document.createElement('div');
        container.append(this._TweetStatsFreeze.getDetailsTable().dom);
        let user = this.getAuthor().then(author=>{
            container.append( author.getDetailsTable("User", true ).dom )
        })
        return {dom: container}

    }

    getAnalysisTab(){
        return this._TweetAnalysis.getDetails()
    }

    openDialog(){
        new Dialog(
            new Tabs({
                "Details": this.getDetailsTable().dom, 
                "Related": this.getRelatedTables().dom,
                "Analysis": this.getAnalysisTab().dom
            }).dom
        )
    }

}

TweetClient.TweetStatsFreeze = class {
    constructor(tweet){
        this.tweetID = tweet.tweetID;
        this.updateDate = new Date(); 
        this.retweetCount = tweet.retweetCount; 
        this.favoriteCount = tweet.favoriteCount; 
        this.replyCount = tweet.replyCount;
    }
    getDetailsTable(){
        return new DetailsTable({
            'Tweet ID': this.tweetID, 
            'Last Updated': this.updateDate, 
            'Number of Retweets': this.retweetCount, 
            'Number of Likes': this.favoriteCount, 
            'Number of Replies': this.replyCount
        }, "TweetStatsFreeze")
    }
}

TweetClient.TweetAnalysis = class {
    constructor(tweet){
        this._sentiment = new TweetClient.TweetAnalysis.Sentiment(tweet._TweetAnalysis.sentimentAnalysis);
    }
    getDetails(){
        let container = document.createElement('div');
        container.append(this._sentiment.getDetailsTable().dom);
        return {dom: container}
    }
}

TweetClient.TweetAnalysis.Sentiment = class {
    constructor(sentiment){
        this.negativity = sentiment.negativity;
        this.neutrality = sentiment.neutrality;
        this.positivity = sentiment.positivity;
        this.compound = sentiment.compound;
        this.polarity = sentiment.polarity;
        this.subjectivity = sentiment.subjectivity;
        this.anger = sentiment.anger;
        this.anticipation = sentiment.anticipation;
        this.disgust = sentiment.disgust;
        this.fear = sentiment.fear;
        this.joy = sentiment.joy;
        this.negative = sentiment.negative;
        this.positive = sentiment.positive;
        this.sadness = sentiment.sadness;
        this.surprise = sentiment.surprise;
        this.trust = sentiment.trust;
    }
    getDetailsTable(){
        return new DetailsTable({
            negativity: this.negativity,
            neutrality: this.neutrality,
            positivity: this.positivity,
            compound: this.compound,
            polarity: this.polarity,
            subjectivity: this.subjectivity,
            anger: this.anger,
            anticipation: this.anticipation,
            disgust: this.disgust,
            fear: this.fear,
            joy: this.joy,
            negative: this.negative,
            positive: this.positive,
            sadness: this.sadness,
            surprise: this.surprise,
            trust: this.trust
        }, "Sentiment Analysis")
    }
}
