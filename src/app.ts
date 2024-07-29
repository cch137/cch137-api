import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import Jet from "@cch137/jet/index.js";
import getRequestIp from "@cch137/utils/server/get-request-ip.js";

const app = new Jet();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method?.toUpperCase() === "OPTIONS") {
    res.setHeader("Content-Length", "0");
    res.status(204).end();
  } else {
    next();
  }
});

app.use(Jet.bodyParser);

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      req.method,
      res.statusCode,
      req._url.toString(),
      `\x1b[34m${getRequestIp(req) || "local"}\x1b[0m`
    );
  });
  next();
});

process.on("uncaughtException", (error) => console.error(error));

export default app;
