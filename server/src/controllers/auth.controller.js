import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/*
| One place that decides what goes into a token and what a user looks like
| on the wire, so register and login cannot drift apart.
*/

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ==========================================
// REGISTER
// ==========================================

export const register = asyncHandler(
  async (req, res) => {
    const {
      name,
      email,
      password,
    } = req.body;

    // Check whether the email already exists
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    // Hash password before storing it
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create persistent MongoDB user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    /*
    | Registration signs the user straight in. Requiring a separate login
    | immediately afterwards is friction with no security benefit -- the
    | credentials were just verified by creating the account.
    */

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: signToken(user),
      user: toPublicUser(user),
    });
  }
);

// ==========================================
// LOGIN
// ==========================================

export const login = asyncHandler(
  async (req, res) => {
    const {
      email,
      password,
    } = req.body;

    // Password is select:false in User model,
    // so explicitly include it for authentication.
    const user = await User.findOne({
      email,
    }).select("+password");

    // Same response for unknown email and wrong
    // password to avoid exposing account existence.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Block disabled accounts
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    // Compare plaintext input against bcrypt hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: signToken(user),
      user: toPublicUser(user),
    });
  }
);

// ==========================================
// CURRENT AUTHENTICATED USER
// ==========================================

export const getCurrentUser = asyncHandler(
  async (req, res) => {
    // req.user.id comes from the verified JWT
    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      user: toPublicUser(user),
    });
  }
);