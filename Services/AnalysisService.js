const SentimentAnalysisService = require("./SentimentAnalysisService");

const AnalysisService = {
    getSentiment: async (text)=>{
        return await SentimentAnalysisService.execute(text)
    }
}

module.exports = AnalysisService;