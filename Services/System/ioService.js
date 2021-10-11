const split = require('split');

const input = (prompt) => new Promise(resolve => {
    process.stdout.write(prompt+': ')
    process.stdin.pipe(split()).on('data', data=>{
        if(data.length > 0) resolve(data);
        else resolve(undefined)
    })
})

const IOService = {input};
module.exports = IOService;