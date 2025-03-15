import { useEffect, useState } from "react";
import { supabase } from "./Supabaseclient.tsx"; // Import Supabase client
import { useNavigate } from "react-router-dom"; // For navigation

export default function TableView() {
  const [items, setItems] = useState([]); // State to store inventory data
  const [loading, setLoading] = useState(true); // State for loading
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("food_inven") // Table name
        .select("id, product_name, category, expiry_date, purchase_date, quantity, unit, storage_location, price_per_unit, image");

      if (error) {
        console.error("Error fetching inventory:", error.message);
      } else {
        setItems(data); // Set the fetched data
      }
      setLoading(false);
    };

    fetchInventory();
  }, []);

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {/* Header Section */}
      <h2 className="text-4xl font-bold text-green-600 text-center">Inventory Table View</h2>
      <p className="text-gray-600 mt-2 text-center">
        Track your shop items with expiry warnings and status indicators.
      </p>

      {/* Navigation Buttons */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={() => navigate("/cardview")}
          className="bg-green-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-green-600 transition"
        >
          View Inventory
        </button>
        <button
          onClick={() => navigate("/table-view")}
          className="bg-blue-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-blue-600 transition"
        >
          Table View
        </button>
        <button
          onClick={() => navigate("/graph-view")}
          className="bg-purple-500 text-white py-2 px-6 rounded-full shadow-lg hover:bg-purple-600 transition"
        >
          Show Graph
        </button>
      </div>

      {/* Show Loading State */}
      {loading && <p className="text-gray-600 mt-4">Loading inventory...</p>}

      {/* Inventory Table */}
      <div className="mt-6 w-full max-w-7xl overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-6 text-left border">Product</th>
              <th className="py-3 px-6 text-left border">Category</th>
              <th className="py-3 px-6 text-left border">Quantity</th>
              <th className="py-3 px-6 text-left border">Storage</th>
              <th className="py-3 px-6 text-left border bg-green-200">Entry Date</th>
              <th className="py-3 px-6 text-left border bg-red-200">Expiry Date</th>
              <th className="py-3 px-6 text-left border">Price/Unit</th>
              <th className="py-3 px-6 text-left border">Warning</th>
              <th className="py-3 px-6 text-left border">Expired</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const status = getStatus(item.expiry_date);
              return (
                <tr key={item.id} className="border hover:bg-gray-100">
                  <td className="py-3 px-6 border flex items-center space-x-3">
                    <img src={item.image || "https://via.placeholder.com/50"} alt={item.product_name} className="w-10 h-10 object-cover rounded-md" />
                    <span>{item.product_name}</span>
                  </td>
                  <td className="py-3 px-6 border">{item.category}</td>
                  <td className="py-3 px-6 border">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-6 border">{item.storage_location}</td>
                  <td className="py-3 px-6 border bg-green-100 text-green-800 font-semibold">
                    {new Date(item.purchase_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 border bg-red-100 text-red-800 font-semibold">
                    {new Date(item.expiry_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-6 border text-green-600 font-bold">${item.price_per_unit}</td>
                  <td className={`py-3 px-6 border font-bold ${status.color}`}>
                    {status.text === "Warning" ? status.text : ""}
                  </td>
                  <td className={`py-3 px-6 border font-bold ${status.color}`}>
                    {status.text === "Expired" ? status.text : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
