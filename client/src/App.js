import React, { useState, createContext, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Devices from "./pages/Devices";
import Checklists from "./pages/Checklists";
import Inspect from "./pages/Inspect";
import Profile from "./pages/Profile"; // ✅ Import Profile
import Sidebar from "./components/Sidebar";
import "./styles.css"; // ✅ Ensure global styles load

const ThemeContext = createContext();

const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
        }
    }, [token, navigate]);

    return token ? children : null;
};

// ✅ Ensures Sidebar only appears on non-login pages
const Layout = ({ children }) => {
    const location = useLocation();
    const isLoginPage = location.pathname === "/login";

    return (
        <div className={`app-container ${isLoginPage ? "login-page" : ""}`}>
            {!isLoginPage && <Sidebar />}
            <div className="main-content">
                {children}
            </div>
        </div>
    );
};

function App() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

    useEffect(() => {
        document.body.className = theme;
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme }}>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
                        <Route path="/checklists" element={<ProtectedRoute><Checklists /></ProtectedRoute>} />
                        <Route path="/inspect/:deviceId" element={<ProtectedRoute><Inspect /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> {/* ✅ New Route */}
                    </Routes>
                </Layout>
            </Router>
        </ThemeContext.Provider>
    );
}

export { ThemeContext };
export default App;
