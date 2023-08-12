import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { config } from 'dotenv';

config();

const app = express();
const server = http.createServer(app);

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.on('end', () => {
    console.log(req.method, res.statusCode, req.originalUrl)
  })
  next();
});

// app.set('view engine', 'pug');
// app.locals.pretty = false;

process.on('uncaughtException', (error) => console.error(error))

export { app, server };
