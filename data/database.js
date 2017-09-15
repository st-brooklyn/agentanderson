var mongoose = require('mongoose');
mongoose.connect(require('./config').connectionDB, {useMongoClient: true,});
