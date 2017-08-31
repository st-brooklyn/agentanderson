'use strict';

// const line = require('@line/bot-sdk');
// const express = require('express');

// var channel_access_token = '';
// var channel_secret = '';

// //const config = {
// //    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
// //    channelSecret: process.env.CHANNEL_SECRET,
// //};

// const config = {
//     channelAccessToken: channel_access_token,
//     channelSecret: channel_secret,
// };

// const client = new line.Client(config);

// const app = express();

// app.post('/webhook', line.middleware(config), (req, res) => {
//     Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
// });

// function handleEvent(event) {
//     if (event.type !== 'message' || event.message.type !== 'text') {
//         return Promise.resolve(null);
//     }
// }

// var router = express.Router();
// var bodyParser = require('body-parser');
// router.use(bodyParser.urlencoded({ extended: true }));

// var Mapping = require('../models/mapping');

// router.post('/getmessage', function (req, res) {
//     // extract the line object


    
// });

function createProductCarousel(products) {
    var parsedProducts = JSON.parse(products);
    
    var carousel = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {
            "type": "carousel",
            "columns": []
        }
    };

    parsedProducts.data.products.forEach(function(product) {
        var column = {
            "thumbnailImageUrl": product.url_pic,
            "title": product.product_name,
            "text": product.highlight,
            "actions": [                
                {
                    "type": "uri",
                    "label": "View detail",
                    "uri": product.tourdetail
                },
                {
                    "type": "uri",
                    "label": "View Slide",
                    "uri": product.itemslide
                }
            ]
          };

          carousel.template.columns.push(column);
    }, this);

    console.log("DEBUG: " + JSON.stringify(carousel));

    return JSON.parse(carousel);
}

function createConfirmation(intent, converseToken, mappingId) {
    var confirm = {
        "type": "template",
        "altText": "this is a confirm template",
        "template": {
            "type": "confirm",
            "text": "Message correct?",
            "actions": [
                {
                  "type": "uri",
                  "label": "Yes",
                  "url": "https://agentanderson.herokuapp.com/qualify/" + mappingId
                },
                {
                  "type": "uri",
                  "label": "No",
                  "url": "https://agentanderson.herokuapp.com/disqualify/" + mappingId
                }
            ]
        }
    };

    console.log("DEBUG: " + JSON.stringify(confirm));

    return JSON.parse(confirm);
}





module.exports = router;