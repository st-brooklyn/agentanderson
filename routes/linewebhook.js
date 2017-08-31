'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const db = require('../data/database');
const rc = require('recastai').default;
const hl = require('heroku-logger');

var Mapping = require('../models/mapping');

const channel_access_token = 'dIZf/b/ZabUO0IafFmPxBvcG9xPKQXtGZ6wClV70CCqTwV1TJDT1m58rdm3pko08nIimFRk5wmcElbc7mF9ZXkntG7goq5NDifdSJBkGLyReznHswZuhR77uOYc9ryJIVAfhouccWFwtKMIMucBXpQdB04t89/1O/w1cDnyilFU=';
const channel_secret = '912ad53b5e85ed684a9c52ac621d77e9';
const recast_request_token = '14dbc382a7fcd17d4df5e3a8a73a0176';

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

function handleError(err) {
    console.log(err);
}

function handleEvent(event) {
    // Process only text message
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    // Extract the message
    if (event.source.type === 'room')
    {
        var roomId = event.source.roomId;
        var replyToken = event.replyToken;
        var originalMessage = event.message.text;
        var recastConversToken = null;

        var mappingId = '';

        console.log('Incoming message: ' + originalMessage + '. Room Id: ' + roomId);

        // Check if the conversation exists -- using roomId
        Mapping.findOne({roomId: roomId}, 'roomId conversationToken', function(err, mapping) {
            if(err) return handleError(err);
            
            if(mapping) {
                // Mapping exists
                console.log('Found a mapping with a Token: ' + mapping.conversationToken);
                recastConversToken = mapping.conversationToken;
                mappingId = mapping._id;
            }
            else {
                // No mapping -> create a new one
                console.log('No mapping found');
                Mapping.create({
                    roomId: roomId,
                    userId: event.source.userId,
                    conversationToken: '',
                    createdDate: new Date().toJSON(),
                    modifiedDate: new Date().toJSON(),
                    originalMessage: originalMessage
                }, function(err, mapping) {
                    if (err) handleError(err);
                    
                    mappingId = mapping._id;
                    console.log("Created with Id: " + mapping._id);
                });                
            }
        });

        var recastrequest = new rc.request(recast_request_token);

        recastrequest.converseText(event.message.text, { conversationToken: recastConversToken })
            .then(function (res) {
                // Extract the reply
                console.log("Recast: " + JSON.stringify(res));
                console.log("Mapping Id: " + mappingId);

                // Update conversation token back to the mapping
                if (recastConversToken == null) {
                    Mapping.findById(mappingId, function(err, mapping) {
                        if (err) handleError(err);

                        if(mapping) {
                            console.log("Found a mapping with Id: " + mapping._id);

                            Mapping.update({_id: mappingId}, 
                                {conversationToken: recastConversToken},
                                function(err, affected, response) {
                                    if(err) handleError(err);

                                    console.log("Affected: " + affected._id);
                                    console.log("Response: " + response);
                                }
                            );

                            // Mapping.findByIdAndUpdate(mappingId, 
                            //     {$set: {conversationToken: recastConversToken}}, 
                            //     {new: true}, 
                            //     function(err, mapping) {
                            //         if (err) return handleError(err);
        
                            //         recastConversToken = res.conversationToken;
                            //         console.log("Updated conversation token: " + recastConversToken);
                            //     }
                            // );
                        }
                        else {
                            console.log("Mapping not found");
                        }
                    });
                }

                var reply = res.reply();

                if(reply == null) {
                    reply = '[Error]';
                }
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
                        console.log(err);
                    });
            })
            .catch((err) => {
                console.log(err);
            });

        // Mapping.create({
        //     roomId: roomId,
        //     userId: event.source.userId,
        //     conversationToken: replyToken,
        //     createdDate: new Date().toJSON(),
        //     modifiedDate: new Date().toJSON(),
        //     originalMessage: originalMessage
        // });
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