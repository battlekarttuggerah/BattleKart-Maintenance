import React, { useState, useEffect } from "react";
import { Container, Button, Form, ListGroup, Alert, Modal } from "react-bootstrap";
import ChecklistFields from "./ChecklistFields";

const Checklists = () => {
    const [checklists, setChecklists] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [newChecklist, setNewChecklist] = useState({ name: "", frequency: "", subcategory: "" });
    const [editingChecklist, setEditingChecklist] = useState(null);
    const [message, setMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchChecklists();
        fetchSubcategories();
    }, []);

    // ✅ Fetch Checklists
    const fetchChecklists = async () => {
        try {
            const response = await fetch("https://battlekart-maintenance.onrender.com/api/checklists");
            if (!response.ok) throw new Error("Failed to fetch checklists.");
            const data = await response.json();
            setChecklists(data);
        } catch (error) {
            console.error("❌ Error fetching checklists:", error);
            setMessage("Failed to load checklists.");
        }
    };

    // ✅ Fetch Subcategories
    const fetchSubcategories = async () => {
        try {
            console.log("📡 Fetching subcategories...");
            const response = await fetch("https://battlekart-maintenance.onrender.com/api/subcategories");
            const data = await response.json();
            console.log("🔍 Subcategories fetched:", data);
            setSubcategories(data);
        } catch (error) {
            console.error("❌ Error fetching subcategories:", error);
            setMessage("Failed to load subcategories.");
        }
    };

    // ✅ Add Checklist
    const handleAddChecklist = async (e) => {
        e.preventDefault();
        if (!newChecklist.name || !newChecklist.frequency || !newChecklist.subcategory) {
            setMessage("Checklist name, frequency, and subcategory are required.");
            return;
        }

        try {
            const response = await fetch("https://battlekart-maintenance.onrender.com/api/checklists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newChecklist.name.trim(),
                    frequency: parseInt(newChecklist.frequency, 10),
                    subcategory: newChecklist.subcategory,
                    fields: []
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add checklist.");
            }

            setShowModal(false);
            setNewChecklist({ name: "", frequency: "", subcategory: "" });
            fetchChecklists();
        } catch (error) {
            console.error("❌ Error adding checklist:", error);
            setMessage(error.message);
        }
    };

    // ✅ Edit Checklist
    const handleEditChecklist = async (e) => {
        e.preventDefault();
        if (!editingChecklist) return;

        try {
            const response = await fetch(`https://battlekart-maintenance.onrender.com/api/checklists/${editingChecklist._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingChecklist.name,
                    frequency: editingChecklist.frequency,
                    subcategory: editingChecklist.subcategory
                }),
            });

            if (!response.ok) throw new Error("Failed to update checklist.");

            console.log("✅ Checklist updated successfully");
            setShowEditModal(false);
            fetchChecklists();
        } catch (error) {
            console.error("❌ Error updating checklist:", error);
        }
    };

    // ✅ Delete Checklist
    const handleDeleteChecklist = async (id) => {
        try {
            const response = await fetch(`https://battlekart-maintenance.onrender.com/api/checklists/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete checklist.");
            setChecklists(checklists.filter(c => c._id !== id));
        } catch (error) {
            console.error("❌ Error deleting checklist:", error);
        }
    };

    return (
        <Container>
            <h2>Checklists</h2>
            {message && <Alert variant="danger">{message}</Alert>}
            <Button onClick={() => setShowModal(true)}>Add Checklist</Button>

            <ListGroup className="mt-3">
                {checklists.map((checklist) => (
                    <ListGroup.Item key={checklist._id}>
                        <div className="d-flex justify-content-between align-items-center">
                            <strong>{checklist.name}</strong> ({checklist.frequency} days)
                            <div>
                                <Button 
                                    variant="info" 
                                    size="sm" 
                                    onClick={() => {
                                        setEditingChecklist({ ...checklist });
                                        setShowEditModal(true);
                                    }}
                                >
                                    Edit
                                </Button>
                                <Button 
                                    variant="danger" 
                                    size="sm" 
                                    onClick={() => handleDeleteChecklist(checklist._id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>

                        {/* Render fields only through ChecklistFields component */}
                        <ChecklistFields checklistId={checklist._id} onFieldAdded={fetchChecklists} />
                    </ListGroup.Item>
                ))}
            </ListGroup>

            {/* Add Checklist Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Checklist</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddChecklist}>
                        <Form.Group>
                            <Form.Label>Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={newChecklist.name} 
                                onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })} 
                                required 
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Frequency (days)</Form.Label>
                            <Form.Control 
                                type="number" 
                                value={newChecklist.frequency} 
                                onChange={(e) => setNewChecklist({ ...newChecklist, frequency: e.target.value })} 
                                required 
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Subcategory</Form.Label>
                            <Form.Control 
                                as="select" 
                                value={newChecklist.subcategory} 
                                onChange={(e) => setNewChecklist({ ...newChecklist, subcategory: e.target.value })}
                                required
                            >
                                <option value="">-- Select Subcategory --</option>
                                {subcategories.length > 0 ? (
                                    subcategories.map((subcategory) => (
                                        <option key={subcategory._id} value={subcategory._id}>
                                            {subcategory.name}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Loading subcategories...</option>
                                )}
                            </Form.Control>
                        </Form.Group>
                        <Button type="submit">Add Checklist</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit Checklist Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Checklist</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {editingChecklist && (
                        <Form onSubmit={handleEditChecklist}>
                            <Form.Group>
                                <Form.Label>Name</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={editingChecklist.name} 
                                    onChange={(e) => setEditingChecklist({ ...editingChecklist, name: e.target.value })} 
                                    required 
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Frequency (days)</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={editingChecklist.frequency} 
                                    onChange={(e) => setEditingChecklist({ ...editingChecklist, frequency: e.target.value })} 
                                    required 
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Subcategory</Form.Label>
                                <Form.Control 
                                    as="select" 
                                    value={editingChecklist.subcategory} 
                                    onChange={(e) => setEditingChecklist({ ...editingChecklist, subcategory: e.target.value })}
                                    required
                                >
                                    <option value="">-- Select Subcategory --</option>
                                    {subcategories.length > 0 ? (
                                        subcategories.map((subcategory) => (
                                            <option key={subcategory._id} value={subcategory._id}>
                                                {subcategory.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>Loading subcategories...</option>
                                    )}
                                </Form.Control>
                            </Form.Group>
                            <Button type="submit">Save Changes</Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Checklists;
