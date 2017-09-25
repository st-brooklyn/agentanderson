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
                "text": 'ผู้ใหญ่(คู่): ' + boubleText + ' บาท\nผู้ใหญ่(เดี่ยว): ' + singleText + ' บาท'   ,
                "actions": [                
                    {
                        "type": "uri",
                        "label": "ดูรายละเอียด",
                        "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
                    }
                ] 
            };
        } else {
            var imageProduct = "http://210.4.150.197:8888/unsafe/filters:text(" +  product.product_name + ",25,395,black,28):text(" + product.product_code + ",60,525,red,20):text(" + product.stay_night + "วัน " + product.stay_night + "คืน,570,525,black,20):watermark(http://35.184.198.144:8000/unsafe/708x380/https://goo.gl/SsxmAV,0,0,0):watermark(" + product.url_airline_pic + ",315,525,0)/www.mushroomtravel.com/assets/images/01B.png"
            console.log("DEBUG: [ url use  thumbor ] : " + imageProduct);
            column = {
                //http://210.4.150.197:8888/unsafe/filters:text(%E0%B8%97%E0%B8%B1%E0%B8%A7%E0%B8%A3%E0%B9%8C%E0%B8%8D%E0%B8%B5%E0%B9%88%E0%B8%9B%E0%B8%B8%E0%B9%88%E0%B8%99%20%E0%B8%AE%E0%B8%AD%E0%B8%81%E0%B9%84%E0%B8%81%E0%B9%82%E0%B8%94%20%E0%B8%88%E0%B8%B4%E0%B9%82%E0%B8%81%E0%B8%81%E0%B8%B8%E0%B8%94%E0%B8%B2%E0%B8%99%E0%B8%B4%20%E0%B8%AA%E0%B8%A7%E0%B8%99%E0%B8%AB%E0%B8%A1%E0%B8%B5%E0%B9%82%E0%B8%8A%E0%B8%A7%E0%B8%B0%E0%B8%8A%E0%B8%B4%E0%B8%99%E0%B8%8B%E0%B8%B1%E0%B8%87%20,25,395,black,28):text(MUSH170702,60,525,red,20):text(6%E0%B8%A7%E0%B8%B1%E0%B8%99%204%E0%B8%84%E0%B8%B7%E0%B8%99,570,525,black,20):watermark(http://35.184.198.144:8000/unsafe/708x380/https://goo.gl/SsxmAV,0,0,0):watermark(www.mushroomtravel.com/assets/images/airlinelogo/thailionairlogo.jpg,315,525,0)/www.mushroomtravel.com/assets/images/01B.png
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
        "title": 'รายการเพิ่มเติม',
        "text": 'รายการเพิ่มเติม',
        "actions": [                
            {
                "type": "uri",
                "label": "ดูรายละเอียด",
                "uri": "https://www.mushroomtravel.com/search?q=" + payload.country
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
