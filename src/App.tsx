import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SignUp from "./component/Signup";
import LoginPage from "./component/Loginpage";
import HomePage from "./component/Homepage";
import CardView from "./component/CardView"; // Import CardView component
import TableView from "./component/TableView"; // Import TableView component
// import GraphView from "./component/GraphView"; // Import GraphView component
import { supabase } from "./component/Supabaseclient.tsx";
import Graphview from "./component/Graphview.tsx";
import Aiprompt from "./component/Aiprompt.tsx";
import Airetrieve from "./component/Airetrieve.tsx";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount and listen for auth changes
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkUser();

    // Listen for auth state changes (e.g., login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    // Cleanup subscription on unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/aiprompt" element={<Aiprompt/>} />
        <Route path="/airetrieve" element={isAuthenticated ? <Airetrieve/> : <Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/home" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/cardview" element={isAuthenticated ? <CardView /> : <Navigate to="/login" />} />
        <Route path="/table-view" element={isAuthenticated ? <TableView /> : <Navigate to="/login" />} />
        <Route path="/graph-view" element={isAuthenticated ? <Graphview /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
