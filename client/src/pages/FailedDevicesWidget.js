import React, { useEffect, useState } from "react";
import { Container, Table, Alert, Spinner, Badge, Button, Modal, Form } from "react-bootstrap";

const FailedDevicesWidget = () => {
    const [failedDevices, setFailedDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedFailure, setSelectedFailure] = useState(null);
    const [rectificationDate, setRectificationDate] = useState("");

    // 🚀 Fetch devices and check failures
    const fetchFailedDevices = async () => {
        setLoading(true);
        try {
            const devicesResponse = await fetch("http://localhost:5000/api/devices");
            if (!devicesResponse.ok) throw new Error("Failed to fetch devices");
            const devices = await devicesResponse.json();

            let failures = [];

            // 🔍 Check each device's records
            for (const device of devices) {
                const recordsResponse = await fetch(`http://localhost:5000/api/checklistRecords?device=${device._id}`);
                if (!recordsResponse.ok) throw new Error(`Failed to fetch records for ${device.name}`);
                const records = await recordsResponse.json();

                // ⚠️ Analyze failures in these records
                records.forEach(record => {
                    Object.entries(record.responses).forEach(([field, response]) => {
                        if (response === "Fail") {
                            failures.push({
                                deviceName: device.name,
                                field,
                                severity: record.failureSeverity?.[field] || "Not specified",
                                note: record.failureDetails?.[field] || "No note provided",
                                createdAt: record.createdAt,
                                recordId: record._id
                            });
                        }
                    });
                });
            }

            // 🛠️ Sort by severity
            failures.sort((a, b) => {
                const severityOrder = { "Major": 1, "Moderate": 2, "Minor": 3, "Not specified": 4 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });

            setFailedDevices(failures);
        } catch (err) {
            console.error("❌ Failed to fetch failed devices:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFailedDevices();
    }, []);

    // 🛠️ Open the rectification modal
    const openModal = (failure) => {
        setSelectedFailure(failure);
        setRectificationDate("");
        setShowModal(true);
    };

    // ❌ Close the modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedFailure(null);
    };

    // ✅ Submit rectification
    const handleRectify = async () => {
        if (!rectificationDate) {
            alert("Please enter a rectification date.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/checklistRecords/rectify/${selectedFailure.recordId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field: selectedFailure.field, date: rectificationDate }),
            });

            if (!response.ok) throw new Error("Failed to rectify defect");

            // 🔄 Refresh the widget
            fetchFailedDevices();
            closeModal();
        } catch (error) {
            console.error("Error rectifying defect:", error);
            alert("Failed to rectify defect. Please try again.");
        }
    };

    // 🚨 Display failures
    return (
        <Container className="mt-4">
            <h3>🚨 Devices with Failures</h3>

            {loading ? (
                <Spinner animation="border" />
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : failedDevices.length === 0 ? (
                <Alert variant="success">✅ All devices are operational!</Alert>
            ) : (
                <Table striped bordered hover className="mt-3">
                    <thead>
                        <tr>
                            <th>Device Name</th>
                            <th>Field</th>
                            <th>Severity</th>
                            <th>Note</th>
                            <th>Failure Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {failedDevices.map((failure, index) => (
                            <tr key={index}>
                                <td>{failure.deviceName}</td>
                                <td>{failure.field}</td>
                                <td>
                                    <Badge bg={
                                        failure.severity === "Major" ? "danger" :
                                        failure.severity === "Moderate" ? "warning" : "info"
                                    }>
                                        {failure.severity}
                                    </Badge>
                                </td>
                                <td>{failure.note}</td>
                                <td>{new Date(failure.createdAt).toLocaleString()}</td>
                                <td>
                                    <Button variant="success" onClick={() => openModal(failure)}>
                                        ✅ Clear Fault
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* 🔧 Rectification Modal */}
            <Modal show={showModal} onHide={closeModal}>
                <Modal.Header closeButton>
                    <Modal.Title>🛠️ Rectify Device Fault</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>🔧 Device:</strong> {selectedFailure?.deviceName}</p>
                    <p><strong>📍 Field:</strong> {selectedFailure?.field}</p>
                    <Form.Group className="mb-3">
                        <Form.Label>📆 Date of Rectification</Form.Label>
                        <Form.Control
                            type="date"
                            value={rectificationDate}
                            onChange={(e) => setRectificationDate(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                    <Button variant="primary" onClick={handleRectify}>Submit</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default FailedDevicesWidget;
