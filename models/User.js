import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
userSchema.index({ email: 1 }, { unique: true });
userSchema.statics.findOrCreate = async function(query) {
  try {
    const user = await this.findOne(query);
    if (user) {
      return user;
    }
    const newUser = new this(query);
    await newUser.save();
    return newUser;
  } catch (err) {
    console.error(err);
    throw err; // Re-throw the error to handle it appropriately
  }
};

export default mongoose.model("User", userSchema);
