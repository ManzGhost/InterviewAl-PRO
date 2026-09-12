import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  adminCode?: string;
  adminId?: string;
  college?: string;
  education?: string;
  skills?: string[];
  preferredJobRole?: string;
  profileImage?: string;
  xpPoints?: number;
  level?: string;
  currentStreak?: number;
  emailVerified?: boolean;
  isOnLeaderboard?: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'CANDIDATE' },
    adminCode: { type: String },
    adminId: { type: String },
    college: { type: String },
    education: { type: String },
    skills: { type: [String], default: [] },
    preferredJobRole: { type: String },
    profileImage: { type: String },
    xpPoints: { type: Number, default: 100 },
    level: { type: String, default: 'Beginner' },
    currentStreak: { type: Number, default: 1 },
    emailVerified: { type: Boolean, default: true },
    isOnLeaderboard: { type: Boolean, default: true },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { collection: 'users', timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);