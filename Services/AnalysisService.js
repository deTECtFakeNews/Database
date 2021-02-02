const { default: axios } = require("axios")

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
                return text;
            }
        }
    },
    Sentiment: {
        get: async (text)=>{
            
        }
    }
}

module.exports = AnalysisService;