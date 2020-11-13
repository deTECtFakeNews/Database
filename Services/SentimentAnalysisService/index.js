const {spawn} = require('child_process');
const { json } = require('express');
const path = require('path')
const SentimentAnalysisService = {
    execute: (text)=>{
        return new Promise((resolve, reject)=>{
            console.log("[AnalysisService][SentimentAnalysisService]")
            const pathToScript = path.join(__dirname, '/SentimentAnalysis/app.py');

            const pythonProcess = spawn("python3", [pathToScript, text]);


            // const pythonScript = spawn("python3", [pathToScript, text], {env: Object.create(process.env), shell: true});
            // const pythonScript = spawn("echo", ["$PWD"], {env: Object.create(process.env), shell: true});
            pythonProcess.stderr.on('data', (data)=>{
                console.log("error", data)
            })
            pythonProcess.stdout.on('data', (data)=>{
                console.log("dadadadata")
                let response = Buffer.from(data).toString()
                resolve(JSON.parse(response.replace(/'/g, '"')))
                // resolve(response)
                // pythonProcess.kill()
            })
        })
    }
}

module.exports = SentimentAnalysisService;