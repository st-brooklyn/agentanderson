'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const db = require('../data/database');
const rc = require('recastai').default;
const configs = require('../data/config');
const rp = require('request-promise');
const logger = require('../controllers/logcontroller');
const tp = require('../controllers/templatecontroller');

var Mapping = require('../models/mapping');
var RecastResult = require('../models/recast');
var APIUrl = require('../data/api');

const config = {
    channelAccessToken: configs.lineChannelAccessToken,
    channelSecret: configs.lineChannelSecret
};

const lineclient = new line.Client(configs.botmapping.default);
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

function handleEvent(event) {
    logger.debug('[Main] Event:', event);

    // http://35.202.67.147:5000/dc/xxxxx ตัดคำ ก่อนวิ่งเข้า recast

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
            qualifier.qualify_get(postbackdata['mappingId'], postbackdata['recastUuid']);            
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
        var dataGetAPI = '';

        let needCreate = false;

        logger.debug('[Main]', {
            IncomingMessage: originalMessage, 
            RoomId: roomId
        });

        // Check if the conversation exists -- using roomId
        Mapping.findOne({roomId: roomId, expired: false})
        .then((mapping) => {
            let customerDisplayName = null;
            let gotProfile = false;

            if(mapping) {
                // Mapping exists, set the converse token
                logger.debug('[Check room Id] Found a mapping.', mapping);
                
                recastConversToken = mapping.conversationToken;
                mappingId = mapping._id;                
                customerDisplayName = mapping.customerDisplayName;

                // TODO: date conversion and calculation
                let now = new Date();
                let modDate = new Date(mapping.modifiedDate);
                
                logger.debug('[date] check date time : ', {DateDiff: Math.abs(modDate - now), calDate: configs.timeExpired}); 

                if ((Math.abs(modDate - now)) >= (configs.timeExpired * 60 * 1000)) {
                    needCreate = true;
                    mapping.expired = true;
                }

                // if (mapping.reservationId == null) {
                //     if (lineSender != mapping.customerId) {
                //         mapping.customerId = lineSender;

                //         // Get the customer display name
                //         lineclient.getProfile(lineSender)
                //         .then((profile) => {
                //             logger.debug("[Get Profile] Customer Profile:", profile);
                //             customerDisplayName = profile.displayName;
                //             mapping.customerDisplayName = customerDisplayName;
                //             gotProfile = true;
                //         })
                //         .catch((errProfile) => {
                //             logger.error("[Get Profile]: Error getting customer profile.", errProfile);
                //         });
                //     }
                // }
                // else{
                //     gotProfile = true;
                //     customerDisplayName = mapping.customerDisplayName;
                // }

                // var profileTimeout = configs.apitimeout;

                // while(true) {
                //     if (gotProfile == true || profileTimeout == 0) {
                //         logger.silly("[Profile] Got profile.");
                //         break;
                //     }

                //     logger.silly('[Profile] Still waiting for Profile.', {gotProfile: gotProfile, profileTimeout: profileTimeout});

                //     require('deasync').sleep(500);
                //     profileTimeout -= 500;
                // }

                mapping.modifiedDate = new Date().toJSON();
                mapping.fullMessage += ' ' + originalMessage;
                mapping.message = originalMessage;
                mapping.save();
            }
            else {
                needCreate = true;
                // No mapping -> create a new one [converse token is still null]
                logger.debug('[Check room Id] No mapping found');            
                
            }

            if (needCreate === true) {
                // Get the customer display name
                lineclient.getProfile(lineSender)
                .then((profile) => {
                    logger.debug("[Get Profile] Customer Profile:", profile);
                    customerDisplayName = profile.displayName;
                    //mapping.customerDisplayName = customerDisplayName;
                    gotProfile = true;
                })
                .catch((errProfile) => {
                    logger.error("[Get Profile]: Error getting customer profile.", errProfile);
                });

                let profileTimeout = configs.apitimeout;

                while(true) {
                    if (gotProfile == true || profileTimeout == 0) {
                        logger.silly("[Profile] Got profile.");
                        break;
                    }

                    logger.silly('[Profile] Still waiting for Profile.', {gotProfile: gotProfile, profileTimeout: profileTimeout});

                    require('deasync').sleep(500);
                    profileTimeout -= 500;
                }
                
                Mapping.create({
                    roomId: roomId,
                    reservationId: configs.mapper,
                    customerId: lineSender,
                    customerDisplayName: customerDisplayName,
                    conversationToken: null,
                    createdDate: new Date().toJSON(),
                    modifiedDate: new Date().toJSON(),
                    originalMessage: originalMessage,
                    replyMessage: null,
                    fullMessage: originalMessage,
                    action: null,
                    apiPayload: null,
                    expired: false
                })
                .then((createdmapping) => {
                    mappingId = createdmapping._id;
                    logger.debug('[Create mapping] Mapping created.', createdmapping);                    
                })
                .catch((errorcreate) => {
                    logger.error('[Create mapping] Error creating a mapping', errorcreate);                    
                });
            }

            /*            
            var tokenizer = 'http://35.202.67.147:5000/dc/' + event.message.text   
            logger.debug('[Main] pass tokenizer', {tokenizer: tokenizer});  

            var request = require('request');
            var textTokenizer = '';
            request(tokenizer, function(err, res, body) {  
                textTokenizer = body;
                event.message.text  = textTokenizer;
                logger.debug('[Main] pass tokenizer', {text:  event.message.text });  
            });
            */
            var recastrequest = new rc.request(configs.recastRequestToken);
            logger.debug('[Main] Conversation token', {recastConversToken: recastConversToken});            
                            
            recastrequest.converseText(event.message.text, { conversationToken: recastConversToken })
            .then(function (recast_response) {
                logger.debug('[ConversText] Response from Recast.',[
                    {mappingId: mappingId},
                    recast_response
                ]);

                // Save the Recast response
                RecastResult.create({
                    mappingId: mappingId,
                    responseMessage: recast_response,
                    createdDate: new Date().toJSON(),
                    modifiedDate: new Date().toJSON()
                })
                .then((createdRR) => {
                    logger.debug("[Create Recast Result] Created successfully.", createdRR);
                })
                .catch((errCreateRR) => {
                    logger.error("[Create Recast Result] Failed creating.", errCreateRR);
                });

                // Update conversation token back to the mapping 
                // and Set the converse token
                if (recastConversToken == null) {
                    Mapping.findById(mappingId)
                    .then((mappingtoupdate) => {
                        if(mappingtoupdate) {
                            logger.debug('[Find when null token] Found a mapping', mappingtoupdate);
                            customerDisplayName = mappingtoupdate.customerDisplayName;

                            Mapping.findByIdAndUpdate(mappingId, 
                                {$set: {conversationToken: recast_response.conversationToken}}, 
                                {new: true})
                            .then((affected) => {
                                // update the converse token
                                recastConversToken = affected.conversationToken;                                                                
                                logger.debug('[Find and update token] Mapping updated.', [
                                    {
                                        recastConversToken: recastConversToken
                                    },
                                    affected
                                ]);
                            })
                            .catch((errupdate) => {
                                logger.error('[Find and update token]', errupdate);
                            });
                        }
                        else {
                            logger.warn('[Find and update token] Mapping not found.');                            
                        }
                    })
                    .catch((errfind) => {
                        logger.erro('[Find when null token]', errfind);                        
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
                var isdone = false;

                //if(recast_response.action) {
                if (recast_response.action){
                    isdone = recast_response.action.done;
                } 
                var intent = recast_response.intents.slug;                        
                var actual_token = recast_response.conversationToken;

                // Call api tour    
                var entity = recast_response.entities;
                var memory = recast_response.memory;
                logger.info('[Main] Entity action date  ', [
                    entity,
                    {
                        intent: intent,
                        isdone: isdone,
                        actual_token: actual_token
                    }
                ]);

                logger.info('[Main] Memory action date ', [
                    memory,
                    {
                        intent: intent,
                        isdone: isdone,
                        actual_token: actual_token
                    }
                ]);

                // switch case read data
                if (configs.readrecast != 'memory') {
                    if (entity == null){
                        mockup_products = null
                    } 

                    var country = entity['country'] ? entity['country'][0] ? entity['country'][0]['value'] : null : null
                    var tourcode = entity['tourcode'] ? entity['tourcode'][0] ? entity['tourcode'][0]['value'] : null : null
                    var departuredate = entity['departure-date'] ? entity['departure-date'][0] ? entity['departure-date'][0]['value'] : null : null
                    var returndate = entity['returndate'] ? entity['returndate'][0] ? entity['returndate'][0]['value'] : null : null
                    var month = entity['month'] ? entity['month'][0] ? entity['month'][0]['value'] : null : null
                    var traveler = entity['traveler'] ? entity['traveler'][0] ? entity['traveler'][0]['value'] : null : null
                } else {
                    var country = memory['destination'] ? memory['destination'] ? memory['destination']['value'] : null : null
                    var tourcode = memory['tourcode'] ? memory['tourcode'] ? memory['tourcode']['value'] : null : null
                    var departuredate = memory['departure-date'] ? memory['departure-date'] ? memory['departure-date']['value'] : null : null
                    var returndate = memory['returndate'] ? memory['returndate'] ? memory['returndate']['value'] : null : null
                    var month = memory['month'] ? memory['month'] ? memory['month']['value'] : null : null
                    var traveler = memory['traveler'] ? memory['traveler'] ? memory['traveler']['value'] : null : null
                }
                
                // Construct the reply message
                // const apitour = require('../controllers/tourapicontroller');
                var mockup_products = null

                logger.debug('[API] Extracted values.', {
                    country:  country,
                    tourcode: tourcode,
                    departuredate: departuredate,
                    returndate: returndate,
                    month: month,
                    traveler: traveler
                });

                // if (country == null && departuredate == null && returndate == null && traveler == null){
                //     mockup_products = null
                // }
                
                var requestSuccess = false;
                var timeout = configs.apitimeout;
                
                //if (isdone == true && intent == 'tour-search') 
                // check condition get data from api
                if (country && departuredate && returndate && month && traveler)  {
                    var rpoptions = {
                        uri: configs.apiUrl,
                        qs: {
                            apikey: 'APImushroomtravel',
                            mode: 'loadproductchatbot',
                            lang: 'th',
                            pagesize: configs.apisizepage,
                            pagenumber: '1',
                            sortby: 'mostpopular',
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
                        logger.debug("[API Mockup] API Response:", repos);
                        mockup_products = repos;
                        //isdone = true;
                        requestSuccess = true;

                        // Update payload back to the mapping
                        var payload = tp.createApiPayload(intent, country, departuredate, returndate, month, tourcode);
                        dataGetAPI = payload
                        Mapping.findByIdAndUpdate(mappingId, 
                            {$set: {
                                apiPayload: payload, 
                                modifiedDate: new Date().toJSON()}
                            },
                            {new: true}
                        )
                        .then((updated) => {
                            logger.debug("[Update Payload] Mapping updated,", updated);
                        })
                        .catch((updateerr) => {
                            logger.error('[Update Payload] Error updating mapping.', updateerr);
                        });
                    })
                    .catch((error)=> {
                        //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                        logger.error("[Find to return api]", error);
                    });

                    while(true)
                    {
                        if (requestSuccess == true || timeout == 0) {
                            logger.debug('[Mockup Product] Arrived!!')                                
                            break;
                        }

                        logger.debug('[API Product] Waiting for product.', {
                            requestSuccess: requestSuccess,
                            timeout: timeout
                        });
                        require('deasync').sleep(500);
                        timeout -= 500;
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
                } else if (tourcode && departuredate && returndate && month && traveler) {
                    var rpoptions = {
                        uri: configs.apiUrl,
                        qs: {
                            apikey: 'APImushroomtravel',
                            mode: 'loadproductchatbot',
                            lang: 'th',
                            pagesize: configs.apisizepage,
                            pagenumber: '1',
                            sortby: 'mostpopular',
                            country_slug: '',
                            startdate: returndate,
                            enddate: departuredate,
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
                        logger.debug("[API Mockup] API Response:", repos);
                        mockup_products = repos;
                        //isdone = true;
                        requestSuccess = true;

                        // Update payload back to the mapping
                        var payload = tp.createApiPayload(intent, country, departuredate, returndate, month, tourcode);
                        dataGetAPI = payload
                        Mapping.findByIdAndUpdate(mappingId, 
                            {$set: {
                                apiPayload: payload, 
                                modifiedDate: new Date().toJSON()}
                            },
                            {new: true}
                        )
                        .then((updated) => {
                            logger.debug("[Update Payload] Mapping updated,", updated);
                        })
                        .catch((updateerr) => {
                            logger.error('[Update Payload] Error updating mapping.', updateerr);
                        });
                    })
                    .catch((error)=> {
                        //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                        logger.error("[Find to return api]", error);
                    });

                    while(true)
                    {
                        if (requestSuccess == true || timeout == 0) {
                            logger.debug('[Mockup Product] Arrived!!')                                
                            break;
                        }

                        logger.debug('[API Product] Waiting for product.', {
                            requestSuccess: requestSuccess,
                            timeout: timeout
                        });
                        require('deasync').sleep(500);
                        timeout -= 500;
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
                } else if (tourcode && month && traveler) {
                    var rpoptions = {
                        uri: configs.apiUrl,
                        qs: {
                            apikey: 'APImushroomtravel',
                            mode: 'loadproductchatbot',
                            lang: 'th',
                            pagesize: configs.apisizepage,
                            pagenumber: '1',
                            sortby: 'mostpopular',
                            country_slug: '',
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
                        logger.debug("[API Mockup] API Response:", repos);
                        mockup_products = repos;
                        //isdone = true;
                        requestSuccess = true;

                        // Update payload back to the mapping
                        var payload = tp.createApiPayload(intent, country, departuredate, returndate, month, tourcode);
                        dataGetAPI = payload
                        Mapping.findByIdAndUpdate(mappingId, 
                            {$set: {
                                apiPayload: payload, 
                                modifiedDate: new Date().toJSON()}
                            },
                            {new: true}
                        )
                        .then((updated) => {
                            logger.debug("[Update Payload] Mapping updated,", updated);
                        })
                        .catch((updateerr) => {
                            logger.error('[Update Payload] Error updating mapping.', updateerr);
                        });
                    })
                    .catch((error)=> {
                        //log.handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                        logger.error("[Find to return api]", error);
                    });

                    while(true)
                    {
                        if (requestSuccess == true || timeout == 0) {
                            logger.debug('[Mockup Product] Arrived!!')                                
                            break;
                        }

                        logger.debug('[API Product] Waiting for product.', {
                            requestSuccess: requestSuccess,
                            timeout: timeout
                        });
                        require('deasync').sleep(500);
                        timeout -= 500;
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
                    logger.debug('[API] No entity condition');                        
                }
                //}

                if (mockup_products == null) 
                {
                    intent = '-';
                }

                logger.debug('[Mockup product] Details:', mockup_products);

                //const linehelper = require('../controllers/LineMessageController');
                if (mockup_products != null) {
                    logger.debug('[Mockp products] Results:', {
                        success: mockup_products['success'], 
                        results: mockup_products['data']['results']
                    });
                    
                    if (mockup_products['success'] == 'True' && mockup_products['data']['results'] > 0){
                        reply_details = tp.templateAIMessage(intent, recast_response.conversationToken, '', recast_response.source, customerDisplayName, entity, memory);
                        // var reply_carousel = tp.templateCarousel(mockup_products, dataGetAPI);
                        var reply_carousel = tp.templateUrl(mockup_products, dataGetAPI);
                        messages.push(reply_details);
                        messages.push(reply_carousel);
                    } else {
                        reply_details = tp.templateAIMessage(intent, recast_response.conversationToken, recast_response.reply(), recast_response.source, customerDisplayName, entity, memory);
                        //replyToClient = tp.templateReply(recast_response.reply());
                        replyToClient = tp.templateReply('สำหรับโปรแกรมทัวร์ที่ลูกค้าสนใจ ตอนนี้เต็มแล้ว สนใจโปรแกรมอื่นไหมค่ะ');
                        messages.push(reply_details);
                        messages.push(replyToClient);
                    }
                } else {
                    reply_details = tp.templateAIMessage(intent, recast_response.conversationToken, recast_response.reply(), recast_response.source, customerDisplayName, entity, memory);
                    replyToClient = tp.templateReply(recast_response.reply());
                    messages.push(reply_details);
                    messages.push(replyToClient);
                }
                
                //if (replyToClient == null){
                reply_confirm = tp.templateConfirm(mappingId, '');
                // } else {
                //     reply_confirm = tp.templateConfirm(mappingId, replyToClient.text);
                // }
            
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
                logger.debug("[Main] Messages to be sent.", messages);

                var reservationId = '';

                Mapping.findById(mappingId)
                .then((senderMapping) => {
                    if(senderMapping) {
                        //reservationId = senderMapping.reservationId;
                        
                        logger.debug("[Find for sender] Found a mapping.", senderMapping);
                        
                        lineclient.pushMessage(configs.mapper, messages)
                        .then(() => {
                            // process after push message to Line
                            //handleError("[Push carousel] Carousel sent to the sender.", "DEBUG");
                            logger.debug("[Push messages] Messages sent.");
                            if (reply_carousel == null){
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(replyToClient)}},
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    //handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                    logger.debug("[Find to update reply] Mapping updated.", mappingUpdateReply);
                                })
                                .catch((errupdate) => {
                                    //handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                    logger.error("[Find to update reply] Error updating mapping.", errupdate);
                                });

                            } else {
                                Mapping.findByIdAndUpdate(mappingId, 
                                    {$set: {replyMessage: JSON.stringify(reply_carousel)}},
                                    {new: true})
                                .then((mappingUpdateReply) => {                                
                                    //handleError("[Find to update reply] Updated response mapping: " + mappingUpdateReply, "DEBUG");
                                    logger.debug("[Find to update reply] Mapping updated.", mappingUpdateReply);
                                })
                                .catch((errupdate) => {
                                    //handleError('[Find to update reply] ' + errupdate.stack, "ERROR");
                                    logger.error("[Find to update reply] Error updating a mapping.", errupdate);
                                });                                        
                            }
                            // Save the response back to the mapping -> replyMessage [JSON.stringify]                               
                        })
                        .catch((errPushCarousel) => {
                            // error handling
                            //handleError("[Push carousel] Push failed. " + errPushCarousel.stack, "ERROR");
                            logger.error("[Push Message] Error push message.", errPushCarousel);
                        });
                    }
                    else {
                        //handleError("[Find for sender] Mapping for sender not found", "WARNING");
                        logger.warning("[Find for sender] Mapping for sender not found");
                    }                    
                })
            }) // End then converstext
            .catch((errconverse) => {
                logger.error("[Converse Text] Error conversetext.", errconverse);                
            });
        }) // End then
        .catch((errfindone) => {            
            logger.error('[Find Mapping] Error finding a mapping.', errfindone);
        });
    }
}

module.exports = router;