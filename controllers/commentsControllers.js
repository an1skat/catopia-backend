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
    const { commentId } = req.params;
    const userId = req.userId; 
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    console.log("Comment:", comment);
    comment.likes.count++;
    comment.likes.users.push(userId);
    await comment.save();
    return res.status(200).json({ comment });
  } catch (error) {
    console.error("Error adding like to comment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const delLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId; 

    const comment = await CommentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    console.log("Comment:", comment);
    let userIndex = comment.likes.users.indexOf(userId);
    comment.likes.count--;
    if (userIndex !== -1) {
      comment.likes.users.splice(userIndex, 1);
    } else {
      return res.status(404).json({ message: "User not found in likes" });
    }
    await comment.save();
    return res.status(200).json({ comment });
  } catch (error) {
    console.error("Error adding like to comment:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const user = await UserModel.findById(comment.user);
    res.json({
      "comment": comment,
      "user": user
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error getting comment" });
  }
}
export const getComments = async (req, res) => {
  try {
    const commentIds = await CommentModel.find().distinct("_id");
    res.json({ commentIds });
  } catch (error) {
    console.error("Error fetching comment IDs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}