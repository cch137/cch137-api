import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import Jet from "@cch137/jet";
import getRequestIp from "@cch137/utils/server/get-request-ip.js";

const app = new Jet();

app.use(Jet.cors());
app.use(Jet.bodyParser);

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      req.method,
      res.statusCode,
      req.jetURL.href,
      `\x1b[34m${getRequestIp(req) || "local"}\x1b[0m`
    );
  });
  next();
});

process.on("uncaughtException", (error) => console.error(error));

export default app;
