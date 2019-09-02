var express = require('express');
var request = require('request');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('index');
  res.sendfile('index.html');
});

router.get('/config', function (req, res, next) {
  return res.json({ env: process.env.NODE_ENV });
});

router.get('/word', function(req, res, next) {
  var url = 'http://api.wordnik.com:80/v4/word.json/';
  var wordDef = req.query.word + '/definitions?';
  var stuff = 'limit=1&includeRelated=true&useCanonical=false&includeTags=false';
  var wordRequest = url + wordDef + stuff + '&api_key=' + process.env.APIKEY;
  request(wordRequest, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      res.json(JSON.parse(response.body));
    } else {
      res.json({ 'length': 0, 'word': req.query.word });
    }
  });
});

// router.get('/word', function (req, res, next) {
//   var url = 'http://localhost:8080/api/words/';
//   var wordDef = req.query.word + '/check';
//   var wordRequest = url + wordDef;
//   request(wordRequest, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//       res.json(JSON.parse(response.body));
//     } else {
//       res.json({ 'length': 0, 'word': req.query.word });
//     }
//   });
// });

module.exports = router;
