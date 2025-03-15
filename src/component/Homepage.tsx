import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "./Supabaseclient.tsx";
import CardView from "./CardView"; // Import CardView component

export default function HomePage() {
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState("https://via.placeholder.com/40");
  const [showInventory, setShowInventory] = useState(false); // State to toggle CardView

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (user) {
        setUsername(user.email.split("@")[0]);

        const { data, error } = await supabase
          .from("auth-domain")
          .select("image")
          .eq("email", user.email)
          .single();

        if (data?.image) {
          setProfileImage(data.image);
        } else if (error) {
          console.error("Error fetching profile image:", error.message);
        }
      } else {
        console.error("User not authenticated:", userError?.message);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center p-6">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      {/* Tailwind CSS for Grid Background */}
      <style>
        {`
          .bg-grid {
            background-image: linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.1) 75%, rgba(255, 255, 255, 0.1) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.1) 75%, rgba(255, 255, 255, 0.1) 76%, transparent 77%, transparent);
            background-size: 55px 55px;
          }
        `}
      </style>

      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 bg-gray-900 text-white shadow-md rounded-lg">
        <h1 className="text-3xl font-bold text-green-400">Shop Inventory</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-300 font-semibold">{username}</span>
          <img
            src={profileImage}
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-green-400 object-cover"
          />
        </div>
      </header>

      {/* Hero Section */}
      {!showInventory && (
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl font-bold text-green-400">Manage Your Inventory Efficiently</h2>
          <p className="text-gray-400 mt-2">
            Track your shop items with ease, monitor expiry dates, and optimize storage.
          </p>
        </motion.div>
      )}

      {/* Call to Action Buttons */}
      {!showInventory && (
        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => setShowInventory(true)} // Show CardView on click
            className="bg-green-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-green-600 transition"
          >
            View Inventory
          </button>
          <a href="/table-view" className="bg-blue-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-blue-600 transition">
            Table View
          </a>
        </div>
      )}

      {/* Show Inventory (CardView Component) */}
      {showInventory && <CardView />}

      {/* Floating AI Suggestion Button */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-green-600 cursor-pointer transition flex items-center space-x-4">
        <span>🤖</span>
        <button className="font-semibold">Ask AI for Best Prompt</button>
      </div>
    </div>
  );
}
