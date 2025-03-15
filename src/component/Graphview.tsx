import { useEffect, useState } from "react";
import { supabase } from "./Supabaseclient.tsx";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function GraphView() {
  const [salesData, setSalesData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSalesData = async () => {
      const { data, error } = await supabase
        .from("food-log")
        .select("product_id, selling_date, quantity_sold");

      if (error) {
        console.error("Error fetching sales data:", error.message);
      } else {
        console.log("Fetched Data:", data);
        processSalesData(data);
      }
    };

    fetchSalesData();
  }, []);

  const processSalesData = (data) => {
    if (!data || data.length === 0) {
      setSalesData([]);
      return;
    }

    const salesMap = {};

    data.forEach(({ product_id, selling_date, quantity_sold }) => {
      const formattedDate = new Date(selling_date).toISOString().split("T")[0];

      if (!salesMap[formattedDate]) {
        salesMap[formattedDate] = { date: formattedDate };
      }
      salesMap[formattedDate][`Product ${product_id}`] =
        (salesMap[formattedDate][`Product ${product_id}`] || 0) +
        quantity_sold;
    });

    const formattedData = Object.values(salesMap);

    console.log("Processed Data for Graph:", formattedData);
    setSalesData(formattedData);
  };

  return (
    <div className="min-h-screen bg-black relative flex flex-col items-center p-6">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>

      <style>
        {`
          .bg-grid {
            background-image: linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.1) 75%, rgba(255, 255, 255, 0.1) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, 0.1) 75%, rgba(255, 255, 255, 0.1) 76%, transparent 77%, transparent);
            background-size: 50px 50px;
          }
        `}
      </style>

      <h2 className="text-3xl font-bold text-green-400">📊 Sales Data Over Time</h2>
      <p className="text-gray-400">Track item sales by date</p>

      <button
        onClick={() => navigate("/home")}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4 hover:bg-blue-600 transition"
      >
        Back to Home
      </button>

      {salesData.length === 0 ? (
        <p className="text-red-400 mt-4">No data available to display.</p>
      ) : (
        <div className="w-full max-w-5xl mt-6 p-6 bg-gray-900 shadow-lg rounded-lg">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
                tick={{ fill: "white" }}
              />
              <YAxis tick={{ fill: "white" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid #fff",
                  color: "white",
                }}
              />
              <Legend wrapperStyle={{ color: "white" }} />

              {/* Dynamically add product lines */}
              {Object.keys(salesData[0])
                .filter((key) => key !== "date")
                .map((key, index) => (
                  <Line
                    key={index}
                    type="monotone"
                    dataKey={key}
                    stroke={`hsl(${index * 50}, 80%, 60%)`}
                    strokeWidth={2}
                    dot={{ r: 4, fill: `hsl(${index * 50}, 80%, 60%)` }}
                    activeDot={{ r: 6, fill: `hsl(${index * 50}, 100%, 80%)` }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
