import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    unique: true,
    sparse: true,
  },
  avatar: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  credits: {
    type: Number,
    default: 100,
  }

},{timestamps: true})


const User = mongoose.model('User', userSchema);

export default User;