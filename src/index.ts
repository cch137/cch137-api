import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import { app, server } from "./server";
import apis from "./routers/apis";
import wss from "./services/subdom";
import { run as runBots } from "./bots";

runBots();

app.use("/", apis);
app.use("*", (req, res) => res.status(404).end());

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`);
  if (wss) return 0;
});
