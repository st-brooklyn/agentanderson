module.exports = {
    mapper: 'U5753269d897c7a610ad81fbe741806c6',
    lineChannelAccessToken: 'dIZf/b/ZabUO0IafFmPxBvcG9xPKQXtGZ6wClV70CCqTwV1TJDT1m58rdm3pko08nIimFRk5wmcElbc7mF9ZXkntG7goq5NDifdSJBkGLyReznHswZuhR77uOYc9ryJIVAfhouccWFwtKMIMucBXpQdB04t89/1O/w1cDnyilFU=',
    lineChannelSecret: '912ad53b5e85ed684a9c52ac621d77e9',
    apiUrl: 'http://apitest.softsq.com:9001/JsonSOA/getdata.ashx',
    recastRequestToken: '1307df439794fa6122aa0f939f7d4c58',
    connectionDB: 'mongodb://admin:password@ds052649.mlab.com:52649/softsq_chatbot_database',
    //connectionDB: 'mongodb://chatbot_app:SoftSQ#2017@apitest.softsq.com:27017/softsq_chatbot',
    apitimeout: 10000,
    loglevel: 'silly',
    botmapping: {
        default:  {
            channelAccessToken: 'dIZf/b/ZabUO0IafFmPxBvcG9xPKQXtGZ6wClV70CCqTwV1TJDT1m58rdm3pko08nIimFRk5wmcElbc7mF9ZXkntG7goq5NDifdSJBkGLyReznHswZuhR77uOYc9ryJIVAfhouccWFwtKMIMucBXpQdB04t89/1O/w1cDnyilFU=',
            channelSecret: '912ad53b5e85ed684a9c52ac621d77e9'
        },
        user01: {
            channelAccessToken: 'dIZf/b/ZabUO0IafFmPxBvcG9xPKQXtGZ6wClV70CCqTwV1TJDT1m58rdm3pko08nIimFRk5wmcElbc7mF9ZXkntG7goq5NDifdSJBkGLyReznHswZuhR77uOYc9ryJIVAfhouccWFwtKMIMucBXpQdB04t89/1O/w1cDnyilFU=',
            channelSecret: '912ad53b5e85ed684a9c52ac621d77e9'
        }
    },
    predefinedMessages: {
        confirmMessage: 'คำตอบที่ต้องการส่งหาลูกค้า?',
        confirmSuccess: 'ส่งข้อความสำเร็จแล้ว',
        confirmFailure: 'ข้อความส่งไม่สำเร็จ'
    },
    apisizepage: 3,
    readrecast: 'memory'

}