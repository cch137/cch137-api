import { config as dotenvConfig } from 'dotenv'
import { app, server } from './server';
import apis from './apis';
import pineRouter from './pine';

dotenvConfig()

app.use('/', apis)
app.use('/pine/', pineRouter)
app.use('*', (req, res) => res.status(404).end())

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`);
});
