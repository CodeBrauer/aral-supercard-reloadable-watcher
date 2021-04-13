const dotenv          = require('dotenv').config()
const Nightmare       = require('nightmare')
const nightmare       = Nightmare({ show: false })
const fs              = require('fs');
const axios           = require('axios');
const var_dump        = require('var_dump')
const randomUseragent = require('random-useragent');

nightmare
.useragent(randomUseragent.getRandom())
.goto('https://reload.aral-supercard.de/login')
.type('input[name="email"]', process.env.ARAL_USERNAME)
.type('input[name="password"]', process.env.ARAL_PASSWORD)
.wait(250)
.click('button[type="submit"][dusk="employee-login"]')
.wait('#carteElement .col-md-6:last-child')
.goto('https://reload.aral-supercard.de/transaktionen/')
.evaluate(() => document.querySelector('.ap-canvas .container .row table.table tbody tr:first-child').innerText.trim())
.end()
.then(function(res) {
    var last_state = fs.readFileSync('last.txt', 'utf8')

    try {
        var value = res.match(/(\d+,\d+\s?(€|EUR))/)[0].replace('   ', ' ');;
    } catch {
        var value = res;
    }
    try {
        var date = res.match(/\d+\.\d+\.\d{4}/)[0];
    } catch {
        var date = '';
    }

    if (last_state !== res && res.includes('Loading')) {
        console.log('neue aufladung erkannt')
        axios.post(process.env.SLACK_WEBHOOK_URL, {
            text: "ARAL Karten wurden aufgetankt! ("+ value +" @ "+ date +")"
        }).then(res => {
            console.log(`statusCode: ${res.statusCode}`)
            console.log(res)
        }).catch(error => {
            console.error(error)
        })
    }
    fs.writeFile('last.txt', res, function (err) {
        if (err) return console.log(err);
        console.log('saved last state')
    });
}).catch(error => {
    console.error('NIGHTMARE failed:', error)
});