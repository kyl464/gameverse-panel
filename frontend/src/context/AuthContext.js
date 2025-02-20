import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔍 Token saat fetchProfile:", token);

      if (!token) {
        console.warn("⚠️ Token not found, tetap di halaman yang sama.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      console.log("✅ User profile berhasil diambil:", response.data);
      setUser(response.data);
    } catch (error) {
      console.error(
        "❌ Fetch profile failed:",
        error.response?.data || error.message
      );
      localStorage.removeItem("token");
      setUser(null);
      if (router.pathname !== "/login") {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      console.log("Token setelah login:", localStorage.getItem("token"));

      return { success: true, user: response.data.user };
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      return { success: false, error: error.response?.data || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("🔍 Mengirim request logout...");
      const response = await axios.post(
        `${API_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );

      console.log("✅ Logout berhasil:", response.data);
      localStorage.removeItem("token");
      setUser(null);

      if (router.isReady) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
