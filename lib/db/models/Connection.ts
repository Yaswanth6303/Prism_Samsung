import mongoose from 'mongoose'

// Connection records keep track of linked providers and any metadata the app needs later.
const ConnectionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  provider: { type: String, required: true },
  providerId: { type: String },
  accountName: { type: String },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now },
})

// The model stays tiny because the route only needs a simple provider list per user.
export default mongoose.models.Connection || mongoose.model('Connection', ConnectionSchema)
