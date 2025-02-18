import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ListGroup, Button, Container, Image } from "react-bootstrap";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import "../styles/sidebar.css";

const Sidebar = ({ theme }) => {
    const navigate = useNavigate();

    // Retrieve the logged-in user's name from localStorage or context
    const userName = localStorage.getItem("userName") || "Guest User"; 
    const initials = userName
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase())
        .join("");

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userName");
        navigate("/login");
    };

    const handleProfileClick = () => {
        navigate("/profile");
    };

    return (
        <div className="sidebar">
            <Container className="sidebar-container">
                {/* Logo Section */}
                <div className="logo-container">
                    <Image 
                        src={theme === "dark" ? logoDark : logoLight} 
                        alt="BattleKart Logo" 
                        className="logo"
                    />
                </div>

                {/* Navigation Links */}
                <ListGroup className="sidebar-links">
                    <ListGroup.Item as={Link} to="/dashboard">
                        Dashboard
                    </ListGroup.Item>
                    <ListGroup.Item as={Link} to="/admin">
                        Admin Panel
                    </ListGroup.Item>
                    <ListGroup.Item as={Link} to="/devices">
                        Devices
                    </ListGroup.Item>
                    <ListGroup.Item as={Link} to="/settings">
                        Settings
                    </ListGroup.Item>
                    <ListGroup.Item as={Link} to="/checklists">
                        Checklists
                    </ListGroup.Item>
                </ListGroup>

                {/* Profile & Logout Buttons */}
                <div className="profile-logout-container">
                    <button className="profile-initials" onClick={handleProfileClick} title="Profile">
                        {initials}
                    </button>
                    <Button variant="danger" className="logout-button" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </Container>
        </div>
    );
};

export default Sidebar;
