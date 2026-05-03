import mongoose from 'mongoose'

const ConnectionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  provider: { type: String, required: true },
  providerId: { type: String },
  accountName: { type: String },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Connection || mongoose.model('Connection', ConnectionSchema)
