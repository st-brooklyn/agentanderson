var mongoose = require('mongoose');
var MappingSchema = new mongoose.Schema({    
    roomId: String,
    userId: String,
    customerId: String,
    conversationToken: String,
    createdDate: String,
    modifiedDate: String,
    originalMessage: String,
    replyMessage: String,
    fullMessage: String,
    action: String
});

mongoose.model('Mapping', MappingSchema);
module.exports = mongoose.model('Mapping');