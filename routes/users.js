var express = require('express');
var request = require('request');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  console.log("PARAMATERS",req.params)
  res.render('users',{ title: 'USERS',id:req.params.id });
})


module.exports = router;
