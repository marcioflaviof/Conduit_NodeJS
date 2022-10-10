import { Request, Response } from "express";
import User, { UserAttributes } from "../models/User";
import { hashPassword, matchPassword } from "../utils/password";
import { sign } from "../utils/jwt";

module.exports.createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password }: UserAttributes = req.body.user;
    if (!username) throw new Error("Username is Required");
    if (!email) throw new Error("Email is Required");
    if (!password) throw new Error("Password is Required");

    const existingUser = await User.findByPk(email);
    if (existingUser)
      throw new Error("User aldready exists with this email id");

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      username: username,
      password: hashedPassword,
      email: email,
    });

    if (user) {
      const serializedUser = {
        username: user.getDataValue("username"),
        email: user.getDataValue("email"),
        image: null,
        bio: null,
        token: await sign(user),
      };
      res.status(201).json({ user: serializedUser });
    }
  } catch (e: any) {
    res
      .status(422)
      .json({ errors: { body: ["Could not create user ", e.message] } });
  }
};

module.exports.loginUser = async (req: Request, res: Response) => {
  try {
    if (!req.body.user.email) throw new Error("Email is Required");
    if (!req.body.user.password) throw new Error("Password is Required");

    const user = await User.findByPk(req.body.user.email);

    if (!user) {
      res.status(401);
      throw new Error("No User with this email id");
    }

    //Check if password matches
    const passwordMatch = await matchPassword(
      user.getDataValue("password"),
      req.body.user.password
    );

    if (!passwordMatch) {
      res.status(401);
      throw new Error("Invalid password or email id");
    }

    const serializedUser = {
      username: user.getDataValue("username"),
      email: user.getDataValue("email"),
      image: null,
      bio: null,
      token: await sign(user),
    };

    res.status(200).json({ user: serializedUser });
  } catch (e: any) {
    const status = res.statusCode ? res.statusCode : 500;
    res
      .status(status)
      .json({ errors: { body: ["Could not login user ", e.message] } });
  }
};

module.exports.getUserByEmail = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.user.email);
    if (!user) {
      throw new Error("No such user found");
    }
    delete user.dataValues.password;
    user.dataValues.token = req.header("Authorization").split(" ")[1];
    return res.status(200).json({ user });
  } catch (e: any) {
    return res.status(404).json({
      errors: { body: [e.message] },
    });
  }
};

module.exports.updateUserDetails = async (req: Request, res: Response) => {
  //   try {
  //     const user = await User.findByPk(req.user.email);
  //     if (!user) {
  //       res.status(401);
  //       throw new Error("No user with this email id");
  //     }
  //     if (req.body.user) {
  //       const username = req.body.user.username
  //         ? req.body.user.username
  //         : user.username;
  //       const bio = req.body.user.bio ? req.body.user.bio : user.bio;
  //       const image = req.body.user.image ? req.body.user.image : user.image;
  //       let password = user.password;
  //       if (req.body.user.password)
  //         password = await hashPassword(req.body.user.password);
  //       const updatedUser = await user.update({ username, bio, image, password });
  //       delete updatedUser.dataValues.password;
  //       updatedUser.dataValues.token = req.header("Authorization").split(" ")[1];
  //       res.json(updatedUser);
  //     } else {
  //       delete user.dataValues.password;
  //       user.dataValues.token = req.header("Authorization").split(" ")[1];
  //       res.json(user);
  //     }
  //   } catch (e) {
  //     const status = res.statusCode ? res.statusCode : 500;
  //     return res.status(status).json({
  //       errors: { body: [e.message] },
  //     });
  //   }
};
