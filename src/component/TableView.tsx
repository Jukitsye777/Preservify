import { useEffect, useState } from "react";
import { supabase } from "./Supabaseclient.tsx"; // Import Supabase client
import { useNavigate } from "react-router-dom"; // For navigation
import { motion, AnimatePresence } from "framer-motion"; // Import for animations
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"; // Import chart components

export default function TableView() {
  const [items, setItems] = useState([]); // State to store inventory data
  const [loading, setLoading] = useState(true); // State for loading
  const [hoveredItem, setHoveredItem] = useState(null); // Track hovered item
  const [itemSalesData, setItemSalesData] = useState({}); // Store sales data
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("food_inven") // Table name
        .select("id, product_id, product_name, category, expiry_date, purchase_date, quantity, unit, storage_location, price_per_unit, image");

      if (error) {
        console.error("Error fetching inventory:", error.message);
      } else {
        setItems(data); // Set the fetched data
      }
      setLoading(false);
    };

    fetchInventory();
    fetchAllSalesData(); // Fetch sales data
  }, []);

  // Fetch sales data for all products
  const fetchAllSalesData = async () => {
    const { data, error } = await supabase
      .from("food-log")
      .select("product_id, selling_date, quantity_sold");

    if (error) {
      console.error("Error fetching sales data:", error.message);
    } else {
      // Process and organize sales data by product_id
      const salesByProduct = {};
      
      data.forEach(({ product_id, selling_date, quantity_sold }) => {
        if (!salesByProduct[product_id]) {
          salesByProduct[product_id] = [];
        }
        
        // Check if we already have an entry for this date
        const existingEntry = salesByProduct[product_id].find(
          entry => entry.date === selling_date
        );
        
        if (existingEntry) {
          existingEntry.quantity += quantity_sold;
        } else {
          salesByProduct[product_id].push({
            date: selling_date,
            quantity: quantity_sold
          });
        }
      });
      
      // Sort data by date for each product
      Object.keys(salesByProduct).forEach(productId => {
        salesByProduct[productId].sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );
      });
      
      setItemSalesData(salesByProduct);
    }
  };

  // Function to calculate the warning and expiry status
  const getStatus = (expiry_date) => {
    const today = new Date();
    const expiry = new Date(expiry_date);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)); // Days left

    if (diffDays < 0) {
      return { text: "Expired", color: "bg-red-500 text-white" };
    } else if (diffDays <= 4) {
      return { text: "Warning", color: "bg-yellow-500 text-black" };
    } else {
      return { text: "Good", color: "bg-green-500 text-white" };
    }
  };

  return (
    <div className="min-h-screen bg-black bg-grid flex flex-col items-center p-6">
      {/* Add the grid background style */}
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

      {/* Header Section - Updated colors for dark theme */}
      <h2 className="text-4xl font-bold text-green-400 text-center">Inventory Table View</h2>
      <p className="text-gray-400 mt-2 text-center">
        Track your shop items with expiry warnings and status indicators.
      </p>

      {/* Navigation Buttons */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => navigate("/home")}
          className="bg-gray-700 text-white py-2 px-6 rounded-full shadow-lg hover:bg-gray-600 transition flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back to Home</span>
        </button>
        <button
          onClick={() => navigate("/cardview")}
          className="bg-green-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-green-600 transition"
        >
          Card View
        </button>
        <button
          onClick={() => navigate("/graph-view")}
          className="bg-purple-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-purple-600 transition"
        >
          Graph View
        </button>
      </div>

      {/* Show Loading State - Updated for dark theme */}
      {loading && (
        <div className="flex items-center justify-center mt-8">
          <div className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
          <p className="text-green-400 ml-3">Loading inventory...</p>
        </div>
      )}

      {/* Inventory Table - Updated with darker theme */}
      <div className="mt-6 w-full max-w-7xl overflow-x-auto bg-gray-900 rounded-lg shadow-xl border border-gray-700 relative">
        <table className="min-w-full rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-800 text-green-400">
              <th className="py-3 px-6 text-left border-b border-r border-gray-700">Product</th>
              <th className="py-3 px-6 text-left border-b border-r border-gray-700">Category</th>
              <th className="py-3 px-6 text-left border-b border-r border-gray-700">Quantity</th>
              <th className="py-3 px-6 text-left border-b border-r border-gray-700">Storage</th>
              <th className="py-3 px-6 text-left border-b border-r border-gray-700 bg-green-900">Entry Date</th>
              <th className="py-3 px-6 text-left border-b border-r border-gray-700 bg-red-900">Expiry Date</th>
              <th className="py-3 px-6 text-left border-b border-r border-gray-700">Price/Unit</th>
              <th className="py-3 px-6 text-left border-b border-r border-gray-700">Warning</th>
              <th className="py-3 px-6 text-left border-b border-gray-700">Expired</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const status = getStatus(item.expiry_date);
              return (
                <tr 
                  key={item.id} 
                  className="border-b border-gray-700 hover:bg-gray-800 text-gray-300 relative"
                  onMouseEnter={() => setHoveredItem(item.product_id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <td className="py-3 px-6 border-r border-gray-700 flex items-center space-x-3">
                    <img src={item.image || "https://via.placeholder.com/50"} alt={item.product_name} className="w-10 h-10 object-cover rounded-md" />
                    <span>{item.product_name}</span>
                  </td>
                  <td className="py-3 px-6 border-r border-gray-700">{item.category}</td>
                  <td className="py-3 px-6 border-r border-gray-700">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-6 border-r border-gray-700">{item.storage_location}</td>
                  <td className="py-3 px-6 border-r border-gray-700 bg-green-900 bg-opacity-30 text-green-400 font-semibold">
                    {new Date(item.purchase_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 border-r border-gray-700 bg-red-900 bg-opacity-30 text-red-400 font-semibold">
                    {new Date(item.expiry_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 border-r border-gray-700 text-green-400 font-bold">${item.price_per_unit}</td>
                  <td className={`py-3 px-6 border-r border-gray-700 font-bold ${status.color}`}>
                    {status.text === "Warning" ? status.text : ""}
                  </td>
                  <td className={`py-3 px-6 font-bold ${status.color}`}>
                    {status.text === "Expired" ? status.text : ""}
                  </td>
                  
                  {/* Hover Graph */}
                  <AnimatePresence>
                    {hoveredItem === item.product_id && itemSalesData[item.product_id] && itemSalesData[item.product_id].length > 0 && (
                      <motion.div 
                        className="absolute z-50 top-0 right-0 transform -translate-y-full bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        style={{ width: '300px', height: '200px', marginTop: '-10px', marginRight: '20px' }}
                      >
                        <h4 className="text-sm font-semibold text-green-400 mb-2">Sales History: {item.product_name}</h4>
                        <ResponsiveContainer width="100%" height="80%">
                          <LineChart data={itemSalesData[item.product_id]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fill: 'white', fontSize: 10 }}
                              tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis tick={{ fill: 'white', fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                border: '1px solid #444',
                                color: 'white',
                                fontSize: '12px'
                              }}
                              formatter={(value) => [`${value} ${item.unit}`, 'Quantity']}
                              labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="quantity" 
                              stroke="#4ade80" 
                              strokeWidth={2}
                              dot={{ r: 3, fill: '#4ade80' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
