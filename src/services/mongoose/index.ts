import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
// import { writeFileSync } from 'fs'

void mongoose.connect(process.env.MONGODB_URI as string)

export default mongoose

// ;(async () => {
//   console.log('START DOWNLOAD')
//   const data = await message.find({ Q: { $regex: 'Midjourney' } })
//   console.log(data.length)
//   writeFileSync('log.json', JSON.stringify(data, null, 2), 'utf8')
//   console.log('END DOWNLOAD')
// })();

export {
  ObjectId,
}
