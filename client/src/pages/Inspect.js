import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, ListGroup, Spinner, Alert, Button, Badge, Modal, Form } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Inspect = () => {
    const { deviceId } = useParams();
    const [device, setDevice] = useState(null);
    const [checklists, setChecklists] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [activeChecklist, setActiveChecklist] = useState(null);
    const [formData, setFormData] = useState({});
    const [showRecordsModal, setShowRecordsModal] = useState(false);
    const [activeRecord, setActiveRecord] = useState(null);
    const [failureDetails, setFailureDetails] = useState({});
    const [failureSeverity, setFailureSeverity] = useState({});

    // ✅ Fetch device details, checklists, and records
    const fetchDeviceAndChecklists = useCallback(async () => {
        try {
            const deviceResponse = await fetch(`http://localhost:5000/api/devices/${deviceId}`);
            if (!deviceResponse.ok) throw new Error("Failed to fetch device");
            const deviceData = await deviceResponse.json();

            const subcategoryId = deviceData.subcategory?._id || deviceData.subcategory;

            setDevice({
                name: deviceData.name,
                subcategory: deviceData.subcategory?.name,
                subcategoryId: subcategoryId,
            });

            const checklistResponse = await fetch(`http://localhost:5000/api/checklists`);
            if (!checklistResponse.ok) throw new Error("Failed to fetch checklists");
            const checklistData = await checklistResponse.json();

            const filteredChecklists = checklistData.filter(checklist => {
                const checklistSubcategoryId = checklist.subcategory?._id || checklist.subcategory;
                return String(checklistSubcategoryId) === String(subcategoryId);
            });
            setChecklists(filteredChecklists);

            // ✅ Fetch previous records
            const recordsResponse = await fetch(`http://localhost:5000/api/checklistRecords?device=${deviceId}`);
            if (recordsResponse.ok) {
                const recordsData = await recordsResponse.json();
                setRecords(recordsData);
            } else {
                setRecords([]);
            }
        } catch (err) {
            setError(err.message);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }, [deviceId]);

    useEffect(() => {
        fetchDeviceAndChecklists();
    }, [fetchDeviceAndChecklists]);

    // ✅ Determine checklist status
    const getChecklistStatus = (checklist) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastRecord = records.find(record => record.checklist._id === checklist._id);
        if (!lastRecord) {
            return { status: "Overdue (not completed yet)", variant: "danger", nextDue: "N/A" };
        }

        const lastCompleted = new Date(lastRecord.createdAt);
        const nextDue = new Date(lastCompleted);
        nextDue.setDate(lastCompleted.getDate() + checklist.frequency);

        if (nextDue < today) {
            return { status: "Overdue", variant: "danger", nextDue: nextDue.toLocaleDateString() };
        } else {
            return { status: `Next Checklist Due: ${nextDue.toLocaleDateString()}`, variant: "info", nextDue: nextDue.toLocaleDateString() };
        }
    };

    // ✅ Open checklist modal
    const handleStartChecklist = (checklist) => {
        setActiveChecklist(checklist);
        setFormData({});
        setShowModal(true);
    };

    // ✅ Handle Pass/Fail
    const handlePassFail = (fieldName, result) => {
        setFormData(prev => ({ ...prev, [fieldName]: result }));
        if (result === "Pass") {
            setFailureDetails(prev => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
            setFailureSeverity(prev => {
                const updated = { ...prev };
                delete updated[fieldName];
                return updated;
            });
        }
    };

    // ✅ Handle failure detail entry
    const handleFailureDetailsChange = (fieldName, text) => {
        setFailureDetails((prev) => ({
            ...prev,
            [fieldName]: text
        }));
    };

    // ✅ Handle severity selection
    const handleSeveritySelect = (fieldName, severity) => {
        setFailureSeverity((prev) => ({
            ...prev,
            [fieldName]: severity
        }));
    };

    // ✅ Submit checklist
    const handleSubmitChecklist = async () => {
        const inspectionResult = Object.values(formData).includes("Fail") ? "Fail" : "Pass";

        const payload = {
            checklist: activeChecklist._id,
            device: deviceId,
            completedBy: localStorage.getItem("userName") || "Unknown User",
            responses: formData,
            failureDetails,
            failureSeverity,
            inspectionResult
        };

        try {
            const response = await fetch("http://localhost:5000/api/checklistRecords", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to submit checklist: ${errorData.error}`);
            }

            setShowModal(false);
            fetchDeviceAndChecklists();
        } catch (err) {
            setError(err.message);
        }
    };

    // ✅ Open previous record modal
    const handleViewRecord = (record) => {
        setActiveRecord(record);
        setShowRecordsModal(true);
    };

    // ✅ Display result as Pass, Fail, or Rectified
    const getDisplayInspectionResult = (record) => {
        if (Object.values(record.responses).includes("Rectified")) {
            return { text: "Rectified", color: "blue" };
        }
        return record.inspectionResult === "Fail"
            ? { text: "Fail", color: "red" }
            : { text: "Pass", color: "green" };
    };

    // 📄 Generate individual inspection PDF
    const generatePDF = (record) => {
        const doc = new jsPDF();
        const logoPath = "/logo.png";

        // 🖼️ Add logo and title
        doc.addImage(logoPath, "PNG", 10, 10, 40, 40);
        doc.setFontSize(22);
        doc.text("BattleKart Tuggerah - Inspection Report", 60, 20);

        // 📋 Record Information
        doc.setFontSize(14);
        doc.text(`Checklist: ${record.checklist.name}`, 10, 60);
        doc.text(`Completed By: ${record.completedBy}`, 10, 70);
        doc.text(`Date: ${new Date(record.createdAt).toLocaleString()}`, 10, 80);

        // 🧾 Inspection Result
        const result = Object.values(record.responses).includes("Fail") ? "Fail" :
                      Object.values(record.responses).includes("Rectified") ? "Rectified" : "Pass";

        doc.setFontSize(18);
        doc.setTextColor(result === "Fail" ? "red" : result === "Rectified" ? "blue" : "green");
        doc.text(`Inspection Result: ${result}`, 10, 90);

        // 🛠️ Responses Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text("Responses:", 10, 110);
        let yPosition = 120;

        Object.entries(record.responses).forEach(([field, response]) => {
            doc.setFontSize(12);
            doc.text(`${field}: ${response}`, 15, yPosition);
            yPosition += 7;

            if (response === "Fail" || response === "Rectified") {
                const note = record.failureDetails?.[field] ?? "No note provided";
                const severity = record.failureSeverity?.[field] ?? "Not specified";
                const rectifiedDate = record.rectifiedDate?.[field] ?? "Not rectified";

                doc.setTextColor(255, 0, 0);
                doc.text(`  → Note: ${note}`, 20, yPosition);
                yPosition += 6;
                doc.text(`  → Severity: ${severity}`, 20, yPosition);
                yPosition += 6;
                if (response === "Rectified") {
                    doc.text(`  → Rectified on: ${rectifiedDate}`, 20, yPosition);
                    yPosition += 6;
                }
                doc.setTextColor(0, 0, 0);
            }

            if (yPosition > 280) {
                doc.addPage();
                yPosition = 10;
            }
        });

        doc.save(`Inspection_Report_${record.checklist.name}_${new Date().toISOString()}.pdf`);
    };


    // 📋 Generate Summary PDF (for all inspections)
    const generateSummaryPDF = () => {
        const doc = new jsPDF();
        const logoPath = "/logo.png";
        doc.addImage(logoPath, "PNG", 10, 10, 40, 40);
        doc.setFontSize(22);
        doc.text("BattleKart Tuggerah - Inspection Summary", 60, 20);
        doc.setFontSize(14);
        doc.text(`Device: ${device?.name || "Unknown Device"}`, 10, 60);
        doc.text(`Subcategory: ${device?.subcategory || "Unknown"}`, 10, 70);

        const headers = [["Checklist", "Completed By", "Date", "Result", "Failure Details"]];
        const data = records.map(record => {
            const result = Object.values(record.responses).includes("Fail") ? "Fail" :
                          Object.values(record.responses).includes("Rectified") ? "Rectified" : "Pass";

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
                failureDetails.trim() || "None"
            ];
        });

        doc.autoTable({
            startY: 90,
            head: headers,
            body: data,
            theme: "striped",
            styles: { fontSize: 10, halign: "center" }
        });

        doc.save(`Inspection_Summary_${device?.name}_${new Date().toISOString()}.pdf`);
    };

    const getButtonStyle = (fieldName, severity) => {
        const selected = failureSeverity[fieldName] === severity;
        switch (severity) {
            case "Minor":
                return selected ? "secondary" : "outline-secondary";
            case "Moderate":
                return selected ? "primary" : "outline-primary";
            case "Major":
                return selected ? "danger" : "outline-danger";
            default:
                return "outline-secondary";
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <Container className="mt-4">
                    <h2>Inspect Device</h2>
                    {loading && <Spinner animation="border" />}
                    {error && <Alert variant="danger">{error}</Alert>}

                    {device && (
                        <div className="mb-3">
                            <h4>{device.name}</h4>
                            <p><strong>Subcategory:</strong> {device.subcategory}</p>
                        </div>
                    )}

                    <div className="mb-4">
                        <Button variant="info" onClick={generateSummaryPDF}>
                            Download Summary PDF
                        </Button>
                    </div>

                    <h3>Assigned Checklists</h3>
                    <ListGroup>
                        {checklists.map(checklist => {
                            const { status, variant } = getChecklistStatus(checklist);
                            return (
                                <ListGroup.Item key={checklist._id} className="d-flex justify-content-between align-items-center">
                                    <span>{checklist.name}</span>
                                    <div>
                                        <Badge bg={variant} className="me-3">{status}</Badge>
                                        <Button variant="primary" onClick={() => handleStartChecklist(checklist)}>Start</Button>
                                    </div>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>

                    <h3 className="mt-4">Previous Inspections</h3>
                    {records.length > 0 ? (
                        <ListGroup>
                            {records.map(record => {
                                const { text, color } = getDisplayInspectionResult(record);
                                return (
                                    <ListGroup.Item
                                        key={record._id}
                                        className="d-flex justify-content-between align-items-center"
                                        onClick={() => handleViewRecord(record)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <span>
                                            {record.checklist?.name} - Completed by: {record.completedBy} - {new Date(record.createdAt).toLocaleString()}
                                        </span>
                                        <Badge bg={color} className="ms-3">{text}</Badge>
                                        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); generatePDF(record); }}>
                                            Download PDF
                                        </Button>
                                    </ListGroup.Item>
                                );
                            })}
                        </ListGroup>
                    ) : (
                        <p className="text-muted">No inspections completed yet.</p>
                    )}

                    {/* ✅ Checklist Modal */}
                    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Complete Checklist</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {activeChecklist && (
                                <Form>
                                    {activeChecklist.fields.map((field) => (
                                        <div key={field._id} className="mb-4">
                                            <Form.Label>{field.name}</Form.Label>
                                            <div>
                                                <Button
                                                    variant={formData[field.name] === "Pass" ? "success" : "outline-success"}
                                                    className="me-2"
                                                    onClick={() => handlePassFail(field.name, "Pass")}
                                                >
                                                    Pass
                                                </Button>
                                                <Button
                                                    variant={formData[field.name] === "Fail" ? "danger" : "outline-danger"}
                                                    onClick={() => handlePassFail(field.name, "Fail")}
                                                >
                                                    Fail
                                                </Button>
                                            </div>

                                            {formData[field.name] === "Fail" && (
                                                <div className="mt-3">
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={3}
                                                        placeholder="Explain the failure..."
                                                        value={failureDetails[field.name] || ""}
                                                        onChange={(e) => handleFailureDetailsChange(field.name, e.target.value)}
                                                    />
                                                    <div className="mt-2 d-flex gap-3">
                                                        <Button
                                                            variant={getButtonStyle(field.name, "Minor")}
                                                            onClick={() => handleSeveritySelect(field.name, "Minor")}
                                                        >
                                                            ⚪ Minor
                                                        </Button>
                                                        <Button
                                                            variant={getButtonStyle(field.name, "Moderate")}
                                                            onClick={() => handleSeveritySelect(field.name, "Moderate")}
                                                        >
                                                            🔵 Moderate
                                                        </Button>
                                                        <Button
                                                            variant={getButtonStyle(field.name, "Major")}
                                                            onClick={() => handleSeveritySelect(field.name, "Major")}
                                                        >
                                                            🔴 Major
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <Button variant="success" onClick={handleSubmitChecklist}>Submit</Button>
                                </Form>
                            )}
                        </Modal.Body>
                    </Modal>

                    {/* ✅ Record Modal */}
                    <Modal show={showRecordsModal} onHide={() => setShowRecordsModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Inspection Details</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {activeRecord ? (
                                <>
                                    <h5>{activeRecord.checklist?.name}</h5>
                                    <p><strong>Completed By:</strong> {activeRecord.completedBy}</p>
                                    <p><strong>Date:</strong> {new Date(activeRecord.createdAt).toLocaleString()}</p>

                                    <h4 style={{ color: getDisplayInspectionResult(activeRecord).color }}>
                                        Inspection Result: {getDisplayInspectionResult(activeRecord).text}
                                    </h4>

                                    <h6>Responses:</h6>
                                    <ul>
                                        {Object.entries(activeRecord.responses).map(([field, response]) => (
                                            <li key={field}>
                                                <strong>{field}:</strong> {response}
                                                {(response === "Fail" || response === "Rectified") && (
                                                    <div className="mt-2 ms-3 text-danger">
                                                        <strong>Note:</strong> {activeRecord.failureDetails?.[field] || "No note provided"}<br />
                                                        <strong>Severity:</strong> {activeRecord.failureSeverity?.[field] || "Not specified"}<br />
                                                        {activeRecord.rectifiedDate?.[field] && (
                                                            <strong>Rectified On: {activeRecord.rectifiedDate[field]}</strong>
                                                        )}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p>No record selected.</p>
                            )}
                        </Modal.Body>
                    </Modal>
                </Container>
            </div>
        </div>
    );
};

export default Inspect;
