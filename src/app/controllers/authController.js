const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mailer = require("../../modules/mail");

const router = express.Router();

const authConfig = require("../../config/auth");

const User = require("../models/user");

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400
  });
}

router.post("/register", async (req, res) => {
  try {
    const { email } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).send({ error: "User already exists" });

    const user = await User.create(req.body);

    user.password = undefined;

    res.send({
      user,
      token: generateToken({ id: user.id })
    });
  } catch (error) {
    return res.status(400).send({ error: "Registration failed" });
  }
});

router.post("/authenticate", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) return res.status(400).send({ error: "User not found" });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).send({ error: "Invalid password" });

    //Login com sucesso
    user.password = undefined;

    res.send({
      user,
      token: generateToken({ id: user.id })
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/forgot_password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).send({ error: "User not found" });

    const token = crypto.randomBytes(20).toString("hex");

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpires: now
      }
    });
    mailer.sendMail(
      {
        to: email,
        from: "cc_bf@hotmail.com",
        template: "auth/forgot_password",
        context: { token }
      },
      error => {
        if (error)
          return res
            .status(400)
            .send({ error: "Cannot send forgot password mail" });

        return res.send();
      }
    );
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Error on forgot password, try again" });
  }
});

module.exports = app => app.use("/auth", router);
