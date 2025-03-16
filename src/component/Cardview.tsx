import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "./Supabaseclient.tsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"; // Import chart components

export default function CardView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantitySold, setQuantitySold] = useState("");
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null); // New state for tracking hovered item
  const [itemSalesData, setItemSalesData] = useState({}); // Store sales data for each product
  const [newItem, setNewItem] = useState({
    product_name: "",
    category: "",
    expiry_date: "",
    purchase_date: "",
    quantity: "",
    unit: "",
    storage_location: "",
    price_per_unit: "",
    image: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
    fetchAllSalesData(); // Fetch sales data for all products
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("food_inven").select("*");

    if (error) {
      console.error("Error fetching inventory:", error.message);
    } else {
      setItems(data);
    }
    setLoading(false);
  };

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

  const handleSaleUpdate = async () => {
    if (!selectedItem || !quantitySold) return;

    const quantityToSubtract = parseFloat(quantitySold);
    if (isNaN(quantityToSubtract) || quantityToSubtract <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (quantityToSubtract > selectedItem.quantity) {
      alert("Error: Not enough stock available.");
      return;
    }

    const saleData = {
      product_id: selectedItem.product_id,
      selling_date: new Date().toISOString().split("T")[0],
      quantity_sold: quantityToSubtract,
    };

    const { error: saleError } = await supabase.from("food-log").insert([saleData]);

    if (saleError) {
      console.error("Error inserting into food-log:", saleError.message);
      return;
    }

    const newQuantity = selectedItem.quantity - quantityToSubtract;
    const { error: updateError } = await supabase.from("food_inven").update({ quantity: newQuantity }).eq("id", selectedItem.id);

    if (updateError) {
      console.error("Error updating food_inven:", updateError.message);
    } else {
      alert("Sale recorded successfully! Inventory updated.");
      setSelectedItem(null);
      setQuantitySold("");

      setItems((prevItems) => prevItems.map((item) => (item.id === selectedItem.id ? { ...item, quantity: newQuantity } : item)));
      
      // Update the sales data for this product
      fetchAllSalesData();
    }
  };

  const handleAddItem = async () => {
    const { error } = await supabase.from("food_inven").insert([newItem]);

    if (error) {
      console.error("Error adding item:", error.message);
    } else {
      alert("Item added successfully!");
      setPopupOpen(false);
      setNewItem({
        product_name: "",
        category: "",
        expiry_date: "",
        purchase_date: "",
        quantity: "",
        unit: "",
        storage_location: "",
        price_per_unit: "",
        image: null,
      });
      fetchInventory();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex flex-col items-center p-6">
      <motion.div className="mt-10 text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
        <h2 className="text-4xl font-bold text-green-400">Manage Your Inventory Efficiently</h2>
        <p className="text-gray-400 mt-2">Track your shop items with ease, monitor expiry dates, and optimize storage.</p>
      </motion.div>

      <div className="mt-6 flex space-x-4">
        <button onClick={() => navigate("/cardview")} className="bg-green-500 text-white py-2 px-6 rounded-full hover:bg-green-600">View Inventory</button>
        <button onClick={() => navigate("/table-view")} className="bg-blue-500 text-white py-2 px-6 rounded-full hover:bg-blue-600">Table View</button>
        <button onClick={() => navigate("/graph-view")} className="bg-purple-500 text-white py-2 px-6 rounded-full hover:bg-purple-600">Show Graph</button>
        
        <button className="bg-green-500 text-white py-2 px-6 rounded-full hover:bg-green-600" onClick={() => setPopupOpen(true)}>Add Item</button>
        <button onClick={() => navigate("/airetrieve")} className="bg-purple-500 text-white py-2 px-6 rounded-full hover:bg-purple-600">Ask AI</button>
      </div>

      {loading && <p className="text-gray-400 mt-4">Loading inventory...</p>}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 w-full px-10">
        {items.map((item) => (
          <motion.div 
            key={item.id} 
            className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-start border border-gray-700 text-white relative" 
            whileHover={{ scale: 1.05 }}
            onHoverStart={() => setHoveredItem(item.product_id)}
            onHoverEnd={() => setHoveredItem(null)}
          >
            <img src={item.image || "https://via.placeholder.com/150"} alt={item.product_name} className="w-32 h-32 object-cover rounded-md mb-2" />
            <h3 className="text-xl font-semibold text-green-400">{item.product_name}</h3>
            <p className="text-gray-300">{item.category}</p>
            <p className="text-gray-300">Qty: {item.quantity} {item.unit}</p>
            <p className="text-gray-300">Storage: {item.storage_location}</p>
            <p className="text-gray-300">Purchased: {new Date(item.purchase_date).toLocaleDateString()}</p>
            <p className="text-gray-300">Expires on: {new Date(item.expiry_date).toLocaleDateString()}</p>
            <p className="text-gray-300">Added: {new Date(item.created_at).toLocaleDateString()}</p>
            <p className="text-green-400 font-bold mt-2">${item.price_per_unit}</p>

            <button className="mt-4 bg-yellow-500 text-white py-1 px-4 rounded-full hover:bg-yellow-600" onClick={() => setSelectedItem(item)}>Edit Sale</button>
            
            {/* Hover Graph */}
            <AnimatePresence>
              {hoveredItem === item.product_id && itemSalesData[item.product_id] && itemSalesData[item.product_id].length > 0 && (
                <motion.div 
                  className="absolute z-50 top-0 transform -translate-y-full bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  style={{ width: '300px', height: '200px', marginTop: '-10px' }}
                >
                  <h4 className="text-sm font-semibold text-green-400 mb-2">Sales History</h4>
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
          </motion.div>
        ))}
      </div>

      {/* Edit Sale Popup */}
      {selectedItem && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-white w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">Edit Sale</h3>
            <p className="mb-2">Product: {selectedItem.product_name}</p>
            <p className="mb-2">Current Stock: {selectedItem.quantity} {selectedItem.unit}</p>
            <input type="number" className="w-full p-2 mb-2 bg-gray-800 text-white rounded" placeholder="Enter Quantity Sold" value={quantitySold} onChange={(e) => setQuantitySold(e.target.value)} />

            <div className="flex justify-center gap-4 mt-4">
              <button className="bg-green-500 text-white py-2 px-4 rounded-lg" onClick={handleSaleUpdate}>Save</button>
              <button className="bg-red-500 text-white py-2 px-4 rounded-lg" onClick={() => setSelectedItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-white w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">Add New Item</h3>
            <input
              type="text"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              placeholder="Product Name"
              value={newItem.product_name}
              onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
            />
            <input
              type="text"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              placeholder="Category"
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            />
            <input
              type="date"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              value={newItem.expiry_date}
              onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
            />
            <input
              type="date"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              value={newItem.purchase_date}
              onChange={(e) => setNewItem({ ...newItem, purchase_date: e.target.value })}
            />
            <input
              type="number"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              placeholder="Quantity"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
            />
            <input
              type="text"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              placeholder="Unit (e.g., kg, pcs)"
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            />
            <input
              type="text"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              placeholder="Storage Location"
              value={newItem.storage_location}
              onChange={(e) => setNewItem({ ...newItem, storage_location: e.target.value })}
            />
            <input
              type="number"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              placeholder="Price per Unit"
              value={newItem.price_per_unit}
              onChange={(e) => setNewItem({ ...newItem, price_per_unit: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              className="w-full p-2 mb-2 bg-gray-800 text-white rounded"
              onChange={handleImageChange}
            />
            {newItem.image && (
              <img src={newItem.image} alt="Preview" className="w-32 h-32 object-cover rounded-md mb-2" />
            )}

            <div className="flex justify-center gap-4 mt-4">
              <button className="bg-green-500 text-white py-2 px-4 rounded-lg" onClick={handleAddItem}>Add Item</button>
              <button className="bg-red-500 text-white py-2 px-4 rounded-lg" onClick={() => setPopupOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}