
'use strict';
var express = require('express');
var router = express.Router();

const line = require('@line/bot-sdk');
const db = require('../data/database');
var Mapping = require('../models/mapping');

const channel_access_token = 'dIZf/b/ZabUO0IafFmPxBvcG9xPKQXtGZ6wClV70CCqTwV1TJDT1m58rdm3pko08nIimFRk5wmcElbc7mF9ZXkntG7goq5NDifdSJBkGLyReznHswZuhR77uOYc9ryJIVAfhouccWFwtKMIMucBXpQdB04t89/1O/w1cDnyilFU=';
const channel_secret = '912ad53b5e85ed684a9c52ac621d77e9';

const config = {
    channelAccessToken: channel_access_token,
    channelSecret: channel_secret,
};

const lineclient = new line.Client(config);

function handleError(err, level) {
    if (level){
        console.log(level + ": " + err);    
    }
    else {
        console.log("ERROR: " + err.stack);
    }
}

/* GET home page. */
router.get('/qualify/:id', function (req, res, next) {
    var id = req.params.id;

    console.log("[Qualifier ID] => " + id);

    Mapping.findById(id)
    .then((foundone) => {
        // get the message and send back to the room
        console.log("Found: " + JSON.stringify(foundone));
        var roomId = foundone.roomId;
        var reply = foundone.replyMessage;

        // send message to room
        lineclient.pushMessage(roomId, JSON.parse(reply))
        .then(() => {
            handleError("[Push after qualify] Message sent", "DEBUG");
        })
        .catch((pushError) => {
            handleError('[Push after qualify] ' + pushError.stack, "DEBUG")
        });
    })
    .catch((finderror) => {
        handleError("[Find one for Qualification] " + finderror.stack, "ERROR");
    });
});

router.get('/disqualify/:id', function(req, res) {
    // Update the database that this is not correct
    Mapping.findById(id)
    .then((foundone) => {
        // get the message and send back to the room
        var roomId = foundone.roomId;
        var reply = foundone.replyMessage;
        var sender = foundone.userId;

        var message = {"type": "text", "text": "Disqualified"};

        handleError("[Disqualification] Message is incorrect.", "WARNING");

        lineclient.pushMessage(sender, message)
        .then(() => {
            handleError("[Push after qualify] Message sent", "DEBUG");
        })
        .catch((pushError) => {
            handleError('[Push after qualify] ' + pushError.stack, "DEBUG")
        });

        // // send message to room
        // lineclient.pushMessage(roomId, JSON.parse(reply))
        // .then(() => {
        //     handleError("[Push after qualify] Message sent", "DEBUG");
        // })
        // .catch((pushError) => {
        //     handleError('[Push after qualify] ' + pushError.stack, "DEBUG")
        // });
    })
    .catch((finderror) => {
        handleError("[Find one for Disqualification] " + finderror.stack, "ERROR");
    });
});

module.exports = router;
