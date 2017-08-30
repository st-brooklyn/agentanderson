var mongoose = require('mongoose');
var MappingSchema = new mongoose.Schema({    
    roomId: String,
    userId: String,
    conversationToken: String,
    createdDate: String,
    modifiedDate: String,
    originalMessage: String
});

mongoose.model('Mapping', MappingSchema);
module.exports = mongoose.model('Mapping');