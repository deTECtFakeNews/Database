const AnalysisService = {
    getSentiment: async (text)=>{
        // Interfaz con script de Python (@juanca741)
        individualData = {
            'tweet': text, 
            'negativity':0.0,
            'neutrality':0.0,
            'positivity':0.0, 
            'compound':0.0, 
            'polarity':0.0,
            'subjectivity':0.0, 
            'anger':0.0,
            'anticipation':0.0,
            'disgust':0.0,
            'fear':0.0,
            'joy':0.0,
            'negative':0.0,
            'positive':0.0,
            'sadness':0.0,
            'surprise':0.0,
            'trust':0.0 }
        return individualData;
    }
}

module.exports = AnalysisService;