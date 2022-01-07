# The OpenDislikeAPI Project

## Getting Dislikes Back For Youtube(TM), cause time is precious to at least not waste on junk.

> Inspired by a video by Linus Tech Tips https://youtu.be/Nz9b0oJw69I?t=340
> 

I plan to make a Nodejs API to get the dislike data from Creators such as [Linus Tech Tips](https://www.youtube.com/c/LinusTechTips), [MrBeast](https://www.youtube.com/c/MrBeast6000),
[Mark Rober](https://www.youtube.com/c/MarkRober) and many other creators would like to care for their viewers and share their Youtube(TM) Analytics data with Google's OAuth.

As Linus said in his [video](https://youtu.be/Nz9b0oJw69I?t=340) **creators can help**, so let's hope they do their part :)
Also, he said, it gets pretty shady pretty fast, we are making this thing open source so at least it gets... ah, less shady I guess? also you can view our code and check what we collect and understand why we collect. We plan to make it in such a way that it becomes easy for anyone to sign up and basically no maintenance is needed after that.

# Plan

### Security
You: do you really expect me to belive you?
Me: Yes.
You: tf why?
Me: 1) read the last part of the readme
    2) I really don't get access to your data, only the server does. To be clear, I can still view the refresh tokens, but its useless? why you ask? cause its encrypted by a key i don't know as its provided by a third party like the RYD or LTT or any other company or individiual a vote decides.


### How will this work?

So basically the code would get the real stats from Youtube (or our database, whichever fresh or fresh enough to prevent us hitting rate limits) when any video from a YouTuber signed up with us is requested. We would use this method from the youtube API [https://developers.google.com/youtube/analytics/metrics#dislikes](https://developers.google.com/youtube/analytics/metrics#dislikes) (for that we would need the following scopes as told by docs: `https://www.googleapis.com/auth/youtubepartner`, `https://www.googleapis.com/auth/youtube`, `https://www.googleapis.com/auth/yt-analytics.readonly`) to get the dislikes to count for that specific video, also we would asynchronously store that value against the videoID in our database.

### Ok, we got the data, what next?

Now, we would store the data we needed i.e. the dislikes count in our [Redis](https://redis.io/) Cache. 

Why [Redis](https://redis.io/)? Well, It’s free, fast and fits what we are doing. I thought to use [MongoDB](https://en.wikipedia.org/wiki/MongoDB) for everything as my other projects such as [Dogegram](https://dogegram.xyz) *(wink wink, sign up for that too now)* use it but I thought it might be an overkill to store just a JSON object containing just two to three items.

We would still use [MongoDB](https://en.wikipedia.org/wiki/MongoDB) for storing the access token for the creators.

### Well enough, what would you store about the creators?

Nothing much. Just the basic things we need. 

Heres’ a list of things we might store about the creator along with the reason why we might need it:

- Dislikes: That’s the main thing we are doing this all for
- Email: We would need that for informing you about the changes in service if any occur in future
- Youtube Channel ID: For making the request to the API
- Google OAuth Access Token: For Authentication with Google
- Account-Related Metadata (such as channel name, : For identification purposes.
- Anything else? I don’t remember one as of now.

### Why do I trust you?

You can trust me for the following reasons:

- Pinky Promise
- Also I don't get access to your data as its encrypted in storage (the refresh token) with a key i don't know (more about it at the 'Security' part)
- The data you provide is pretty useless for me to cause any harm to you or your channel (most i could do is maybe share it with advertisers you lied to about your stats)
- The code is open source, hence, anyone can “peer review” it
- The server is hosted on railway.app. Any creator who wants to audit can come and email me on dislike@dogegram.xyz
- I am just a 14-year-old dev, not Google or Facebook who would track you nor someone evil.
- Also I would give a few big creators the ability to audit whats running on the servers at any moment.

I heard that the data from the API does contain some stuff other than the dislike and like count that might be of certain business interest. Again I say, you don't need to trust me that I am not taking your data, I can't genrate a access token hence can't take your data either. I am just taking the dislike count and distributing it to everyone in need such as the RYD extensions and servers, so you just need to share the data and permissions with only one app and only one.

I thought about getting the dislike data from sources other than the official API, using a method similar to whats told in https://github.com/Anarios/return-youtube-dislike/issues/392 of the RYD Repo but it’s too much work for creators and easy to be abused and also as [https://github.com/Anarios/return-youtube-dislike/issues/396#issuecomment-1003646970](https://github.com/Anarios/return-youtube-dislike/issues/396#issuecomment-1003646970) suggested, its just isn’t viable.

<aside>
:computer: Willing to contribute? Thanks! You can make a PR and I would check it out!
</aside>

###### Better formatted version on Notion: https://dogegram.notion.site/OpenDislikeAPI-b83df4347bca43b6a7c1b64acfb7a7f8
