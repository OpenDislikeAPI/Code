//import all the modules needed
const express = require("express");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const app = express();
const { google } = require("googleapis");
const { createClient } = require("redis");
const { connect_db } = require("./db");
const Creator = require("./models/Creator");
const config = require("./config/config");
const fs = require("fs");
const path = require("path");
const { decrypt, encrypt } = require("./crypto");
const jwt = require("jsonwebtoken");
const { cfupdate } = require("./cloudflare/update-list");
const ms = require("ms");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
var cloudflareIps = JSON.parse(
  fs.readFileSync("./cloudflare/ips.json", "utf8")
);
Sentry.init({
  dsn: "https://ceb1cd8d2241419abfa643d56952be1c@o1111480.ingest.sentry.io/6140762",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

setInterval(async () => {
  const checkforupdate = await cfupdate();
  if (checkforupdate) {
    console.log("Cloudflare IP list updated");
  } else {
    console.log("No updates to cloudflare IP list");
  }
}, ms("1day"));

//connect to mongodb
(async () => {
  connect_db();
})();

//connect to redis
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

(async () => {
  await redisClient.connect();
})();

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("ready", () => {
  console.log("Redis Client Connected");
});

// trust cloudflare and railway proxy (only for production)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", ["loopback", ...cloudflareIps]);
}

// init google oauth client
const oauth2Client = new google.auth.OAuth2(
  "896814890373-sa81ge5ttpf7uug7s1fs1u2sh7qap5h0.apps.googleusercontent.com",
  config.client_secret,
  `${process.env.DOMAIN || "http://localhost:3000"}/oauth2/callback`
);

var deploy_id;
// get the deploy id
if (process.env.ENVIORMENT === "production") {
  deploy_id = fs.readFileSync(path.join(__dirname, "deploy_id"), "utf8");
} else {
  deploy_id = "dev";
}

// main code

app.use((req, res, next) => {
  if (process.env.ENVIORMENT === "production") {
    if (
      req.hostname != "dislike.hrichik.xyz" && // if the hostname is not the main domain
      req.headers["x-forwarded-for"] != '34.83.55.32' // railway backend ip should be allowed
    ) {
      console.count("evil-people-trying-to-find-internal-domain");
      console.log("ip:", req.ip);
      console.log("useragent:", req.headers["user-agent"]);
      return res.sendStatus(404);
    } else {
      next();
    }
  } else {
    next();
  }
});

app.get("/", async (req, res) => {
  res.redirect("https://dislikes.hrichik.xyz");
  if (req.headers["x-forwarded-for"] != '34.83.55.32') {
    console.count("curious-people-redirected-to-homepage");
  }
});

app.get("/auth", async (req, res) => {
  // generate a url that asks permissions for youtube socpes
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    prompt: "consent",
  });
  res.redirect(url);
  console.count("people-who-tried-authenticating");
});

app.get("/oauth2/callback", async (req, res) => {
  const code = req.query.code; // get the code from the query parameters

  oauth2Client.getToken(code, async (err, tokens) => {
    // get the token using the code
    // set the credentials
    var authtoken = tokens;

    try {
      // get email
      const creator_email = jwt.decode(authtoken.id_token).email;

      // encrypt the refresh token
      const encrypted_refresh_token = encrypt(authtoken.refresh_token);

      // get youtube channel info
      const res_channel = await fetch(
        `https://youtube.googleapis.com/youtube/v3/channels?mine=true&part=id&access_token=${authtoken.access_token}`
      );
      const channel = await res_channel.json();
      const yt_channel_id = channel.items[0].id;

      var user = new Creator({
        cid: yt_channel_id.trim(),
        eid: creator_email,
        rt: encrypted_refresh_token,
      });

      user.save((err, user) => {
        if (err) {
          res.redirect(
            "https://dislikes.hrichik.xyz/Authenticatication-Failed-ODA-4b4b418c8fbd4c0aade034fdba7c5a6b",
            302
          );
          console.count("users-authenticatication-failed");
        } else {
          res.redirect(
            "https://dislikes.hrichik.xyz/You-Are-Authenticated-ODA-b2075ccb642a447188c2934fed2cb8bf",
            302
          );
          console.count("users-authenticated");
        }
      });
    } catch (err) {
      throw new Error(err);
    }
  });
});

app.get("/api/dislike", async (req, res) => {
  const { id, cid, key } = req.query; // get the ids from the query parameters
  if (cid === undefined || id === undefined) {
    // check if the ids are provided
    return res
      .status(200)
      .send(
        "Please provide a key to access the API key (?key=<apikey>) also provide a channel id (?cid=<channelid>) and a video id (?id=<videoid>)"
      ); // if not return an error
  }
  const get = await redisClient.get(id);
  if (get != null && get != undefined) {
    const d = get.split(":");
    res.header(
      "Cloudflare-CDN-Cache-Control",
      "public, max-age=1200, stale-if-error=10800"
    );
    res.status(200).send({ dislikes: d[0], likes: d[1] });
    console.count("cache-fetch");
    console.count("requests-processed");
  } else {
    // get the tokens and get the real dislike count from yt-api
    Creator.findOne({ cid: cid }, async (err, user) => {
      if (err) {
        return res.status(500).send("Error");
      }
      if (!user) {
        return res.status(404).send("Channel not found?");
      }
      const refresh_token = await decrypt(user.rt);
      const oauth2Clientuser = new google.auth.OAuth2(
        "896814890373-sa81ge5ttpf7uug7s1fs1u2sh7qap5h0.apps.googleusercontent.com",
        config.client_secret,
        process.env.redirect_url
      );
      oauth2Clientuser.setCredentials({
        refresh_token: refresh_token,
      });

      const auth = await oauth2Clientuser.getRequestHeaders();
      // get youtube dislike count with analytics api
      const res_analytics = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?filters=video==${id}&endDate=2099-01-01&ids=channel==MINE&metrics=dislikes,likes&dimensions=video&startDate=2005-01-01&access_token=${
          auth.Authorization.split(" ")[1]
        }`
      );
      const analytics = await res_analytics.json();
      const dislike_count = analytics.rows[0][1];
      const like_count = analytics.rows[0][2];
      res.status(200).send({ dislikes: dislike_count, likes: like_count });
      console.count("youtube-fetch");
      console.count("requests-processed");
      // save the dislike count in redis after sending the response
      await redisClient.set(id, `${dislike_count}:${like_count}`);
      await redisClient.expire(id, 10800);
    });
  }
});

app.get("/brainfry/verify", async (req, res) => {
  const token = jwt.sign({ time: Date.now() }, config.rsa_private_key, {
    algorithm: "RS256",
  });
  res.send(token);
  console.count("paranoid-people-consoled"); // get it? consoled... logged with console.count... ?? ah leave it, i am so un-funny...
});

app.get("/fine", async (req, res) => {
  res.status(200).send("fine");
});

app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
  res.statusCode = 500;
  res.end(res.sentry + "\nErrorID");
  console.count("errors-logged");
  console.log("error-trace-id: ", res.sentry);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on: https://${"dislike.hrichik.xyz"}`);
  console.log(`Deploy id: ${deploy_id}`);
  console.log(`fire me the requests! I am ready ;)`);
});
