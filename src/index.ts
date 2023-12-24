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

// import { packData, unpackData } from './utils/bson'

// console.log(packData)
// let x, y, z, m = new Map()
// let b = new Uint16Array([1,2,3])
// let s = new Set([123.04056])
// let d = new Date(2023, 12, 25, 8, 30)
// m.set('x', 1)
// m.set('y', 2)
// m.set(123, s)
// x = { i: 1.1, j: -2.03, c: ['Hello World!', { d: BigInt(96) }], s, m, b, d }
// // x = 127
// y = packData(x)
// z = unpackData(y)
// console.log(x)
// console.log(y.length)
// console.log(z)
