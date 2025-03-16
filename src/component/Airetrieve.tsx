import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook

export default function Airetrieve() {
  const navigate = useNavigate(); // Initialize the navigate function
  const [restaurantTheme, setRestaurantTheme] = useState("");
  const [expirationDate, setExpirationDate] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string | null>(null);
  const [parsedDishes, setParsedDishes] = useState<Array<{name: string, details: string}>>([]);
  const [activeTab, setActiveTab] = useState("generate"); // For tab navigation

  // n8n webhook URLs (modify if needed)
  const n8nWebhookURL = "https://shn69.app.n8n.cloud/webhook-test/fa92b89e-92c8-43a9-9b1e-451ad0a1be96"; // POST request
  const n8nResultsURL = "https://shn69.app.n8n.cloud/webhook-results"; // GET request for results (Modify this as needed)

  // Function to navigate back to homepage
  const navigateToHomepage = () => {
    navigate("/home"); // This will use React Router to navigate to the Homepage
  };

  // Function to fetch inventory data and poll for results
  const fetchInventoryData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    setParsedDishes([]);

    try {
      // Step 1: Send Data via POST Request
      const postResponse = await fetch(n8nWebhookURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          field1: restaurantTheme,
          field2: expirationDate.toString(),
        }),
      });

      if (!postResponse.ok) {
        // Fallback to form submission if fetch fails
        console.log('Trying alternative submission method...');
        
        // Create a traditional HTML form and submit it manually
        const tempForm = document.createElement('form');
        tempForm.method = 'POST';
        tempForm.action = n8nWebhookURL;
        tempForm.style.display = 'none';
        
        const field1Input = document.createElement('input');
        field1Input.name = 'field1';
        field1Input.value = restaurantTheme;
        tempForm.appendChild(field1Input);
        
        const field2Input = document.createElement('input');
        field2Input.name = 'field2';
        field2Input.value = expirationDate.toString();
        tempForm.appendChild(field2Input);
        
        // Create an iframe to capture the response
        const iframe = document.createElement('iframe');
        iframe.name = 'responseFrame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Create a hidden input to store the response
        const responseInput = document.createElement('input');
        responseInput.type = 'hidden';
        responseInput.id = 'responseData';
        tempForm.appendChild(responseInput);
        
        iframe.onload = () => {
          try {
            console.log('Response received in iframe');
            
            // Try to access the iframe content and extract the response
            try {
              // Wait a moment for the response to load
              setTimeout(() => {
                try {
                  // Try to get the response from the iframe
                  const iframeContent = iframe.contentDocument || iframe.contentWindow?.document;
                  if (iframeContent) {
                    const responseText = iframeContent.body.innerText || iframeContent.body.textContent;
                    console.log('Iframe response:', responseText);
                    
                    // Check if we got a valid response
                    if (responseText && responseText.length > 0) {
                      setResults(responseText);
                      parseDishesFromText(responseText);
                    } else {
                      // If we can't get the content directly, try to parse it from pre tags
                      const preTags = iframeContent.getElementsByTagName('pre');
                      if (preTags.length > 0) {
                        const preContent = preTags[0].textContent || '';
                        setResults(preContent);
                        parseDishesFromText(preContent);
                      } else {
                        setResults("Response received but couldn't extract content. Check console for details.");
                      }
                    }
                  }
                } catch (contentErr) {
                  console.error('Error accessing iframe content:', contentErr);
                  setResults("Response received but couldn't extract content due to security restrictions.");
                }
                
                setLoading(false);
                
                // Clean up
                document.body.removeChild(iframe);
                document.body.removeChild(tempForm);
              }, 1500); // Give it a bit more time to load
            } catch (frameContentErr) {
              console.error('Error accessing iframe content:', frameContentErr);
              setResults("Response received but couldn't extract content due to security restrictions.");
              setLoading(false);
            }
          } catch (frameErr) {
            console.error('Could not access iframe content:', frameErr);
            setLoading(false);
          }
        };
        
        tempForm.target = 'responseFrame';
        document.body.appendChild(tempForm);
        tempForm.submit();
        
        return; // Exit early since we're handling the response in the iframe
      }

      // If the fetch was successful, try to extract the response content
      let responseData;
      const contentType = postResponse.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await postResponse.json();
        console.log("JSON Response:", responseData);
        
        // Handle JSON response - extract the text content
        if (typeof responseData === 'object') {
          // If it's an object, try to find a text field or stringify it
          if (responseData.text || responseData.content || responseData.result || responseData.output) {
            const textContent = responseData.text || responseData.content || responseData.result || responseData.output;
            setResults(textContent);
            parseDishesFromText(textContent);
          } else {
            const jsonString = JSON.stringify(responseData, null, 2);
            setResults(jsonString);
            parseDishesFromText(jsonString);
          }
        } else {
          const stringContent = String(responseData);
          setResults(stringContent);
          parseDishesFromText(stringContent);
        }
      } else {
        // Handle text response
        responseData = await postResponse.text();
        console.log("Text Response:", responseData);
        setResults(responseData);
        parseDishesFromText(responseData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error during fetch:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setLoading(false);
    }
  };

  // Update the parseDishesFromText function to better handle recipe output
  const parseDishesFromText = (text: string) => {
    try {
      const dishes: Array<{name: string, details: string}> = [];
      
      // Check if this is a recipe suggestion output
      if (text.includes("Recipe Suggestions:") || text.includes("expiring within the next")) {
        // First, extract the expiring ingredients section
        const expiringIngredientsMatch = text.match(/The following items are expiring.*?(?=##\s*Recipe Suggestions:|$)/s);
        if (expiringIngredientsMatch) {
          // Process the expiring ingredients section
          const expiringText = expiringIngredientsMatch[0].trim();
          
          // Split by categories if they exist
          const categories = expiringText.split(/\*\*([^:*]+):\*\*/);
          
          if (categories.length > 1) {
            // We have categories
            let currentCategory = "Expiring Items";
            
            for (let i = 0; i < categories.length; i++) {
              const section = categories[i].trim();
              
              if (i % 2 === 1) {
                // This is a category name
                currentCategory = section;
              } else if (section && i > 0) {
                // This is category content
                dishes.push({
                  name: currentCategory,
                  details: cleanupText(section)
                });
              } else if (section && i === 0) {
                // This is the intro text
                dishes.push({
                  name: "Expiring Items",
                  details: cleanupText(section)
                });
              }
            }
          } else {
            // No categories, just add the whole section
            dishes.push({
              name: "Expiring Items",
              details: cleanupText(expiringText)
            });
          }
        }
        
        // Extract recipe suggestions
        const recipeSuggestionsMatch = text.match(/##\s*Recipe Suggestions:(.*?)(?=##\s*Additional Tips:|$)/s);
        if (recipeSuggestionsMatch) {
          const recipeText = recipeSuggestionsMatch[1].trim();
          
          // Extract individual recipes
          const recipes = recipeText.split(/\*\*\d+\.\s+([^:*]+):\*\*/);
          
          if (recipes.length > 1) {
            let currentRecipe = "";
            
            for (let i = 0; i < recipes.length; i++) {
              const section = recipes[i].trim();
              
              if (i % 2 === 1) {
                // This is a recipe name
                currentRecipe = section;
              } else if (section && i > 0) {
                // This is recipe content
                dishes.push({
                  name: currentRecipe,
                  details: cleanupText(section)
                });
              }
            }
          } else {
            // If we couldn't parse individual recipes, add the whole section
            dishes.push({
              name: "Recipe Suggestions",
              details: cleanupText(recipeText)
            });
          }
        }
        
        // Extract additional tips
        const tipsMatch = text.match(/##\s*Additional Tips:(.*?)$/s);
        if (tipsMatch) {
          dishes.push({
            name: "Additional Tips",
            details: cleanupText(tipsMatch[1].trim())
          });
        }
      }
      
      // If we couldn't parse as recipes or it's not a recipe format, fall back to the original parsing logic
      if (dishes.length === 0) {
        const lines = text.split('\n');
        let currentDish: {name: string, details: string} | null = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines
          if (!line) continue;
          
          // Check if this line looks like a dish name/header
          const isDishHeader = 
            /^\d+[\.\)]\s+/.test(line) || // Numbered list
            /^\*\*[^*]+\*\*/.test(line) || // Markdown bold text
            /^[A-Z][^a-z]*:/.test(line) || // ALL CAPS with colon
            /^[A-Z][a-zA-Z\s]{1,30}:/.test(line) || // Title Case with colon
            /^[A-Z][a-zA-Z\s]{1,30}$/.test(line) && line.length < 30 || // Short Title Case line
            /(dish|recipe|item|ingredient|food)/i.test(line) && line.length < 50; // Contains key words
          
          if (isDishHeader) {
            // If we were building a previous dish, save it
            if (currentDish) {
              dishes.push(currentDish);
            }
            
            // Start a new dish - clean up markdown formatting
            currentDish = {
              name: line.replace(/^\d+[\.\)]\s+/, '')
                      .replace(/^\*\*|\*\*$/g, '')
                      .replace(/:$/, ''),
              details: ''
            };
          } else if (currentDish) {
            // Add this line to the current dish's details
            currentDish.details += (currentDish.details ? '\n' : '') + line;
          } else {
            // If we haven't found a dish header yet, this might be introductory text
            currentDish = {
              name: "Introduction",
              details: line
            };
          }
        }
        
        // Don't forget to add the last dish
        if (currentDish) {
          dishes.push(currentDish);
        }
      }
      
      // If we still couldn't parse any dishes, create a single card with all content
      if (dishes.length === 0) {
        dishes.push({
          name: "Inventory Report",
          details: cleanupText(text)
        });
      }
      
      setParsedDishes(dishes);
    } catch (error) {
      console.error("Error parsing dishes:", error);
      // Fallback to showing the raw text
      setParsedDishes([{
        name: "Inventory Report",
        details: cleanupText(text)
      }]);
    }
  };

  // Helper function to clean up text by removing markdown symbols
  const cleanupText = (text: string) => {
    return text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove bullet points
      .replace(/^[-•]\s+/gm, '• ') // Replace bullet points with a clean bullet
      .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim();
  };

  // Dummy functions for the additional buttons
  const handleSaveReport = () => {
    alert("Report saved successfully!");
  };

  const handleShareReport = () => {
    alert("Report shared successfully!");
  };

  return (
    <div className="min-h-screen bg-black bg-grid flex flex-col items-center p-6">
      {/* Add the grid background style from LoginPage */}
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

      {/* Back to Homepage Button */}
      <div className="absolute top-4 left-4">
        <motion.button
          onClick={navigateToHomepage}
          className="flex items-center space-x-2 bg-gray-800 text-green-400 px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back to Home</span>
        </motion.button>
      </div>

      <motion.h2
        className="text-3xl font-bold text-green-400 mb-6 mt-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        🍽 AI-Generated Inventory Report
      </motion.h2>

      {/* Navigation Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "generate" 
              ? "bg-green-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Generate Report
        </button>
        <button
          onClick={() => setActiveTab("save")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "save" 
              ? "bg-green-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Save Report
        </button>
        <button
          onClick={() => setActiveTab("share")}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            activeTab === "share" 
              ? "bg-green-500 text-white" 
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Share Report
        </button>
      </div>

      {/* Form to send data */}
      {activeTab === "generate" && (
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form onSubmit={fetchInventoryData} className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-600">
            <div className="mb-4">
              <label className="text-green-300 block font-semibold mb-2">Restaurant Theme:</label>
              <input
                type="text"
                value={restaurantTheme}
                onChange={(e) => setRestaurantTheme(e.target.value)}
                required
                placeholder="e.g., Italian, South Indian"
                className="w-full p-2 border rounded mt-1 bg-gray-700 text-white border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-4">
              <label className="text-green-300 block font-semibold mb-2">Expiration Date (Days):</label>
              <input
                type="number"
                value={expirationDate}
                onChange={(e) => setExpirationDate(Number(e.target.value))}
                required
                min="1"
                className="w-full p-2 border rounded mt-1 bg-gray-700 text-white border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate Report"}
            </button>
          </form>
        </motion.div>
      )}

      {/* Save Report Tab */}
      {activeTab === "save" && (
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-600 w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-green-400 mb-4">Save Your Report</h3>
          <p className="text-gray-300 mb-4">Save your generated report for future reference.</p>
          
          <div className="mb-4">
            <label className="text-green-300 block font-semibold mb-2">Report Name:</label>
            <input
              type="text"
              placeholder="Enter a name for your report"
              className="w-full p-2 border rounded mt-1 bg-gray-700 text-white border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <button 
            onClick={handleSaveReport}
            className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
          >
            Save Report
          </button>
        </motion.div>
      )}

      {/* Share Report Tab */}
      {activeTab === "share" && (
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-600 w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-green-400 mb-4">Share Your Report</h3>
          <p className="text-gray-300 mb-4">Share your generated report with team members or colleagues.</p>
          
          <div className="mb-4">
            <label className="text-green-300 block font-semibold mb-2">Email Address:</label>
            <input
              type="email"
              placeholder="Enter recipient's email"
              className="w-full p-2 border rounded mt-1 bg-gray-700 text-white border-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <button 
            onClick={handleShareReport}
            className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
          >
            Share Report
          </button>
        </motion.div>
      )}

      {/* Loading Indicator */}
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

      {/* Error Message */}
      {error && <p className="text-red-400 mt-6">{error}</p>}

      {/* Results Section - Card-based Display */}
      {parsedDishes.length > 0 && (
        <div className="w-full max-w-2xl mt-6">
          <h3 className="text-green-300 text-xl font-bold mb-4">Inventory Report</h3>
          
          <div className="grid gap-4">
            {parsedDishes.map((dish, index) => (
              <motion.div
                key={index}
                className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <h4 className="text-green-300 text-lg font-semibold mb-2">{dish.name}</h4>
                <div className="text-white">
                  {dish.details.split('\n').map((line, i) => {
                    // Skip empty lines
                    if (!line.trim()) return null;
                    
                    // Format ingredient lists and instructions
                    if (line.trim().startsWith('•')) {
                      return (
                        <div key={i} className="flex mb-2">
                          <span className="text-green-400 mr-2">•</span>
                          <span>{line.replace(/^•\s*/, '')}</span>
                        </div>
                      );
                    } else if (line.includes('Ingredients:')) {
                      return <p key={i} className="font-semibold text-green-300 mt-2 mb-1">{line}</p>;
                    } else if (line.includes('Instructions:')) {
                      return <p key={i} className="font-semibold text-green-300 mt-2 mb-1">{line}</p>;
                    } else {
                      return <p key={i} className="mb-2">{line}</p>;
                    }
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Keep the original results display as a fallback, but hide it if we have parsed dishes */}
      {results && parsedDishes.length === 0 && (
        <motion.div
          className="bg-gray-800 p-6 mt-6 rounded-lg shadow-md text-white max-w-2xl border border-gray-600"
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
