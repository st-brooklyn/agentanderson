'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const db = require('../data/database');
const rc = require('recastai').default;
const configfile = require('../data/config');
const rp = require('request-promise');
const logger = require('../controllers/logcontroller');
const tp = require('../controllers/templatecontroller');

var Mapping = require('../models/mapping');
var APIUrl = require('../data/api');

const config = {
    channelAccessToken: configfile.lineChannelAccessToken,
    channelSecret: configfile.lineChannelSecret
};

const lineclient = new line.Client(config);
const router = express.Router();

router.post('/webhook', line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result)).catch((err) => {
        logger.error('[Webhook]', err);
    });
});

function handleError(err, level) {
    if (level){
        console.log(level + ": " + err);    
    }
    else {
        console.log("ERROR: " + err.stack);
    }
}

// function createProductCarousel(products) {
//     var parsedProducts = products;
    
//     var carousel = {
//         "type": "template",
//         "altText": "this is a carousel template",
//         "template": {   
//             "type": "carousel",
//             "columns": []
//         }
//     };

//     parsedProducts.data.products.forEach((product) => {
//         var periodText = "";
//         product.periods.forEach((period) => {
//             periodText += period.period_start + ' - ' + period.period_end + '\n'
//         });
//         console.log("DEBUG: [Carousel for period] : " + periodText);
//         var column = {
//             "thumbnailImageUrl": product.url_pic.startsWith('https', 0) ? product.url_pic : product.url_pic.replace("http","https"),
//             "title": product.product_name.substr(0, 40),
//             "text":  periodText.substr(0, 60),
//             "actions": [                
//                 {
//                     "type": "uri",
//                     "label": "View detail",
//                     "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
//                 },
//                 {
//                     "type": "uri",
//                     "label": "View Slide",
//                     "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
//                 }
//             ]
//         };

//           carousel.template.columns.push(column);
//     }, this);

//     console.log("DEBUG: [createProductCarousel] " + JSON.stringify(carousel));

//     return carousel;
// }

// function createConfirmation(mappingId, replyToClient) {
//     var confirm = {
//         "type": "template",
//         "altText": "this is a confirm template",
//         "template": {
//             "type": "confirm",
//             "text": replyToClient + " Message correct?",
//             "actions": [
//                 {
//                   "type": "postback",
//                   "label": "Yes",
//                   "data": "qualify/" + mappingId,
//                   "text": "Message sent. :)"
//                 },
//                 {
//                   "type": "uri",
//                   "label": "No",
//                   "uri": "https://agentanderson.herokuapp.com/qualifier/disqualify/" + mappingId
//                 }
//             ]
//         }
//     };

//     console.log("DEBUG: [createConfirmation] " + JSON.stringify(confirm));

//     return confirm;
// }

// function createAiResultMessage(intent, converseToken, replyFromAi, sourceMessage) {
//     return {
//         "type" : "text",
//         "text" : 'Source: ' + sourceMessage + '\nMessage: ' + replyFromAi + '\nIntent: ' + intent + '\nConverse Token: ' + converseToken
//     };
// }

// function createReplyMessage(replyFromAi) {
//     return {
//         "type" : "text",
//         "text" : replyFromAi
//     };
// }

