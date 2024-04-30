const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  const user = req.user;
  console.log('🚀 ~ user:', user)

  res.render('index', { title: 'Line Login', user });
});

module.exports = router;