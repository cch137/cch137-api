import { config as dotenvConfig } from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import bodyParser from "@cch137/body-parser";

dotenvConfig();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());

app.set("trust proxy", true);
app.disable("x-powered-by");
app.use(bodyParser);

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(req.method, res.statusCode, req.originalUrl);
  });
  next();
});

process.on("uncaughtException", (error) => console.error(error));

export { app, server, wss };
