import CommentModel from "../models/CatsComments.js";
import UserModel from "../models/User.js";

export const createComment = async (req, res) => {
  try {
    const user = req.userId;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doc = new CommentModel({
      text: req.body.text,
      likes: 0,
      user: user,
    });

    const comment = await doc.save();

    res.json(comment);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating comment" });
  }
};
export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const currentUser = await UserModel.findById(req.userId);

    if (!(comment.user.toString() === req.userId || currentUser.isAdmin)) {
      return res.status(403).json({
        message: "Unauthorized: You are not the owner or an admin of this post",
      });
    }

    await CommentModel.findByIdAndDelete(commentId);

    return res.json({
      message: "Comment deleted",
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating comment" });
  }
};

export const addLike = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const comment = await CommentModel.findById(commentId);
    console.log("Comment:", comment);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    comment.likes++;
    await comment.save();
    res.json("Like added");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding like" });
  }
};
export const delLike = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const comment = await CommentModel.findById(commentId);
    console.log("Comment:", comment);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    comment.likes--;
    await comment.save();
    res.json("Like removed");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding like" });
  }
};
