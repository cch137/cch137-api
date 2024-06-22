import { config as dotenvConfig } from "dotenv";
dotenvConfig();

import app from "./app.js";
import apis from "./routers/apis.js";
import wss from "./services/subdom/index.js";
import { run as runBots } from "./bots/index.js";

runBots();

app.use(apis);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`);
  if (wss) return 0;
});
