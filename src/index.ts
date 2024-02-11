import { config as dotenvConfig } from 'dotenv'
import { app, server } from './server'
import apis from './routers/apis'
import pdf from './routers/pdf'
import wss from './services/subdom'
import { run as runBots } from './bots'

dotenvConfig()

runBots();

app.use('/', apis)
app.use('/pdf/', pdf)
app.use('*', (req, res) => res.status(404).end())

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`)
  if (wss) return 0;
})
