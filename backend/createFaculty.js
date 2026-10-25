
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const Faculty = require("./models/Faculty");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = question => new Promise(resolve => rl.question(question, resolve));

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const name = (await ask("Faculty name: ")).trim();
    const email = (await ask("Faculty email: ")).trim().toLowerCase();
    const department = (await ask("Department: ")).trim();
    const password = await ask("Password (at least 8 characters): ");

    if (!name || !email || !department || password.length < 8) {
      throw new Error("Enter all fields and a password of at least 8 characters");
    }

    const existing = await Faculty.findOne({ email });

    if (existing) {
      throw new Error("Faculty account already exists");
    }

    const hash = await bcrypt.hash(password, 12);

    await Faculty.create({
      name,
      email,
      department,
      password: hash
    });

    console.log("Faculty account created successfully!");
  } catch (error) {
    console.error(error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main();
