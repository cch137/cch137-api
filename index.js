const express = require('express');
const bodyParser = require('body-parser');


const app = express();
const server = require('http').createServer(app);
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', true);
require('dotenv').config();

// app.set('view engine', 'pug');
// app.engine('ejs', require('ejs').renderFile);
// app.locals.pretty = false;

module.exports = {
  app,
  server
}

require('./router');

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`);
});