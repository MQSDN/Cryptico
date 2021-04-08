'use strict';

// All Dependencies Set-up.
const express = require('express');
const superAgent = require('superagent');
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');
const app = express();
require('dotenv').config();


const PORT = process.env.PORT;


// MiddleWares
app.use(express.urlencoded({ extended: true }));
// app.use(express.static());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');


















//  PORT
app.listen(PORT, () => console.log('Listening to PORT ' + PORT));