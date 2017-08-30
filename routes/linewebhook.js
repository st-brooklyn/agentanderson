'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const db = require('../data/database');
const rc = require('recastai').default;

var Mapping = require('../models/mapping');

const channel_access_token = 'dIZf/b/ZabUO0IafFmPxBvcG9xPKQXtGZ6wClV70CCqTwV1TJDT1m58rdm3pko08nIimFRk5wmcElbc7mF9ZXkntG7goq5NDifdSJBkGLyReznHswZuhR77uOYc9ryJIVAfhouccWFwtKMIMucBXpQdB04t89/1O/w1cDnyilFU=';
const channel_secret = '912ad53b5e85ed684a9c52ac621d77e9';
const recast_request_token = 'f00c9114c22cebbecc7376e7f6f9b993';

//const config = {
//    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
//    channelSecret: process.env.CHANNEL_SECRET,
//};

const config = {
    channelAccessToken: channel_access_token,
    channelSecret: channel_secret,
};

const lineclient = new line.Client(config);
const router = express.Router();

router.post('/webhook', line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

function handleEvent(event) {
    // Process only text message
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    // Extract the message
    if (event.source.type === 'room')
    {
        var originalMessage = event.message.text;
        var replyToken = event.replyToken;
        var roomId = event.source.roomId;

        var recastrequest = new rc.request(recast_request_token);

        recastrequest.converseText(event.message.text, { conversationToken: replyToken })
            .then(function (res) {
                // Extract the reply
                var reply = res.reply();
                var convers Token = res.conversationToken;

                // Send reply back to the room
                const message = {
                    type: 'text',
                    text: reply
                };

                lineclient.pushMessage(event.source.roomId, message)
                    .then(() => {
                        // process after push message to Line
                    })
                    .catch((err) => {
                        // error handling
                    });
            })
            .catch((err) => {

            });

        Mapping.create({
            roomId: roomId,
            userId: event.source.userId,
            conversationToken: replyToken,
            createdDate: new Date().toJSON(),
            modifiedDate: new Date().toJSON(),
            originalMessage: originalMessage
        });
    }

    //Extract data from line message

    //// create a echoing text message
    //const echo = { type: 'text', text: event.message.text };

    //// use reply API
    //return client.replyMessage(event.replyToken, echo);

    // create data entries

    // extract data
}

module.exports = router;