import { config as dotenvConfig } from 'dotenv'
import { app, server } from './server';
import apis from './routers/apis';
import pineRouter from './routers/pine';
import pdfRouter from './routers/pdf';
import mongoose from './services/mongoose';

dotenvConfig()

app.use('/', apis)
app.use('/pine/', pineRouter)
app.use('/pdf/', pdfRouter)
app.use('*', (req, res) => res.status(404).end())

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`);
  console.log(`Mongoose version: ${mongoose.version}`)
});
