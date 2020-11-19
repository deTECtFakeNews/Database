const {execFile, exec, spawn} = require('child_process');
const path = require('path')

const AnalysisService = {
    getSentiment: async (text, isTranslated = true)=>{
        if(!isTranslated){
            text = await AnalysisService.getTranslation(text);
        }
        const pathToScript = path.join(__dirname, '/Sentiment/Main.py');
        return new Promise((resolve, reject)=>{
            let analysis = spawn("python3", [pathToScript, text]);
            analysis.stdout.on('data', resolve);
            analysis.stderr.on('data', reject);
        })
    },
    getTranslation: async (text)=>{
        const pathToScript = path.join(__dirname, '/Translation/Main.py');
        return new Promise((resolve, reject)=>{
            let analysis = spawn("python3", [pathToScript, text]);
            analysis.stdout.on('data', resolve);
            analysis.stderr.on('data', reject);
        })
    }
}

module.exports = AnalysisService;