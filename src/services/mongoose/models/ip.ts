import { Schema, model } from 'mongoose'

export default model('IP', new Schema({
  ip: { type: String, required: true },
  mtime: { type: Number, required: true },
  city: { type: String },
  country: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  usage: { type: String },
  risk: { type: Number },
}, {
  versionKey: false
}), 'ips')
