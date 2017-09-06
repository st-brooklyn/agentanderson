'use strict';

const linebot = require('@line/bot-sdk');
const configfile = require('./data/config');

function LineHelper() {
    this.channel_access_token = configfile.lineChannelAccessToken;
    this.channel_secret = configfile.lineChannelSecret;
}

LineHelper.prototype.getUserDisplayName = (userId) => {
    const client = new linebot.Client({channelAccessToken: configfile.lineChannelAccessToken});
    client.getProfile(userId)
    .then((profile) => {
        return profile.displayName;
    })
    .catch((err) => {
        console.log("ERROR: [GetUserDisplayName] Failed to get the display name. " + err.stack);
        return userId;
    });
};

module.exports = LineHelper;