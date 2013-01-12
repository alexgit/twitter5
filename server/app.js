
var OAuth = require('oauth').OAuth;
var fs = require('fs');

fs.readFile('keys-and-access-tokens.js', function(err, data) {
  if (err) throw err;

  var keys = JSON.parse(data);
  startServer(keys);
});


function startServer(keys) {
  var oAuth = new OAuth(
    "https://api.twitter.com/oauth/request_token",
    "https://api.twitter.com/oauth/access_token",
    keys.consumerKey,
    keys.consumerSecret,
    "1.0A", null, "HMAC-SHA1"
  );

  var getTimeline = function(since_id, callback) {

    var url = "https://api.twitter.com/1.1/statuses/home_timeline.json";

    if(since_id > 0) {
      url += '?since_id=' + since_id;
    }

    oAuth.get(url, keys.accessToken, keys.accessTokenSecret,
      function(err, data) {
        if(err) console.log(err)
        else callback(err, data)
      }
    );
  };

  var express = require("express");
  var app = express();

  app.get('/tweets/timeline/:since_id', function(req, res) {

    res.set('Content-Type', 'application/json');

    if(req.query.test) {
      res.send(req.query.callback + '([])');
    } else {
      getTimeline(req.params.since_id, function(err, data) {
        res.send(req.query.callback + '(' + data + ')');
      });
    }
  });

  app.listen(3000);
};





