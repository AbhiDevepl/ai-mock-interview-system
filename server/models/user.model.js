import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  picture: {
    type: String,
  },
  credits: {
    type: Number,
    default: 100,
  }

},{timestamps: true})


const User = mongoose.model('User', userSchema);

export default User;