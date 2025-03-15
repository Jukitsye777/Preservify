import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "./Supabaseclient.tsx"; // Ensure the path is correct

export default function LoginPage({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error("Invalid email or password!");

      setIsAuthenticated(true);
      setMessage({ type: "success", text: "Login successful!" });

      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black bg-grid">
      <style>
        {`
          .bg-grid {
            background-image: linear-gradient(
                0deg,
                transparent 24%,
                rgba(255, 255, 255, 0.1) 25%,
                rgba(255, 255, 255, 0.1) 26%,
                transparent 27%,
                transparent 74%,
                rgba(255, 255, 255, 0.1) 75%,
                rgba(255, 255, 255, 0.1) 76%,
                transparent 77%,
                transparent
              ),
              linear-gradient(
                90deg,
                transparent 24%,
                rgba(255, 255, 255, 0.1) 25%,
                rgba(255, 255, 255, 0.1) 26%,
                transparent 27%,
                transparent 74%,
                rgba(255, 255, 255, 0.1) 75%,
                rgba(255, 255, 255, 0.1) 76%,
                transparent 77%,
                transparent
              );
            background-size: 55px 55px;
          }
        `}
      </style>

      <div className="flex w-full max-w-4xl items-center justify-between mt-16 space-x-10">
        {/* Animated Welcome Message */}
        <motion.h1
          className="text-5xl font-extrabold text-green-400 w-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Preserve Freshness, Reduce Waste Smarter Food Storage for a Sustainable Future!
        </motion.h1>

        {/* Animated Login Form */}
        <motion.div
          className="bg-gray-800 p-8 rounded-lg shadow-lg w-1/2 border border-gray-600"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-2xl font-bold text-center text-green-400">Login</h2>
          <p className="text-center text-gray-400 mb-4">Enter your credentials to continue</p>

          {/* Notification Popup */}
          {message.text && (
            <div
              className={`p-2 text-center rounded-md mb-4 ${
                message.type === "success" ? "bg-green-500" : "bg-red-500"
              } text-white`}
            >
              {message.text}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-300">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-2 border rounded mt-1 bg-gray-700 text-white border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full p-2 border rounded mt-1 bg-gray-700 text-white border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-4">
            Don't have an account?{" "}
            <a href="/signup" className="text-green-400 font-bold">
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
