var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/new', (req, res, next) => {
  res.render('users/new', {messages: req.flash()});
});

module.exports = router;
