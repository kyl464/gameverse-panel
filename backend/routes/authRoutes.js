const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabaseClient");
const authMiddleware = require("../middlewares/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
  const { email, name, password, img_url, role } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([{ email, name, password: hashedPassword, img_url, role }]);

  if (error) return res.status(400).json({ message: error.message });

  res.status(201).json({ message: "User registered successfully", user: data });
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user)
    return res.status(401).json({ message: "Invalid email or password" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(401).json({ message: "Invalid email or password" });

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      img_url: user.img_url,
    },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "1h" }
  );

  return res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      img_url: user.img_url,
    },
  });
});

// Get User Profile (Protected Route)
router.get("/profile", authMiddleware, async (req, res) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, name, img_url, role")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(400).json({ message: "User not found" });

  res.json(user);
});

// Update User Profile (Protected Route)
router.put("/profile", authMiddleware, async (req, res) => {
  const { name, img_url } = req.body;

  const { data, error } = await supabase
    .from("users")
    .update({ name, img_url, updated_at: new Date() })
    .eq("id", req.user.id);

  if (error)
    return res.status(400).json({ message: "Failed to update profile" });

  res.json({ message: "Profile updated successfully", user: data });
});

// Delete User Profile (Protected Route)
router.delete("/profile", authMiddleware, async (req, res) => {
  const { error } = await supabase.from("users").delete().eq("id", req.user.id);

  if (error)
    return res.status(400).json({ message: "Failed to delete account" });

  res.json({ message: "Account deleted successfully" });
});

// Logout User (Menghapus Token di Frontend)
router.post("/logout", (req, res) => {
  console.log("🔍 Request logout diterima di backend");
  res.status(200).json({ message: "Logout successful" });
});

module.exports = router;
