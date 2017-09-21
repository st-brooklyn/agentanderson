'use strict';
const configs = require('../data/config');

module.exports.templateCarousel = function(products){
    var parsedProducts = products;

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
        product.periods.forEach((period) => {
            periodText += period.period_start + ' - ' + period.period_end + '\n'
        });
        console.log("DEBUG: [Carousel for period] : " + periodText);

        if (product.url_pic == '') {
            product.url_pic = 'https://www.mushroomtravel.com/assets/images/share/thumb_default.jpg'
        }
        var column = {
            "thumbnailImageUrl": product.url_pic.startsWith('https', 0) ? product.url_pic : product.url_pic.replace("http","https"),
            "title": "[[seat]]" + product.product_name.substr(0, 40),
            "text": periodText.substr(0, 50),
            "actions": [                
                {
                    "type": "uri",
                    "label": "View detail",
                    "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
                },
                // {
                //     "type": "uri",
                //     "label": "View Slide",
                //     "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
                // }
            ]
        };

          carousel.template.columns.push(column);
    }
    
    // Add another default card here
    ,
    this);

    console.log("DEBUG: [createProductCarousel] " + JSON.stringify(carousel));

    return carousel;
}


module.exports.templateConfirm = function(mappingId, replyToClient, recastUuid){
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
