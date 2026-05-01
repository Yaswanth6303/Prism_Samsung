import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash?: string
  collegeId?: mongoose.Types.ObjectId
  githubHandle?: string
  leetcodeHandle?: string
  totalPoints: number
  currentStreak: number
  bestStreak: number
  aiKeys: { provider: string; encryptedKey: string }[]
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College' },
    githubHandle: { type: String },
    leetcodeHandle: { type: String },
    totalPoints: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    aiKeys: [
      {
        provider: { type: String },
        encryptedKey: { type: String }
      }
    ]
  },
  { timestamps: true }
)

UserSchema.methods.comparePassword = async function (password: string) {
  if (!this.passwordHash) return false
  return bcrypt.compare(password, this.passwordHash)
}

const User = (mongoose.models.User as mongoose.Model<IUser>) || mongoose.model<IUser>('User', UserSchema)
export default User