function handleEvent(event) {
    logger.debug('[Main] Event:', event);
    // Process only text message
    if (event.type === 'postback') {
        // select action from the postback data
        var postbackdata = JSON.parse(event.postback.data, (key, value) => {
            return value;
        });
        logger.debug("[Postback] Data: ", postbackdata);
        var qualifier = require('../controllers/qualifiercontroller');
        
        if (postbackdata['action'] === 'qualify') {
            logger.debug("Action", {action: postbackdata['action']});
            qualifier.qualify_get(postbackdata['mappingId']);            
        }
        else {
            logger.warn("No action found.", {type: typeof(postbackdata)});
        }
    }
    else if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    // Extract the message
    if (event.source.type === 'room')
    {
        var roomId = event.source.roomId;
        var replyToken = event.replyToken;
        var originalMessage = event.message.text;
        var recastConversToken = null;
        var lineSender = event.source.userId;

        var mappingId = '';

        //logger.debug('[Main]', {IncomingMessage: originalMessage, RoomId: roomId});

        handleError('[Main] Incoming message: ' + originalMessage + '. Room Id: ' + roomId, "DEBUG");

        // // for testing -> delete the entry
        // Mapping.findOneAndRemove({roomId: roomId})
        // .then((res) => {
        //     handleError("[Remove an entry] Removed.", "DEBUG");
        // })
        // .catch((error) => {
        //     handleError(error);
        // });

        // Check if the conversation exists -- using roomId
        Mapping.findOne({roomId: roomId})
        .then((mapping) => {
            if(mapping) {
                // Mapping exists, set the converse token
                handleError('[Check room Id] Found a mapping with a Token: ' + mapping.conversationToken, "DEBUG");
                recastConversToken = mapping.conversationToken;
                mappingId = mapping._id;
                mapping.fullMessage += ' ' + originalMessage;
                mapping.message = originalMessage;
                if (mapping.userId != lineSender)
                {
                    mapping.customerId = lineSender;
                }
                mapping.save();
            }
            else {
                // No mapping -> create a new one [converse token is still null]
                handleError('[Check room Id] No mapping found', "DEBUG");
                Mapping.create({
                    roomId: roomId,
                    userId: event.source.userId,
                    customerId: null,
                    conversationToken: null,
                    createdDate: new Date().toJSON(),
                    modifiedDate: new Date().toJSON(),
                    originalMessage: originalMessage,
                    replyMessage: null,
                    fullMessage: originalMessage,
                    action: null,
                })
                .then((createdmapping) => {
                    mappingId = createdmapping._id;
                    handleError("[Create mapping] Created with Id: " + createdmapping._id, "DEBUG");
                })
                .catch((errorcreate) => {
                    handleError('[Create mapping] ' + errorcreate.stack, "ERROR");
                });
            }

            var recastrequest = new rc.request(configfile.recastRequestToken);
            handleError("[Main] recastConversToken: " + recastConversToken, "DEBUG");

            recastrequest.converseText(event.message.text, { conversationToken: recastConversToken })
            .then(function (recast_response) {                
                handleError("[ConversText] Recast: " + JSON.stringify(recast_response), "DEBUG");
                handleError("[ConversText] Mapping Id: " + mappingId, "DEBUG");

                // Update conversation token back to the mapping 
                // and Set the converse token
                if (recastConversToken == null) {
                    Mapping.findById(mappingId)
                    .then((mappingtoupdate) => {
                        if(mappingtoupdate) {
                            handleError("[Find when null token] Found a mapping with Id: " + JSON.stringify(mappingtoupdate), "DEBUG");

                            Mapping.findByIdAndUpdate(mappingId, 
                                {$set: {conversationToken: recast_response.conversationToken}}, 
                                {new: true})
                            .then((affected) => {
                                // update the converse token
                                recastConversToken = affected.conversationToken;
                                handleError("[Find and update token] Affected: " + affected, "DEBUG");
                                handleError("[Find and update token] Updated conversation token: " + recastConversToken, "DEBUG");
                            })
                            .catch((errupdate) => {
                                handleError('[Find and update token] ' + errupdate.stack, "ERROR");
                            });
                        }
                        else {
                            return handleError("[Find and update token] Mapping not found.", "WARNING");
                        }
                    })
                    .catch((errfind) => {
                        handleError('[Find when null token] ' + errfind.stack, "ERROR");
                    });
                }
                else {
                    // recastConversToken is not null
                    // No need to update
                }

                const messages = [];    
                var replyToClient = null;
                var reply_details = null;            
                var reply_confirm = null;
                // Extract the reply from recast
                var intent = '';

                if(recast_response.action) {
                    intent = recast_response.action.slug;
                    handleError("[Main] Intent: " + intent, "INFO");

                    var isdone = recast_response.action.done;
                    handleError("[Main] Done?: " + isdone, "INFO");

                    var actual_token = recast_response.conversationToken;

                    // Call api tour    
                    var entity = recast_response['entities'];
                    handleError("[Main] Entity?: " + JSON.stringify(entity), "INFO");

                    if (entity == null){
                        mockup_products = null
                    } 

                    var country = entity['country'] ? entity['country'][0] ? entity['country'][0]['value'] : null : null
                    var tourcode = entity['tourcode'] ? entity['tourcode'][0] ? entity['tourcode'][0]['value'] : null : null
                    var departuredate = entity['departure-date'] ? entity['departure-date'][0] ? entity['departure-date'][0]['value'] : null : null
                    var returndate = entity['returndate'] ? entity['returndate'][0] ? entity['returndate'][0]['value'] : null : null
                    var month = entity['month'] ? entity['month'][0] ? entity['month'][0]['value'] : null : null
                    var traveler = entity['traveler'] ? entity['traveler'][0] ? entity['traveler'][0]['value'] : null : null
                    
                    // Construct the reply message
                    // const apitour = require('../controllers/tourapicontroller');
                    var mockup_products = null
                    
                    handleError("[API] country = " + country + " tourcode = " + tourcode + " departuredate = " + departuredate + " returndate = " + returndate + " month = " + month + " traveler = " + traveler, "DEBUG");
                    var requestSuccess = false;
                    var timeout = 5000;
                    
                    if (isdone) {
                        var rpoptions = {
                            uri: configfile.apiUrl,
                            qs: {
                                apikey: 'APImushroomtravel',
                                mode: 'loadproductchatbot',
                                lang: 'th',
                                pagesize: '1',
                                pagenumber: '1',
                                sortby: 'mostpopular',
                                country_slug: country,
                                startdate: departuredate,
                                enddate: returndate,
                                month: month,
                                searchword: tourcode
                            },
                            headers: {
                                'User-Agent': 'Request-Promise'
                            },
                            json: true // Automatically parses the JSON string in the response
                        };

                        rp(rpoptions)
                        .then((repos) => {
                            //log.handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
                            logger.debug("[API Mockup]", {repos: repos});
                            mockup_products = repos;
                            //isdone = true;
                            requestSuccess = true;
                        })
                        .catch((error)=> {
                            //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                            logger.error("[Find to return api]", {stack: errupdate.stack});
                        });

                        while(requestSuccess == false)
                        {                            
                            console.log("Krob: Mockup Products: NULL: Good night. " + requestSuccess + " " + timeout);
                            require('deasync').sleep(500);
                            timeout -= 500;

                            if (requestSuccess == true || timeout == 0) {
                                console.log("Mockup Products: ARRIVED!!!!!");
                                break;
                            }
                        }

                        //isdone = true;
                        logger.debug('[API] get apiwow:', {
                            country: country,
                            tourcode: tourcode,
                            departuredate: departuredate,
                            returndate: returndate,
                            month: month,
                            traveler: traveler
                        });   
                    } else {
                        handleError("[API] Case else of no entity condition ", "DEBUG");  
                    }
                    /*
                    if (country && departuredate && returndate && month) {

                        var rpoptions = {
                            uri: configfile.apiUrl,
                            qs: {
                                apikey: 'APImushroomtravel',
                                mode: 'loadproductchatbot',
                                lang: 'th',
                                pagesize: '1',
                                pagenumber: '1',
                                country_slug: country,
                                startdate: departuredate,
                                enddate: returndate,
                                month: month,
                                searchword: ''
                            },
                            headers: {
                                'User-Agent': 'Request-Promise'
                            },
                            json: true // Automatically parses the JSON string in the response
                        };

                        rp(rpoptions)
                        .then((repos) => {
                            //log.handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
                            logger.debug("[API Mockup]", {repos: repos});
                            mockup_products = repos;
                            isdone = true;
                            requestSuccess = true;
                        })
                        .catch((error)=> {
                            //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                            logger.error("[Find to return api]", {stack: errupdate.stack});
                        });

                        while(requestSuccess == false)
                        {                            
                            console.log("Krob: Mockup Products: NULL: Good night. " + requestSuccess + " " + timeout);
                            require('deasync').sleep(500);
                            timeout -= 500;

                            if (requestSuccess == true || timeout == 0) {
                                console.log("Mockup Products: ARRIVED!!!!!");
                                break;
                            }
                        }

                        isdone = true;
                        logger.debug('[API] Before country / departuredate / returndate / month:', {
                            country: country,
                            tourcode: tourcode,
                            departuredate: departuredate,
                            returndate: returndate,
                            month: month,
                            traveler: traveler
                        });                        
                    } else if (country && month && traveler && tourcode) {
                        //mockup_products = apitour.searchtour(country, departuredate, returndate, month, '');

                        var rpoptions = {
                            uri: configfile.apiUrl,
                            qs: {
                                apikey: 'APImushroomtravel',
                                mode: 'loadproductchatbot',
                                lang: 'th',
                                pagesize: '1',
                                pagenumber: '1',
                                sortby: 'mostpopular',
                                country_slug: country,
                                startdate: '',
                                enddate: '',
                                month: month,
                                searchword: tourcode
                            },
                            headers: {
                                'User-Agent': 'Request-Promise'
                            },
                            json: true // Automatically parses the JSON string in the response
                        };

                        rp(rpoptions)
                        .then((repos) => {
                            //log.handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
                            logger.debug("[API Mockup]", {repos: repos});
                            mockup_products = repos;
                            isdone = true;
                            requestSuccess = true;
                        })
                        .catch((error)=> {
                            //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                            logger.error("[Find to return api]", {stack: errupdate.stack});
                        });

                        while(requestSuccess == false)
                        {                            
                            console.log("Krob: Mockup Products: NULL: Good night. " + requestSuccess + " " + timeout);
                            require('deasync').sleep(500);
                            timeout -= 500;

                            if (requestSuccess == true || timeout == 0) {
                                console.log("Mockup Products: ARRIVED!!!!!");
                                break;
                            }
                        }

                        isdone = true;
                        handleError("[API] Param country / month / traveler / tourcode: country = " + country + " tourcode = " + tourcode + " departuredate = " + departuredate + " returndate = " + returndate + " month = " + month + " traveler = " + traveler, "DEBUG");
                    } else if ((country && month && traveler) && departuredate == null) {
                        //mockup_products = apitour.searchtour(country, departuredate, returndate, month, '');

                        var rpoptions = {
                            uri: configfile.apiUrl,
                            qs: {
                                apikey: 'APImushroomtravel',
                                mode: 'loadproductchatbot',
                                lang: 'th',
                                pagesize: '1',
                                pagenumber: '1',
                                sortby: 'mostpopular',
                                country_slug: country,
                                startdate: '',
                                enddate: '',
                                month: month,
                                searchword: ''
                            },
                            headers: {
                                'User-Agent': 'Request-Promise'
                            },
                            json: true // Automatically parses the JSON string in the response
                        };

                        rp(rpoptions)
                        .then((repos) => {
                            //log.handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
                            logger.debug("[API Mockup]", {repos: repos});
                            mockup_products = repos;
                            isdone = true;
                            requestSuccess = true;
                        })
                        .catch((error)=> {
                            //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                            logger.error("[Find to return api]", {stack: errupdate.stack});
                        });

                        while(requestSuccess == false)
                        {                            
                            console.log("Krob: Mockup Products: NULL: Good night. " + requestSuccess + " " + timeout);
                            require('deasync').sleep(500);
                            timeout -= 500;

                            if (requestSuccess == true || timeout == 0) {
                                console.log("Mockup Products: ARRIVED!!!!!");
                                break;
                            }
                        }

                        isdone = true;
                        handleError("[API] Param country / month / traveler / departuredate is null : country = " + country + " month = " + month + " traveler = " + traveler, "DEBUG");
                    } else if (tourcode && month && traveler) {
                        // mockup_products = apitour.searchtour('', '', '', '', tourcode);

                        var rpoptions = {
                        uri: configfile.apiUrl,
                        qs: {
                            apikey: 'APImushroomtravel',
                            mode: 'loadproductchatbot',
                            lang: 'th',
                            pagesize: '1',
                            pagenumber: '1',
                            country_slug: "",
                            startdate: "",
                            enddate: "",
                            month: "",
                            searchword: tourcode
                        },
                            headers: {
                                'User-Agent': 'Request-Promise'
                            },
                            json: true // Automatically parses the JSON string in the response
                        };

                        rp(rpoptions)
                        .then((repos) => {
                            //log.handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
                            logger.debug("[API Mockup]", {repos: repos});
                            mockup_products = repos;
                            isdone = true;
                            requestSuccess = true;
                        })
                        .catch((error)=> {
                            //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                            logger.error("[Find to return api]", {stack: errupdate.stack});
                        });

                        while(requestSuccess === false)
                        {
                            
                            console.log("Maikrob: Mockup Products: NULL: Good night.");
                            require('deasync').sleep(500);
                            timeout -= 500;

                            if (requestSuccess === true || timeout == 0) {
                                console.log("Mockup Products: ARRIVED!!!!!");
                                break;
                            }
                        }
                        isdone = true;
                        handleError("[API] Param tourcode Only: country = " + country + " tourcode = " + tourcode + " departuredate = " + departuredate + " returndate = " + returndate + " month = " + month + " traveler = " + traveler, "DEBUG");
                    } else { 
                        handleError("[API] Case else of no entity condition ", "DEBUG");  
                    }
                    */
                }

                if (mockup_products == null) 
                {
                    //reply_details = createReplyMessage(recast_response.reply());
                    intent = '-';
                }

                console.log("[Mockup Product] " +  JSON.stringify(mockup_products));

                //const linehelper = require('../controllers/LineMessageController');
                if (mockup_products != null && mockup_products != undefined) {
                    console.log("success: " + mockup_products['success'] + " results: " + mockup_products['data']['results'] );
                    if (mockup_products['success'] == 'True' && mockup_products['data']['results'] > 0){
                        reply_details = tp.templateAIMessage(intent, recast_response.conversationToken, '', recast_response.source);
                        var reply_carousel = tp.templateCarousel(mockup_products);
                        messages.push(reply_details);
                        messages.push(reply_carousel);
                    } else {
                        reply_details = tp.templateAIMessage(intent, recast_response.conversationToken, recast_response.reply(), recast_response.source);
                        replyToClient = tp.templateReply(recast_response.reply());
                        messages.push(reply_details);
                        messages.push(replyToClient);
                    }
                } else {
                    reply_details = tp.templateAIMessage(intent, recast_response.conversationToken, recast_response.reply(), recast_response.source);
                    replyToClient = tp.templateReply(recast_response.reply());
                    messages.push(reply_details);
                    messages.push(replyToClient);
                }
                
                if (replyToClient == null){
                    reply_confirm = tp.templateConfirm(mappingId, '');
                } else {
                    reply_confirm = tp.templateConfirm(mappingId, replyToClient.text);
                }
            
                var reply = recast_response.reply() + '\n' + recast_response.conversationToken;                
                if(reply == null) {
                    reply = '[Error]\n' + recast_response.conversationToken;
                }

                var reply_text = {
                    "type": "text",
                    "text": reply
                };
        
                messages.push(reply_confirm);

                //handleError('[Main] Messages: ' + JSON.stringify(messages), "DEBUG");
                logger.debug("[Main]",{message: messages});

                var senderId = '';

                Mapping.findById(mappingId)
                .then((senderMapping) => {
                    if(senderMapping) {
                        senderId = senderMapping.userId;
                        //handleError("[Find for sender] Sender Id: " + senderId, "DEBUG");
                        logger.debug("[Find for sender]", {senderId: senderId});
                        
                        lineclient.pushMessage(senderId, messages)
                        .then(() => {
                            // process after push message to Line
                            //handleError("[Push carousel] Carousel sent to the sender.", "DEBUG");
                            logger.debug("[Push messages] Carousel sent to the sender");
                            if (reply_carousel == null){
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(replyToClient)}},
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    //handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                    logger.debug("[Find to update reply]", {mappingUpdateReply: mappingUpdateReply});
                                })
                                .catch((errupdate) => {
                                    //handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                    logger.error("[Find to update reply]", {stack: errupdate.stack});
                                });

                            } else {
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(reply_carousel)}},
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    //handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                    logger.debug("[Find to update reply]", {mappingUpdateReply: mappingUpdateReply});
                                })
                                .catch((errupdate) => {
                                    //handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                    logger.error("[Find to update reply]", {stack: errupdate.stack});
                                });                                        
                            }

                            // Save the response back to the mapping -> replyMessage [JSON.stringify]                               
                        })
                        .catch((errPushCarousel) => {
                            // error handling
                            //handleError("[Push carousel] Push failed. " + errPushCarousel.stack, "ERROR");
                            logger.error("[Push carousel]", {stack: errPushCarousel.stack});
                        });
                    }
                    else {
                        //handleError("[Find for sender] Mapping for sender not found", "WARNING");
                        logger.warning("[Find for sender] Mapping for sender not found");
                    }                    
                })
            }) // End then findById
            .catch((err) => {
                handleError(err);
            });            
        }) // End then
        .catch((errfindone) => {
            handleError(errfindone);
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