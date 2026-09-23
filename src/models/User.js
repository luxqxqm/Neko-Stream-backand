import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    refreshTokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    delete returnedObject.passwordHash;
    delete returnedObject.refreshTokenVersion;
    delete returnedObject.__v;
    return returnedObject;
  },
});

export const User = mongoose.model('User', userSchema);
