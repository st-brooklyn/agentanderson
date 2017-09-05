var mongoose = require('mongoose');
mongoose.createConnection('mongodb://admin:password@ds052649.mlab.com:52649/softsq_chatbot_database' ,{ useMongoClient: true });