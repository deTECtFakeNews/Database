const { default: axios } = require("axios")

/**
 * AnalysisService_Sentiment_Data
 * @typedef {Map<String, Number>} AnalysisService_Sentiment_Data
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
 */

/**
 * AnalysisService_Bert_Data
 * @typedef {Map<String, Object>} AnalysisService_Bert_Data
 * @property {string} bert_toxicity 
 * @property {string} bert_irony 
 * @property {string} bert_stance 
 * @property {string} bert_hateSpeech 
 * @property {string} processedTweet 
 * @property {string} bert_generalClassification 
 */

const AnalysisService = {
    Translation: {
        /**
         * Get translation of text into target language
         * @param {String} text Text to be translated
         * @param {String} target Code of language to translate
         * @returns {Promise<String>}
         */
        get: async (text, target='en')=>{
            try{
                let res = await axios.post('https://libretranslate.com/translate', {q: text, target, source: 'auto'});
                return await res.data.translatedText;
            } catch (e) {
                // return await AnalysisService.Translation.get(text, target);
                throw e;
            }
        }
    },
    Sentiment: {
        /**
         * Get sentiment analysis of text
         * @param {String} text Text to be analyzed
         * @returns {Promise<AnalysisService_Sentiment_Data>}
         */
        get: async (text)=>{
            
        }
    },
    Bert: {
        /**
         * Get bert analysis from text 
         * @param {String} text Text to be analyzed
         * @returns {Promise<AnalysisService_Bert_Data>}
         */
        get: async (text)=>{

        }
    }
}

module.exports = AnalysisService;