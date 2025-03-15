import React, { useEffect, useState, FormEvent } from 'react';

interface UserPreference {
  email: string;
  theme: string | null;
  limit: number | null;
}

interface FoodItem {
  id: number;
  product_id: number;
  product_name: string;
  category: string;
  expiry_date: string;
  purchase_date: string;
}

const DataRetrieve: React.FC = () => {
  const [userPreference, setUserPreference] = useState<UserPreference | null>(null);
  const [expiringItems, setExpiringItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  useEffect(() => {
    // Simulating fetching user preferences from auth-domain table
    const fetchUserPreference = async () => {
      try {
        // Mock data from the first image (auth-domain table)
        // In a real application, this would be a fetch call to your database
        const mockUserPreference: UserPreference = {
          email: 'jicejoshy123@gmail.com',
          theme: 'chinese',
          limit: 9
        };
        
        setUserPreference(mockUserPreference);
        await fetchExpiringItems(mockUserPreference.limit || 0);
      } catch (err) {
        console.error('Error fetching user preference:', err);
        setError('Failed to fetch user preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreference();
  }, []);

  const fetchExpiringItems = async (limit: number) => {
    try {
      // Mock data from the second image (food_inven table)
      // In a real application, this would be a fetch call to your database
      const mockFoodItems: FoodItem[] = [
        { id: 1, product_id: 1001, product_name: 'Chicken Breast', category: 'Protein', expiry_date: '2025-03-17', purchase_date: '2025-03-14' },
        { id: 2, product_id: 1002, product_name: 'Ground Beef', category: 'Protein', expiry_date: '2025-03-18', purchase_date: '2025-03-14' },
        { id: 3, product_id: 1003, product_name: 'Atlantic Salmon', category: 'Seafood', expiry_date: '2025-03-15', purchase_date: '2025-03-14' },
        { id: 4, product_id: 1004, product_name: 'Romaine Lettuce', category: 'Produce', expiry_date: '2025-03-16', purchase_date: '2025-03-14' },
        { id: 5, product_id: 1005, product_name: 'Tomatoes', category: 'Produce', expiry_date: '2025-03-15', purchase_date: '2025-03-14' }
      ];

      // Filter items that are expiring within the limit days
      const currentDate = new Date();
      const filteredItems = mockFoodItems.filter(item => {
        const expiryDate = new Date(item.expiry_date);
        const diffTime = expiryDate.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= limit;
      });

      setExpiringItems(filteredItems);
    } catch (err) {
      console.error('Error fetching expiring items:', err);
      setError('Failed to fetch expiring items');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!userPreference) return;
    
    try {
      // Prepare data for webhook
      const data = {
        userPreference: {
          email: userPreference.email,
          theme: userPreference.theme,
          limit: userPreference.limit
        },
        expiringItems: expiringItems
      };
      
      // Send data to webhook
      const response = await fetch('https://shn69.app.n8n.cloud/webhook-test/fa92b89e-92c8-43a9-9b1e-451ad0a1be96', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      console.log('Webhook response:', result);
      
      setFormSubmitted(true);
    } catch (err) {
      console.error('Error submitting to webhook:', err);
      setError('Failed to submit data to webhook');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading user preferences...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Food Inventory Expiry Alert System</h1>
      
      {userPreference && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold">User Preferences</h2>
          <p><strong>Email:</strong> {userPreference.email}</p>
          <p><strong>Theme:</strong> {userPreference.theme || 'Not set'}</p>
          <p><strong>Expiry Alert Limit:</strong> {userPreference.limit || 'Not set'} days</p>
        </div>
      )}
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Expiring Items ({expiringItems.length})</h2>
        {expiringItems.length > 0 ? (
          <table className="w-full mt-2 border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">ID</th>
                <th className="border border-gray-300 p-2">Product</th>
                <th className="border border-gray-300 p-2">Category</th>
                <th className="border border-gray-300 p-2">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {expiringItems.map(item => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-2">{item.product_id}</td>
                  <td className="border border-gray-300 p-2">{item.product_name}</td>
                  <td className="border border-gray-300 p-2">{item.category}</td>
                  <td className="border border-gray-300 p-2">{item.expiry_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No items are expiring soon.</p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Send Data to Webhook</h2>
        <div className="mb-3">
          <label htmlFor="field1" className="block mb-1">Theme:</label>
          <input 
            type="text" 
            id="field1" 
            name="field1" 
            className="border p-2 w-full" 
            required 
            value={userPreference?.theme || ''} 
            readOnly 
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="field2" className="block mb-1">Limit:</label>
          <input 
            type="text" 
            id="field2" 
            name="field2" 
            className="border p-2 w-full" 
            required 
            value={userPreference?.limit || ''} 
            readOnly 
          />
        </div>
        
        <button 
          type="submit" 
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          disabled={formSubmitted}
        >
          {formSubmitted ? 'Data Sent!' : 'Submit Data to Webhook'}
        </button>
        
        {formSubmitted && (
          <p className="mt-2 text-green-600">
            Data sent successfully! Check the console for the response.
          </p>
        )}
      </form>
    </div>
  );
};

export default DataRetrieve;