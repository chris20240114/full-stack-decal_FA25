import { Schema, model } from 'mongoose'

const ItemSchema = new Schema({
  title: String,
  description: String,
  thumbnailUrl: String,
  externalId: String,
  address: String,
  source: String,
  location: {
    lat: Number,
    lon: Number,
  }
}, { timestamps: true })

export default model('Item', ItemSchema)
