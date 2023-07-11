const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const { default: mongoose } = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/", async (req, res, next) => {
  //Can use select(-<field_name>) or select field 'false' when decleare the schema
  const users = await User.find().select("-passwordHash");
  res.status(200).json(users);
});
router.get("/count/customers", async (req, res, next) => {
  //Can use select(-<field_name>) or select field 'false' when decleare the schema
  const users = await User.count({ isAdmin: false });
  res.status(200).json(users);
});

router.get("/:id", async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send({
      success: false,
      message: "Invalid Product ID!",
    });
  }
  const user = await User.findById(req.params.id).select("-passwordHash");
  res.status(200).json(user);
});

// register
router.post("/authen/register", async (req, res, next) => {
  console.log(process.env.SALT);
  const passwordHash = bcrypt.hashSync(
    req.body.password,
    Number(process.env.SALT)
  );
  const user = await User.create({ ...req.body, passwordHash });
  return res.status(200).send(user);
});

router.put("/:id", async (req, res, next) => {
  const id = req.params.id;
  try {
    if (!id || !mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid User ID!" });
    }
    const userExists = await User.findById(id);
    if (!userExists) {
      return res
        .status(400)
        .send({ success: false, message: "Can not found this User ID!" });
    }
    const data = req.body;
    if (data.passwordHash) {
      data.password = bcrypt.hashSync(
        data.passwordHash,
        Number(process.env.SALT)
      );
    }

    const newUser = await User.findByIdAndUpdate(id, data, { new: true });
    return res.status(200).send(newUser);
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/authen/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email,
    });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "Can not found this user!" });
    }
    console.log(password, user.passwordHash);
    if (user && !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({
        success: false,
        message: "Wrong password",
      });
    }
    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.MY_SECRET,
      { expiresIn: "1d" }
    );
    return res.status(200).json({ user: user.email, token });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
