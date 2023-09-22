const express = require("express");
const {
  registerUser,
  loginUser,
  allUser,
  deleteAccount,
  updateUser,
} = require("../controllers/userController");
const { authentication } = require("../middleware/authentication");

const userRouter = express.Router();

// userRouter.get("/", async (req, res) => {
//   try {
//     const data = await User.find();
//     console.log(data);
//     return res.send({ msg: data });
//   } catch (error) {
//     return res.send({ msg: error.message });
//   }
// });

userRouter.post("/login", loginUser);

userRouter.route("/register").post(registerUser);

userRouter.route("/").get(authentication, allUser);

userRouter.delete("/deleteAccount", authentication, deleteAccount);

userRouter.patch("/:id", authentication, updateUser);

module.exports = { userRouter };
