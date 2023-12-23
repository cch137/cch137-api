import { config as dotenvConfig } from 'dotenv'
import { app, server } from './server'
import apis from './routers/apis'
import pineRouter from './routers/pine'
import pdfRouter from './routers/pdf'
import mongoose from './services/mongoose'
import subdom from './services/subdom'

dotenvConfig()

app.use('/', apis)
app.use('/pine/', pineRouter)
app.use('/pdf/', pdfRouter)
app.use('*', (req, res) => res.status(404).end())

const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log(`Server is listening to http://localhost:${port}`)
  console.log(`Mongoose version: ${mongoose.version}`)
  if (subdom.ready) console.log('Subdom is ready.')
})

import { packData, unpackData } from './utils/bson'
let x, y, z
x = { a: 1.1, b: -2.3, c: [1, 'Hello', { d: 96 }] }
x = 123.456
y = packData(x)
z = unpackData(y)
console.log(x)
console.log(y.length)
console.log(z)
