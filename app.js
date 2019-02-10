const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const router_main = require(__dirname + '/routes/index');
const router_posts = require(__dirname + '/routes/posts');
// -----------------------------------------------------------
let con = mongoose.connect('mongodb://localhost:27017/blog', { useNewUrlParser: true });

const app = express();

global.__dir = __dirname;

// body-parser settings
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// pug template engine settings
app.set('view engine', 'pug');
app.set('views', './views');
app.locals.pretty = true;

// static file settings
app.use('/static', express.static(path.resolve(__dirname, './public'))); 

// router settigns
app.use('/', router_main);
app.use('/posts', router_posts);
app.use((req, res, next) => { // 404 error
  res.status(404).render('404error');
});

// server settings
app.listen(8080, () => {
  console.log('Listening Port 8080..');
});
