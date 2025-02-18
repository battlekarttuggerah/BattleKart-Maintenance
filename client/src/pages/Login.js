import React, { useState, useContext } from "react";
import { loginUser } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert, Card, Image } from "react-bootstrap";
import { ThemeContext } from "../App";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const { theme } = useContext(ThemeContext);

    const logoSrc = theme === "dark" ? "/logo-dark.png" : "/logo-light.png";

    // 🆕 Function to fetch username after login
    const fetchUsernameByEmail = async (email) => {
        try {
            const response = await fetch(`https://battlekart-maintenance.onrender.com/api/users/username-by-email?email=${email}`);
            const data = await response.json();
            if (response.ok && data.username) {
                localStorage.setItem("userName", data.username);
                console.log("Username fetched and stored:", data.username);
            } else {
                console.warn("⚠️ Failed to fetch username:", data.error);
            }
        } catch (error) {
            console.error("Failed to fetch username:", error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const response = await loginUser({ email, password });

        if (response.token) {
            setMessage("Login successful!");
            localStorage.setItem("token", response.token);
            localStorage.setItem("role", response.role);

            // 🆕 ✅ Fetch username using email and store it
            await fetchUsernameByEmail(email);

            navigate(response.role === "admin" ? "/admin" : "/dashboard");
        } else {
            setMessage("Login failed: " + response.msg);
        }
    };

    return (
        <Container className={`d-flex flex-column align-items-center justify-content-center vh-100 ${theme}`}>
            <Card className={`p-4 shadow-lg ${theme === "dark" ? "text-light bg-dark" : "text-dark bg-light"}`}>
                <Card.Body>
                    <div className="text-center mb-3">
                        <Image src={logoSrc} alt="BattleKart Logo" width="150" />
                    </div>
                    <h2 className="text-center">Login</h2>
                    {message && <Alert variant="danger">{message}</Alert>}
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100">
                            Login
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Login;
