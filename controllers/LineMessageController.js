'use strict';

const line = require('@line/bot-sdk');
const express = require('express');

var channel_access_token = '';
var channel_secret = '';

//const config = {
//    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
//    channelSecret: process.env.CHANNEL_SECRET,
//};

const config = {
    channelAccessToken: channel_access_token,
    channelSecret: channel_secret,
};

const client = new line.Client(config);

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }
}

var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

var Mapping = require('../models/mapping');

router.post('/getmessage', function (req, res) {
    // extract the line object


    
});





module.exports = router;