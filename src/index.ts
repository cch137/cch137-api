import { config as dotenvConfig } from 'dotenv'
import { app, server } from './server.js';
import router from './apis.js';
import cors from 'cors';

app.use(cors());

dotenvConfig()

router()

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`);
});

app.use('*', (req, res) => res.status(404).end())
