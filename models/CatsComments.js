import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  likes: {
    count: {
      type: Number,
      default: 0,
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export default mongoose.model("Comment", commentSchema);
