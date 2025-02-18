import React, { useState, useEffect } from "react";
import { Button, Form, Modal, ListGroup, Alert } from "react-bootstrap";

const ChecklistFields = ({ checklistId, onFieldAdded }) => {
    const [newField, setNewField] = useState({ name: "", responseType: "text" });
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [fields, setFields] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/checklists/${checklistId}`);
            if (!response.ok) throw new Error("Failed to fetch fields.");
            const checklist = await response.json();
            setFields(checklist.fields || []);
            setError("");
        } catch (error) {
            console.error("❌ Error fetching fields:", error);
            setFields([]);
            setError("Failed to load fields.");
        }
    };

    const handleAddField = async (e) => {
        e.preventDefault();
        if (!newField.name) {
            setError("Field name is required.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/checklists/${checklistId}/add-field`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newField)
            });
            if (!response.ok) throw new Error("Failed to add field.");
            setShowFieldModal(false);
            setNewField({ name: "", responseType: "text" });
            fetchFields();
            if (onFieldAdded) onFieldAdded();
        } catch (error) {
            console.error("❌ Error adding field:", error);
            setError(error.message);
        }
    };

    const handleDeleteField = async (fieldName) => {
        try {
            const response = await fetch(`http://localhost:5000/api/checklists/${checklistId}/delete-field`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: fieldName })
            });
            if (!response.ok) throw new Error("Failed to delete field.");
            fetchFields();
            if (onFieldAdded) onFieldAdded();
        } catch (error) {
            console.error("❌ Error deleting field:", error);
            setError("Failed to delete field.");
        }
    };

    return (
        <div className="mt-3">
            <Button variant="success" size="sm" onClick={() => setShowFieldModal(true)}>Add Custom Field</Button>

            {fields.length > 0 ? (
                <ListGroup className="mt-3">
                    {fields.map((field, index) => (
                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                            <span><strong>{field.name}</strong> ({field.responseType})</span>
                            <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleDeleteField(field.name)}
                            >
                                Delete
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : (
                <p className="text-muted mt-2">No fields found.</p>
            )}

            {error && <Alert variant="danger" className="mt-2">{error}</Alert>}

            <Modal show={showFieldModal} onHide={() => setShowFieldModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Custom Field</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddField}>
                        <Form.Group>
                            <Form.Label>Field Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newField.name}
                                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Response Type</Form.Label>
                            <Form.Control
                                as="select"
                                value={newField.responseType}
                                onChange={(e) => setNewField({ ...newField, responseType: e.target.value })}
                            >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="pass/fail">Pass/Fail</option>
                            </Form.Control>
                        </Form.Group>
                        <Button type="submit" className="mt-3">Add Field</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ChecklistFields;
