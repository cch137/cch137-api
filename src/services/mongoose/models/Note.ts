import { Schema, model } from 'mongoose'

export default model('Note', new Schema({
  
}, {
  versionKey: false,
  overwriteModels: true,
}), 'PineCourse')
