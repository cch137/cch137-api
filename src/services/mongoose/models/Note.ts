import { Schema, model } from 'mongoose'

export default model('Note', new Schema({
  text: {type: String},
  pswd: {type: String},
}, {
  versionKey: false,
  overwriteModels: true,
}), 'notes')
