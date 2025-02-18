import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Table, Alert, Modal } from "react-bootstrap";
import { FaUserPlus, FaTrash, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("User");
    const [message, setMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const navigate = useNavigate();

    // Check if user is admin
    useEffect(() => {
        const userRole = localStorage.getItem("role");
        if (userRole !== "Admin") {
            navigate("/dashboard");
            alert("Access Denied: Admins only!");
        } else {
            fetchUsers();
        }
    }, []);

    // Fetch existing users
    const fetchUsers = async () => {
        try {
            const response = await fetch("https://battlekart-maintenance.onrender.com/api/users");
            const result = await response.json();
            if (response.ok) setUsers(result);
            else setMessage(result.error);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setMessage("Failed to connect to the server");
        }
    };

    // Add new user
    const handleAddUser = async () => {
        if (!username || !email || !password || !role) {
            setMessage("All fields are required");
            return;
        }

        try {
            const response = await fetch("https://battlekart-maintenance.onrender.com/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, role })
            });

            const result = await response.json();
            if (response.ok) {
                setMessage("User added successfully");
                setUsername("");
                setEmail("");
                setPassword("");
                setRole("User");
                fetchUsers();
            } else {
                setMessage(result.error || "Failed to add user");
            }
        } catch (error) {
            console.error("Failed to add user:", error);
            setMessage("Failed to connect to the server");
        }
    };

    // Handle delete user
    const confirmDeleteUser = (user) => {
        setUserToDelete(user);
        setShowModal(true);
    };

    const handleDeleteUser = async () => {
        try {
            const response = await fetch(`https://battlekart-maintenance.onrender.com/api/users/${userToDelete._id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                setMessage("User deleted successfully");
                setShowModal(false);
                fetchUsers();
            } else {
                const result = await response.json();
                setMessage(result.error || "Failed to delete user");
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
            setMessage("Failed to connect to the server");
        }
    };

    return (
        <Container className="mt-4">
            <Card className="p-4 shadow-sm">
                <h3 className="mb-4"><FaUsers className="me-2" />Admin Panel - User Management</h3>

                {message && <Alert variant="info">{message}</Alert>}

                <Form onSubmit={(e) => e.preventDefault()} className="mb-4">
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Role</Form.Label>
                        <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                        </Form.Select>
                    </Form.Group>

                    <Button variant="primary" className="w-100" onClick={handleAddUser}>
                        <FaUserPlus className="me-2" /> Add User
                    </Button>
                </Form>

                <h4 className="mt-4 mb-3"><FaUsers className="me-2" /> Existing Users</h4>
                <Table striped bordered hover responsive>
                    <thead className="table-dark">
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user._id}>
                                <td>{index + 1}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => confirmDeleteUser(user)}
                                    >
                                        <FaTrash /> Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete user "{userToDelete?.username}"?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteUser}>Delete</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Admin;
