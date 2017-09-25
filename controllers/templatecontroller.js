'use strict';
const configs = require('../data/config');

module.exports.templateCarousel = function(products, payload){
    var parsedProducts = products;
    var column = "";

    var carousel = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {   
            "type": "carousel",
            "columns": []
        }
    };

    parsedProducts.data.products.forEach((product) => {
        var periodText = "";
        var countPeriod = "";
        var boubleText = "";
        var singleText = "";

        console.log("DEBUG: [period price]: " + product.periods)

        product.periods.forEach((period) => {
            periodText += period.period_start + ' - ' + period.period_end + '\n'
            boubleText += period.price_adults_double 
            singleText += period.price_adults_single 
        });
        console.log("DEBUG: [Carousel for period] : " + periodText);

        if (product.url_pic == '') {
            product.url_pic = 'https://www.mushroomtravel.com/assets/images/share/thumb_default.jpg'
        }
        
        if (product.periods.length == 1){
            column = {
               "thumbnailImageUrl": product.url_pic.startsWith('https', 0) ? product.url_pic : product.url_pic.replace("http","https"),
                "title": periodText.substr(0, 50),
                "text": 'ผู้ใหญ่ (พักคู่)  ' + boubleText + '/nผู้ใหญ่ (พักเดี่ยว)  ' + singleText + '/n' ,
                "actions": [                
                    {
                        "type": "uri",
                        "label": "ดูรายละเอียด",
                        "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
                    }
                ] 
            };
        } else {
            column = {
                "thumbnailImageUrl": product.url_pic.startsWith('https', 0) ? product.url_pic : product.url_pic.replace("http","https"),
                "title": product.product_name.substr(0, 40),
                "text": periodText.substr(0, 50),
                "actions": [                
                    {
                        "type": "uri",
                        "label": "ดูรายละเอียด",
                        "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
                    },
                    // {
                    //     "type": "uri",
                    //     "label": "View Slide",
                    //     "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
                    // }
                ]
            };
        }
        carousel.template.columns.push(column);
    },
    this);

    console.log("DEBUG: [createProductCarousel] " + JSON.stringify(carousel));
    console.log("DEBUG: [payload] country: " + payload.country + " departuredate: " + payload.departuredate + " returndate: " + payload.returndate + " month: " + payload.month + " tourcode: " + payload.tourcode);

    var tourcode = ''
    var country = ''
    if (payload.tourcode == null){
        tourcode = ''  
    }
    if (payload.country == null){   
        country = ''
    }

    var column = {
        "thumbnailImageUrl": 'https://cdn.mushroomtravel.com/files/MUSH/Uploads/MainSlider/add-line%20%282%29.png',
        "title": 'search result',
        "text": 'search result',
        "actions": [                
            {
                "type": "uri",
                "label": "View detail",
                "uri": "https://www.mushroomtravel.com/search?q=" + country
            }
        ]
    };
    carousel.template.columns.push(column);

    return carousel;
}


module.exports.templateConfirm = function(mappingId, recastUuid){
    var confirm = {
        "type": "template",
        "altText": "this is a confirm template",
        "template": {
            "type": "confirm",
            "text": configs.predefinedMessages.confirmMessage,
            "actions": [
                {
                  "type": "postback",
                  "label": "Yes",
                  "data": '{"action": "qualify", "mappingId": "' + mappingId + '", "recastUuid": "' + recastUuid + '"}',
                },
                {
                  "type": "uri",
                  "label": "No",
                  "uri": "https://agentanderson.herokuapp.com/qualifier/disqualify/" + mappingId
                }
            ]
        }
    };

    console.log("DEBUG: [createConfirmation] " + JSON.stringify(confirm));

    return confirm;
}


module.exports.templateAIMessage = function(intent, converseToken, replyFromAi, sourceMessage, customerDisplayName){
    return {
        "type" : "text",
        "text" : 'ลูกค้า: \n' +  customerDisplayName + '\nคำถาม: \n' + sourceMessage
        //"text" : 'Source: ' + sourceMessage + '\nMessage: ' + replyFromAi + '\nIntent: ' + intent + '\nConverse Token: ' + converseToken
    };
}


module.exports.templateReply = function(replyFromAi){
    return {
        "type" : "text",
        "text" : replyFromAi
    };
}

module.exports.createApiPayload = (intent, country, departuredate, returndate, month, tourcode) => {
    return {
        intent: intent,
        country: country,
        departuredate: departuredate,
        returndate: returndate,
        month: month,
        tourcode: tourcode
    };
};
