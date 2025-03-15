import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Airetrieve() {
  const [restaurantTheme, setRestaurantTheme] = useState("");
  const [expirationDate, setExpirationDate] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const fetchInventoryData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // First, send the theme and expiration date via POST request
      const postResponse = await fetch(
        "https://shn69.app.n8n.cloud/webhook-test/fa92b89e-92c8-43a9-9b1e-451ad0a1be96",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantTheme,
            expirationDate: parseInt(expirationDate, 10),
          }),
        }
      );

      if (!postResponse.ok) throw new Error("Failed to send data");

      // Wait for the server to process the request before fetching results
      setTimeout(async () => {
        try {
          const getResponse = await fetch(
            "https://shn69.app.n8n.cloud/webhook-test/fa92b89e-92c8-43a9-9b1e-451ad0a1be96"
          );

          if (!getResponse.ok) throw new Error("Failed to fetch results");

          const data = await getResponse.text(); // Assuming text response
          setResults(data);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }, 3000); // Adjust delay as needed for backend processing
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
      <motion.h2
        className="text-3xl font-bold text-green-400 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        🍽 AI-Generated Inventory Report
      </motion.h2>

      <form onSubmit={fetchInventoryData} className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl">
        <div className="mb-4">
          <label className="text-green-300 block font-semibold mb-2">
            Restaurant Theme:
          </label>
          <input
            type="text"
            value={restaurantTheme}
            onChange={(e) => setRestaurantTheme(e.target.value)}
            required
            placeholder="e.g., Italian, South Indian"
            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
          />
        </div>

        <div className="mb-4">
          <label className="text-green-300 block font-semibold mb-2">
            Expiration Date (Days):
          </label>
          <input
            type="number"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            required
            min="1"
            className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full p-3 bg-green-500 hover:bg-green-600 rounded font-semibold text-white"
        >
          Generate Report
        </button>
      </form>

      {loading && (
        <div className="mt-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full"
          ></motion.div>
          <p className="text-white mt-2">Fetching Data...</p>
        </div>
      )}

      {error && <p className="text-red-400 mt-6">{error}</p>}

      {results && (
        <motion.div
          className="bg-gray-800 p-6 mt-6 rounded-lg shadow-md text-white max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-green-300 text-xl font-bold mb-4">Inventory Report</h3>
          <pre className="whitespace-pre-wrap">{results}</pre>
        </motion.div>
      )}
    </div>
  );
}
