import { config as dotenvConfig } from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import cors from 'cors'
import { WebSocketServer } from 'ws'

dotenvConfig()

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

app.use(cors());

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(express.json())
app.use(bodyParser.json())
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

export { app, server, wss }
