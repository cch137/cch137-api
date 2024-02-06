import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

void mongoose.connect(process.env.MONGODB_URI as string)

export default mongoose

export {
  ObjectId,
}
