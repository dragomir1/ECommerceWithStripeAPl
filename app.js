// require modules
const express = require('express');
const app = express();
const morgan = require('morgan');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const keys = require('./config/keys')
const stripe = require('stripe')('keys.stripeSecretKey');

// set up handlebars middleware
app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.set('views', path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname, './static')));

// set up morgan and bodyParser
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//remove the "decpreiated" message that appears in terminal when running server
mongoose.Promise = global.Promise;

// GET/POST logic
app.get('/', (req, res, next) => {
  res.render('index', {
    stripePublishableKey: keys.stripePublishableKey
  });
});

app.post('/charge', (req, res, next) => {
  const amount = 1000;
  stripe.customers.create({
    email: req.body.stripeEmail,
    source: req.body.stripeToken
  })
  .then(customer => stripe.charges.create({
    amount,
    currency: "usd",
    description: "text charge",
    customer: customer.id,
  }))
  .then(charge => res.render('success'));
});

// set up error messages if no routes exist to handle incoming requests
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: error.message
  });
});

// CORS override.  Allow access to server from different clients.
app.use((req, res, next) => {
  res.header('Acess-Control-Allow-Origin', '*');
  res.header('Acess-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.header('Acess-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});

// export app module to server
module.exports = app;
