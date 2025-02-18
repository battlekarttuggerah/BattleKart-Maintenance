import React, { useState, useEffect } from "react";
import { Container, ListGroup, Button, Form, Alert, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Devices = () => {
    const [subcategories, setSubcategories] = useState([]);
    const [devices, setDevices] = useState([]);
    const [selectedSubcategory, setSelectedSubcategory] = useState("");
    const [customFields, setCustomFields] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [message, setMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const role = localStorage.getItem("role");
    const navigate = useNavigate(); 

    useEffect(() => {
        fetchSubcategories();
    }, []);

    const fetchSubcategories = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/subcategories");
            if (!response.ok) throw new Error("Failed to fetch subcategories");
            const data = await response.json();
            setSubcategories(data);
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    const fetchDevices = async (subcategoryId) => {
        if (!subcategoryId) return;

        setSelectedSubcategory(subcategoryId);
        const selectedSubcat = subcategories.find(sc => sc._id === subcategoryId);
        if (selectedSubcat) {
            setCustomFields(selectedSubcat.fields || []);
        }

        try {
            const response = await fetch(`http://localhost:5000/api/devices?subcategory=${subcategoryId}`);
            if (!response.ok) throw new Error("Failed to fetch devices");
            const data = await response.json();
            setDevices(data);
        } catch (error) {
            console.error("Error fetching devices:", error);
        }
    };

    const handleOpenModal = (device = null) => {
        if (!selectedSubcategory) {
            setMessage("Please select a subcategory first.");
            return;
        }

        if (device) {
            setSelectedDevice({
                ...device,
                customFields: device.customFields || {}
            });
        } else {
            setSelectedDevice({
                name: "",
                customFields: Object.fromEntries(customFields.map(field => [field, ""]))
            });
        }

        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleInspect = (deviceId) => {
        console.log("Inspecting device:", deviceId);
        navigate(`/inspect/${deviceId}`);
    };

    const handleDeleteDevice = async (deviceId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/devices/${deviceId}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Failed to delete device");

            console.log("✅ Device deleted successfully");
            fetchDevices(selectedSubcategory); 
        } catch (error) {
            console.error("❌ Error deleting device:", error);
            setMessage("Failed to delete device.");
        }
    };

    const handleSaveDevice = async () => {
        try {
            const method = selectedDevice._id ? "PUT" : "POST";
            const url = selectedDevice._id 
                ? `http://localhost:5000/api/devices/${selectedDevice._id}` 
                : `http://localhost:5000/api/devices`;

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: selectedDevice.name,
                    subcategory: selectedSubcategory,
                    customFields: selectedDevice.customFields,
                }),
            });

            if (!response.ok) throw new Error("Failed to save device");

            console.log("✅ Device saved successfully");
            setShowModal(false);
            fetchDevices(selectedSubcategory);
        } catch (error) {
            console.error("❌ Error saving device:", error);
            setMessage("Failed to save device.");
        }
    };

    // 🆕 Generate Full Report Across All Devices
    const generateFullReport = async () => {
        const doc = new jsPDF();
        const logoPath = "/logo.png";

        // Add report header
        doc.addImage(logoPath, "PNG", 10, 10, 40, 40);
        doc.setFontSize(22);
        doc.text("BattleKart Tuggerah - Full Device Inspection Report", 60, 20);
        doc.setFontSize(14);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 60);

        let yPosition = 80;

        try {
            // Fetch all subcategories
            const subcatResponse = await fetch("http://localhost:5000/api/subcategories");
            if (!subcatResponse.ok) throw new Error("Failed to fetch subcategories");
            const subcats = await subcatResponse.json();

            // Iterate over each subcategory to fetch devices and their records
            for (const subcat of subcats) {
                const devicesResponse = await fetch(`http://localhost:5000/api/devices?subcategory=${subcat._id}`);
                if (!devicesResponse.ok) throw new Error(`Failed to fetch devices for ${subcat.name}`);
                const devicesData = await devicesResponse.json();

                // Process each device
                for (const device of devicesData) {
                    // Fetch checklist records for the current device
                    const recordsResponse = await fetch(`http://localhost:5000/api/checklistRecords?device=${device._id}`);
                    if (!recordsResponse.ok) {
                        console.warn(`⚠️ Failed to fetch records for ${device.name}`);
                        continue;
                    }
                    const records = await recordsResponse.json();

                    if (records.length === 0) continue;

                    // Add device header to PDF
                    doc.setFontSize(16);
                    doc.text(`Device: ${device.name}`, 10, yPosition);
                    yPosition += 6;
                    doc.setFontSize(12);
                    doc.text(`Subcategory: ${subcat.name}`, 10, yPosition);
                    yPosition += 10;

                    // Prepare table data
                    const tableData = records.map(record => {
                        const result = Object.values(record.responses).includes("Fail") 
                            ? "Fail"
                            : Object.values(record.responses).includes("Rectified") 
                                ? "Rectified" 
                                : "Pass";

                        let failureDetails = "";
                        Object.entries(record.responses).forEach(([field, response]) => {
                            if (response === "Fail" || response === "Rectified") {
                                const note = record.failureDetails?.[field] ?? "No note provided";
                                const severity = record.failureSeverity?.[field] ?? "Not specified";
                                const rectifiedDate = record.rectifiedDate?.[field] ?? "Not rectified";

                                failureDetails += `${field}: Note=${note}, Severity=${severity}, Rectified=${rectifiedDate}\n`;
                            }
                        });

                        return [
                            record.checklist?.name || "Unknown",
                            record.completedBy,
                            new Date(record.createdAt).toLocaleString(),
                            result,
                            failureDetails || "None"
                        ];
                    });

                    // Insert table into PDF
                    doc.autoTable({
                        startY: yPosition,
                        head: [["Checklist", "Completed By", "Date", "Result", "Failure Details"]],
                        body: tableData,
                        theme: "striped",
                        styles: { fontSize: 10, halign: "center" }
                    });

                    yPosition = doc.lastAutoTable.finalY + 10;

                    // Add new page if space runs out
                    if (yPosition > 260) {
                        doc.addPage();
                        yPosition = 10;
                    }
                }
            }

            // Save PDF
            doc.save(`Full_Device_Inspection_Report_${new Date().toISOString()}.pdf`);

        } catch (error) {
            console.error("❌ Error generating full report:", error);
            alert(`Failed to generate report: ${error.message}`);
        }
    };

    return (
        <Container className="devices-container">
            <h2 className="mt-4">Devices</h2>

            {message && <Alert variant="danger">{message}</Alert>}

            {/* 🆕 ✅ Generate Full Report Button */}
            <Button variant="success" className="mb-3" onClick={generateFullReport}>
                📄 Generate Full Device Report
            </Button>

            {/* Subcategory Selector */}
            <Form.Group className="mb-3">
                <Form.Label>Select a Subcategory</Form.Label>
                <Form.Select
                    value={selectedSubcategory}
                    onChange={(e) => fetchDevices(e.target.value)}
                >
                    <option value="">Select...</option>
                    {subcategories.map((subcategory) => (
                        <option key={subcategory._id} value={subcategory._id}>
                            {subcategory.name}
                        </option>
                    ))}
                </Form.Select>
            </Form.Group>

            {/* ✅ Add Device Button */}
            {selectedSubcategory && (
                <Button variant="primary" className="mb-3" onClick={() => handleOpenModal()}>
                    Add Device
                </Button>
            )}

            {/* Device List */}
            {selectedSubcategory && (
                <ListGroup className="mt-3">
                    {devices.map((device) => (
                        <ListGroup.Item key={device._id} className="d-flex justify-content-between align-items-center">
                            <span>
                                <strong>{device.name}</strong>
                                {device.customFields &&
                                    Object.entries(device.customFields).map(([key, value]) => (
                                        <span key={key}> | {key}: {value || "N/A"}</span>
                                    ))}
                            </span>

                            <div>
                                <Button 
                                    variant="success" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => handleInspect(device._id)}
                                >
                                    Inspect
                                </Button>
                                {role === "Admin" && (
                                    <>
                                        <Button 
                                            variant="info" 
                                            size="sm" 
                                            className="me-2"
                                            onClick={() => handleOpenModal(device)}
                                        >
                                            Edit
                                        </Button>
                                        <Button 
                                            variant="danger" 
                                            size="sm" 
                                            onClick={() => handleDeleteDevice(device._id)}
                                        >
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

            {/* ✅ Add/Edit Device Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedDevice?._id ? "Edit Device" : "Add Device"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Device Name</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={selectedDevice?.name || ""}
                                onChange={(e) => setSelectedDevice({ ...selectedDevice, name: e.target.value })}
                            />
                        </Form.Group>

                        {customFields.length > 0 && (
                            <>
                                <h5>Custom Fields</h5>
                                {customFields.map((field) => (
                                    <Form.Group className="mb-3" key={field}>
                                        <Form.Label>{field}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={selectedDevice?.customFields[field] || ""}
                                            onChange={(e) =>
                                                setSelectedDevice({
                                                    ...selectedDevice,
                                                    customFields: { ...selectedDevice.customFields, [field]: e.target.value }
                                                })
                                            }
                                        />
                                    </Form.Group>
                                ))}
                            </>
                        )}

                        <Button variant="success" onClick={handleSaveDevice}>
                            {selectedDevice?._id ? "Save Changes" : "Add Device"}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Devices;
