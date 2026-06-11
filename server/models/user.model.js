import mongoose from "mongoose";

export const USER_PUBLIC_FIELDS = [
  "_id",
  "name",
  "email",
  "picture",
  "credits",
  "role",
  "lastLoginAt",
  "createdAt",
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    picture: {
      type: String,
    },
    firebaseUID: {
      type: String,
      unique: true,
      sparse: true,
    },
    credits: {
      type: Number,
      default: 100,
      min: 0,
    },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 });
userSchema.index({ firebaseUID: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
