import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../App";
import { Container, Button, Form, ListGroup, Alert, Dropdown, DropdownButton, Row, Col } from "react-bootstrap";

const Settings = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [selectedSetting, setSelectedSetting] = useState("General");
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [newSubcategory, setNewSubcategory] = useState("");
    const [newField, setNewField] = useState("");
    const [message, setMessage] = useState("");
    const role = localStorage.getItem("role");

    useEffect(() => {
        if (selectedSetting === "Devices") {
            fetchSubcategories();
        }
    }, [selectedSetting]);

    const fetchSubcategories = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/subcategories");
            const data = await response.json();

            // ✅ Ensure data is an array
            if (Array.isArray(data)) {
                setSubcategories(data);
            } else {
                setSubcategories([]);
                console.error("Expected array but got:", data);
            }
        } catch (error) {
            console.error("❌ Error fetching subcategories:", error);
            setSubcategories([]);
        }
    };

    const handleAddSubcategory = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/subcategories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSubcategory }),
            });

            if (response.ok) {
                setMessage("✅ Subcategory added successfully!");
                setNewSubcategory("");
                fetchSubcategories();
            } else {
                setMessage("❌ Failed to add subcategory.");
            }
        } catch (error) {
            console.error("❌ Error adding subcategory:", error);
        }
    };

    const handleDeleteSubcategory = async (id) => {
        try {
            await fetch(`http://localhost:5000/api/subcategories/${id}`, { method: "DELETE" });
            fetchSubcategories();
            if (selectedSubcategory === id) {
                setSelectedSubcategory(null);
            }
        } catch (error) {
            console.error("❌ Error deleting subcategory:", error);
        }
    };

    const handleAddField = async () => {
        if (!selectedSubcategory || !newField.trim()) return;

        try {
            const response = await fetch(`http://localhost:5000/api/subcategories/${selectedSubcategory}/fields`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field: newField }),
            });

            if (response.ok) {
                setMessage("✅ Field added successfully!");
                setNewField("");
                fetchSubcategories();
            } else {
                setMessage("❌ Failed to add field.");
            }
        } catch (error) {
            console.error("❌ Error adding field:", error);
        }
    };

    const handleDeleteField = async (fieldToDelete) => {
        if (!selectedSubcategory) return;

        try {
            const response = await fetch(`http://localhost:5000/api/subcategories/${selectedSubcategory}/fields/remove`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field: fieldToDelete }),
            });

            if (response.ok) {
                setMessage("✅ Field deleted successfully!");
                fetchSubcategories();
            } else {
                setMessage("❌ Failed to delete field.");
            }
        } catch (error) {
            console.error("❌ Error deleting field:", error);
        }
    };

    return (
        <Container className="text-center mt-5">
            <h2>⚙️ Settings</h2>

            {role === "Admin" ? (
                <>
                    <DropdownButton title={`Settings: ${selectedSetting}`} className="mb-4">
                        <Dropdown.Item onClick={() => setSelectedSetting("General")}>General</Dropdown.Item>
                        <Dropdown.Item onClick={() => setSelectedSetting("Devices")}>Device Settings</Dropdown.Item>
                    </DropdownButton>

                    {selectedSetting === "General" && (
                        <div>
                            <h4>🌗 General Settings</h4>
                            <Button variant={theme === "dark" ? "light" : "dark"} onClick={toggleTheme}>
                                Toggle {theme === "dark" ? "Light" : "Dark"} Mode
                            </Button>
                        </div>
                    )}

                    {selectedSetting === "Devices" && (
                        <div>
                            <h4>🔧 Manage Subcategories</h4>
                            {message && <Alert variant="info">{message}</Alert>}

                            <Form onSubmit={handleAddSubcategory} className="mb-3">
                                <Row>
                                    <Col xs={9}>
                                        <Form.Group>
                                            <Form.Label>Subcategory Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={newSubcategory}
                                                onChange={(e) => setNewSubcategory(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col xs={3} className="d-flex align-items-end">
                                        <Button variant="primary" type="submit" className="w-100">
                                            ➕ Add Subcategory
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>

                            {/* List Subcategories */}
                            <ListGroup className="mb-4">
                                {Array.isArray(subcategories) && subcategories.length > 0 ? (
                                    subcategories.map((subcategory) => (
                                        <ListGroup.Item key={subcategory._id} className="d-flex justify-content-between">
                                            {subcategory.name}
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => setSelectedSubcategory(subcategory._id)}
                                                >
                                                    ⚙️ Manage Fields
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteSubcategory(subcategory._id)}
                                                >
                                                    ❌ Delete
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <p className="text-muted">⚠️ No subcategories available.</p>
                                )}
                            </ListGroup>

                            {selectedSubcategory && (
                                <>
                                    <h4>📋 Manage Fields</h4>
                                    <ListGroup className="mb-3">
                                        {subcategories.find(sc => sc._id === selectedSubcategory)?.fields?.map((field, index) => (
                                            <ListGroup.Item key={index} className="d-flex justify-content-between">
                                                {field}
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteField(field)}>
                                                    ❌ Delete Field
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>

                                    <Row>
                                        <Col xs={9}>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter Field Name"
                                                value={newField}
                                                onChange={(e) => setNewField(e.target.value)}
                                            />
                                        </Col>
                                        <Col xs={3}>
                                            <Button variant="success" className="w-100" onClick={handleAddField}>
                                                ➕ Add Field
                                            </Button>
                                        </Col>
                                    </Row>
                                </>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <Alert variant="danger">🚫 You do not have access to this page.</Alert>
            )}
        </Container>
    );
};

export default Settings;
