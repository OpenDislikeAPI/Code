//import all the modules needed
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const {google} = require('googleapis');
const { createClient } = require('redis');
const { auth } = require('google-auth-library');
const { connect_db } = require('./db');
const Creator = require('./models/Creator');
const config = require('./config/config');
const { decrypt, encrypt } = require('./crypto');
var jwt = require('jsonwebtoken');
var ObjectID = require('mongodb').ObjectID;

//import fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

//connect to mongodb
connect_db()

//connect to redis
const redisClient = createClient({
    url: process.env.REDIS_URL
  });
(async () => {
  await redisClient.connect();
})();

    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('ready', () => console.log('Redis Client Connected'));


    // init google oauth client
    const oauth2Client = new google.auth.OAuth2(
    "896814890373-sa81ge5ttpf7uug7s1fs1u2sh7qap5h0.apps.googleusercontent.com",
    config.client_secret,
    "http://localhost:3000/oauth2/callback"
    );

  
    // main code

    app.get('/', async (req, res) => {
        res.send('Open Dislike API. More about it in https://github.com/OpenDislikeAPI/Code');
    });

    app.get('/auth', async (req, res) => {
        // generate a url that asks permissions for youtube socpes
       const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/yt-analytics.readonly'],
        });
        res.send(url); 
    });

    app.get('/oauth2/callback', async (req, res) => {
    
    const code = req.query.code;   // get the code from the query parameters
    
    oauth2Client.getToken(code, async (err, tokens) => {   // get the token using the code
        // set the credentials
        var authtoken = tokens;

    // get email
    const creator_email = jwt.decode(authtoken.id_token).email;

    // encrypt the refresh token
    const encrypted_refresh_token = encrypt(authtoken.refresh_token);
      
        // get youtube channel info
    const res_channel = await fetch(`https://youtube.googleapis.com/youtube/v3/channels?mine=true&part=id&access_token=${authtoken.access_token}`);
    const channel = await res_channel.json();
    const yt_channel_id = channel.items[0].id;


    var user = new Creator({
        cid: yt_channel_id.trim(),
        eid: creator_email,
        rt: encrypted_refresh_token,
    });

    user.save((err, user) => {
        if (err) {
            return res.send('Authentication failed!');
        } else {
            return res.send('You are now authenticated!');
        } 
    });
})
    });

    app.get('/api/dislike', async (req, res)=>{
    const {id, cid, key} = req.query;
    
    if(cid === undefined || id === undefined){
        return res.send('Please provide a key to access the API (?key=<apikey>) also provide a channel id (?cid=<channelid>) and a video id (?id=<videoid>)');
    }
    const get = await redisClient.get(id);
    

    if(get != null && get != undefined){
        return res.send(get)
    } else {
        // get the tokens and get the real dislike count from yt-api
        Creator.findOne({cid: cid}, async (err, user) => {
            if(err){
                return res.status(500).send('Error');
            }
            if(!user){
                return res.status(404).send('Channel not found?');
            }
            const refresh_token = await decrypt(user.rt);
            const oauth2Clientuser = new google.auth.OAuth2(
                "896814890373-7ibmr3u046f2chequok7ip4ar20dpuoo.apps.googleusercontent.com",
                config.client_secret,
                process.env.redirect_url
            );
            oauth2Clientuser.setCredentials({
                refresh_token: refresh_token,
            });

            const auth = await oauth2Clientuser.getRequestHeaders();
            // get youtube dislike count with analytics api
            const res_analytics = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?filters=video==${id}&endDate=2022-01-05&ids=channel==MINE&metrics=dislikes&dimensions=video&startDate=2005-01-01&access_token=${auth.Authorization.split(' ')[1]}`);
            const analytics = await res_analytics.json();
            const dislike_count = analytics.rows[0][1];
            res.status(200).send(dislike_count.toString());
            // save the dislike count in redis after sending the response
            await redisClient.set(id, dislike_count, {expire: 10800});
        })
    }

    });



app.listen(3000, () => {
    console.log('Server started on port http://localhost:3000');
});
