const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const JWT_SECRET = process.env.JWT_SECRET;

// Register User
exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    // Cek apakah user sudah ada
    let { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    if (existingUser)
      return res.status(400).json({ message: "Email sudah terdaftar!" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const { data, error } = await supabase
      .from("users")
      .insert([{ email, password: hashedPassword, name }]);

    if (error) throw error;

    res.json({ message: "User berhasil didaftarkan!", data });
  } catch (error) {
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user)
      return res.status(400).json({ message: "Email atau password salah!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Email atau password salah!" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // Simpan token di cookies, bukan hanya di response body
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Gunakan secure di production
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 hari
    });

    res.json({
      message: "Login berhasil!",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};

// Logout User
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout berhasil!" });
};

// Get User Profile (Protected Route)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let { data: user } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("id", userId)
      .single();
    if (!user)
      return res.status(404).json({ message: "User tidak ditemukan!" });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error!", error: error.message });
  }
};
