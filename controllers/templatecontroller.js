'use strict';
const configs = require('../data/config');
const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

module.exports.templateUrl = function(products, payload){
    let URLReturn = "";
    let parsedProducts = products;
    let column = "";
    parsedProducts.data.products.forEach((product) => {
        URLReturn += "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug + "\n"
    });
    console.log("DEBUG: [templateUrl] : " + URLReturn);
    
    return {
        "type" : "text",
        "text" : URLReturn
    };
}

module.exports.templateCarousel = function(products, payload){
    let parsedProducts = products;
    let column = "";

    let carousel = {
        "type": "template",
        "altText": "this is a carousel template",
        "template": {   
            "type": "carousel",
            "columns": []
        }
    };

    function convertperiod(date) {
        const regex = /(\d*) (.+\D) (\d*)/g;
        let m;

        while ((m = regex.exec(date)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            let convertedmonth = padL(months.indexOf(m[2]) + 1, 2);
            let converted = m[3] + convertedmonth + padL(m[1], 2);
            //console.log('converted: ' +converted);
            return { sum: converted, month: m[2], day: m[1], year:[3] };

            // The result can be accessed through the `m`-variable.
            //m.forEach((match, groupIndex) => {
            //    console.log(`Found match, group ${groupIndex}: ${match}`);
            //});
        }       
    }

    function padL(a, b, c) {//string/number,length=2,char=0
        return (new Array(b || 2).join(c || 0) + a).slice(-b);
    }

    parsedProducts.data.products.forEach((product) => {
        let periodText = "";
        let countPeriod = "";
        let boubleText = "";
        let singleText = "";

        console.log("DEBUG: [Carousel for period] : " + periodText);

        if (product.url_pic == '') {
            product.url_pic = 'https://www.mushroomtravel.com/assets/images/share/thumb_default.jpg'
        }
        
        if (product.periods.length == 1){
            boubleText += product.periods[0].price_adults_double; 
            singleText += product.periods[0].price_adults_single;

            column = {
               "thumbnailImageUrl": product.url_pic.startsWith('https', 0) ? product.url_pic : product.url_pic.replace("http","https"),
                "title": 'ผู้ใหญ่(คู่): ' + boubleText + ' บาท\nผู้ใหญ่(เดี่ยว): ' + singleText + ' บาท' ,
                "text": product.product_name.substr(0, 40) ,
                "actions": [                
                    {
                        "type": "uri",
                        "label": "ดูรายละเอียด",
                        "uri": "https://www.mushroomtravel.com/tour/outbound/" + product.country_slug + "/" + product.product_code + "-" + product.product_slug
                    }
                ] 
            };
        } else {
            let parsed_periods = [];

            product.periods.forEach((period) => {
                periodText += period.period_start + ' - ' + period.period_end + '\n';

                parsed_periods.push({
                    start: period.period_start,
                    end: period.period_end,
                    calcStart: convertperiod(period.period_start),
                    calcEnd: convertperiod(period.period_end)
                });
            });

            let displayperiod = generatePeriodDisplay(parsed_periods);

            let imageProduct = "http://210.4.150.197:8888/unsafe/filters:text(" +  product.product_name + ",25,395,black,28):text(" + product.product_code + ",60,525,red,20):text(" + product.stay_night + "วัน " + product.stay_night + "คืน,570,525,black,20):watermark(http://35.184.198.144:8000/unsafe/708x380/https://goo.gl/SsxmAV,0,0,0):watermark(" + product.url_airline_pic + ",315,525,0)/www.mushroomtravel.com/assets/images/01B.png"
            console.log("DEBUG: [ url use  thumbor ] : " + imageProduct);
            column = {
                //http://210.4.150.197:8888/unsafe/filters:text(%E0%B8%97%E0%B8%B1%E0%B8%A7%E0%B8%A3%E0%B9%8C%E0%B8%8D%E0%B8%B5%E0%B9%88%E0%B8%9B%E0%B8%B8%E0%B9%88%E0%B8%99%20%E0%B8%AE%E0%B8%AD%E0%B8%81%E0%B9%84%E0%B8%81%E0%B9%82%E0%B8%94%20%E0%B8%88%E0%B8%B4%E0%B9%82%E0%B8%81%E0%B8%81%E0%B8%B8%E0%B8%94%E0%B8%B2%E0%B8%99%E0%B8%B4%20%E0%B8%AA%E0%B8%A7%E0%B8%99%E0%B8%AB%E0%B8%A1%E0%B8%B5%E0%B9%82%E0%B8%8A%E0%B8%A7%E0%B8%B0%E0%B8%8A%E0%B8%B4%E0%B8%99%E0%B8%8B%E0%B8%B1%E0%B8%87%20,25,395,black,28):text(MUSH170702,60,525,red,20):text(6%E0%B8%A7%E0%B8%B1%E0%B8%99%204%E0%B8%84%E0%B8%B7%E0%B8%99,570,525,black,20):watermark(http://35.184.198.144:8000/unsafe/708x380/https://goo.gl/SsxmAV,0,0,0):watermark(www.mushroomtravel.com/assets/images/airlinelogo/thailionairlogo.jpg,315,525,0)/www.mushroomtravel.com/assets/images/01B.png
                "thumbnailImageUrl": product.url_pic.startsWith('https', 0) ? product.url_pic : product.url_pic.replace("http","https"),
                "title": product.product_name.substr(0, 40),
                //"text": periodText.substr(0, 50),
                "text": displayperiod.substr(0, 50),
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

    function generatePeriodDisplay(parsed_periods) {
        // Sort the parsed period by the sum
        parsed_periods.sort((a, b) => { return a.calcStart.sum - b.calcStart.sum });
        
        // Select distinct months
        let uniques = [...new Set(parsed_periods.map(item => item.calcStart.month))];

        let display = [];
        
        for (let i = 0; i < uniques.length; i++) {
            
            // Select only the period start having the same current month
            let selecteds = parsed_periods.filter((p) => {
                return p.calcStart.month == uniques[i];
            });
    
            let item = {
                month: uniques[i],
                dates: ''
            };

            // Build the text for the same start month    
            for (let j = 0; j < selecteds.length; j++) {
                let dd = selecteds[j];
    
                // insert a "/" for the next item
                if (j > 0) {
                    item.dates += " / ";
                }
    
                // the same month, display only dates
                if (parseInt(dd.calcStart.day) < parseInt(dd.calcEnd.day)) {
                    item.dates += dd.calcStart.day + "-" + dd.calcEnd.day;
                }
                else {
                    // different months, include period_end month
                    item.dates += dd.calcStart.day + "-" + dd.calcEnd.day + " " + dd.calcEnd.month;
                }
            }
    
            display.push(item);
        }

        // Example: display
        // [ { month: 'ก.ค.', dates: '30-5 ส.ค.' },
        // { month: 'พ.ย.', dates: '1-12 / 12-18' },
        // { month: 'ธ.ค.', dates: '28-5 ม.ค.' },
        // { month: 'ก.พ.', dates: '5-15' } ]

        let periodText2 = "";

        // Convert the display array into the display text
        // ::Example::
        // ก.ค.  30-5 ส.ค.
        // พ.ย.  1-12 / 12-18
        // ธ.ค.  28-5 ม.ค.
        // ก.พ.  5-15
        display.forEach((dp) => {
            if (periodText2) periodText2 += "\n";

            periodText2 += dp.month + "  " + dp.dates;
        });

        return periodText2;
    }

    console.log("DEBUG: [createProductCarousel] " + JSON.stringify(carousel));
    console.log("DEBUG: [payload] country: " + payload.country + " departuredate: " + payload.departuredate + " returndate: " + payload.returndate + " month: " + payload.month + " tourcode: " + payload.tourcode);

    let defaultcolumn = {
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
    carousel.template.columns.push(defaultcolumn);

    return carousel;
}

module.exports.templateConfirm = function(mappingId, recastUuid){
    let confirm = {
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

module.exports.templateAIMessage = function(intent, converseToken, replyFromAi, sourceMessage, customerDisplayName, entity, memory){
    if (configs.readrecast != 'memory'){

        // var country = entity['country'] ? entity['country'][0] ? entity['country'][0]['value'] : null : null
        // var tourcode = entity['tourcode'] ? entity['tourcode'][0] ? entity['tourcode'][0]['value'] : null : null
        // var departuredate = entity['departure-date'] ? entity['departure-date'][0] ? entity['departure-date'][0]['value'] : null : null
        // var returndate = entity['returndate'] ? entity['returndate'][0] ? entity['returndate'][0]['value'] : null : null
        // var month = entity['month'] ? entity['month'][0] ? entity['month'][0]['value'] : null : null
        // var traveler = entity['traveler'] ? entity['traveler'][0] ? entity['traveler'][0]['value'] : null : null

        return {
            "type" : "text",
            "text" : 'Res: \n' +  customerDisplayName + '\nคำถาม: \n' + sourceMessage + '\nIntent: \n' + intent + '\nEntity: ' +  JSON.stringify(entity)
            //"text" : 'Res: \n' +  customerDisplayName + '\nคำถาม: \n' + sourceMessage + '\nIntent: \n' + intent + '\nEntity: Country:' + country + '\nTourCode:' + tourcode + '\nDeparturedate: ' + departuredate + '\nReturndate: ' + returndate + '\nMonth: ' + month
            //"text" : 'Source: ' + sourceMessage + '\nMessage: ' + replyFromAi + '\nIntent: ' + intent + '\nConverse Token: ' + converseToken
        };
    } else {

        var country = memory['destination'] ? memory['destination'] ? memory['destination']['value'] : null : null
        var tourcode = memory['tourcode'] ? memory['tourcode'] ? memory['tourcode']['value'] : null : null
        var departuredate = memory['departure-date'] ? memory['departure-date'] ? memory['departure-date']['value'] : null : null
        var returndate = memory['returndate'] ? memory['returndate'] ? memory['returndate']['value'] : null : null
        var month = memory['month'] ? memory['month'] ? memory['month']['value'] : null : null
        var traveler = memory['traveler'] ? memory['traveler'] ? memory['traveler']['value'] : null : null
        return {
            "type" : "text",
            "text" : 'Res: \n' +  customerDisplayName + '\nคำถาม: \n' + sourceMessage + '\nIntent: \n' + intent + '\nEntity: Country:' + country + '\nTourCode:' + tourcode + '\nDeparturedate: ' + departuredate + '\nReturndate: ' + returndate + '\nMonth: ' + month
            //"text" : 'Source: ' + sourceMessage + '\nMessage: ' + replyFromAi + '\nIntent: ' + intent + '\nConverse Token: ' + converseToken
        };
    }
    // return {
    //     "type" : "text",
    //     "text" : 'ลูกค้า: \n' +  customerDisplayName + '\nคำถาม: \n' + sourceMessage
    //     //"text" : 'Source: ' + sourceMessage + '\nMessage: ' + replyFromAi + '\nIntent: ' + intent + '\nConverse Token: ' + converseToken
    // };
}

module.exports.templateReply = function(replyFromAi){
     console.log("DEBUG: [Reply AI] " + replyFromAi);

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
