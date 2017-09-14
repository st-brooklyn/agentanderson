'use strict';
const rp = require('request-promise');
const configs = require('../data/config');

module.exports.searchtour = function(country, tourcode){
    var rpoptions = {
                        uri: configs.apiUrl,
                        qs: {
                            apikey: 'APImushroomtravel',
                            mode: 'loadproductchatbot',
                            lang: 'th',
                            pagesize: '2',
                            pagenumber: '1',
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
                    handleError("[API Mockup] Repos: " + JSON.stringify(repos), "DEBUG");
                    // mockup_products = repos;
                    // isdone = true;
                    return repos;
                })
                .catch((error)=> {
                    handleError('[Find to return api] ' + errupdate.stack, "ERROR");
                })
            

}