import "dotenv/config";
import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import User from "../models/User.js";

async function testUserModel() {
  try {
    await connectDatabase();

    console.log("User model:", User.modelName);
    console.log("Collection:", User.collection.name);

    await mongoose.connection.close();

    console.log("User model test successful.");

    process.exit(0);
  } catch (error) {
    console.error(
      "User model test failed:",
      error.message
    );

    process.exit(1);
  }
}

testUserModel();