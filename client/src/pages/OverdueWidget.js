import React, { useEffect, useState } from "react";
import { Table, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const OverdueWidget = () => {
    const [overdueChecklists, setOverdueChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOverdueChecklists = async () => {
            try {
                const devicesResponse = await fetch("https://battlekart-maintenance.onrender.com/api/devices");
                if (!devicesResponse.ok) throw new Error("Failed to fetch devices");
                const devices = await devicesResponse.json();

                let overdueResults = [];

                for (const device of devices) {
                    const subcategoryId = device.subcategory?._id || device.subcategory;

                    // ✅ Fetch all checklists and filter by subcategory
                    const checklistResponse = await fetch("https://battlekart-maintenance.onrender.com/api/checklists");
                    if (!checklistResponse.ok) throw new Error("Failed to fetch checklists");
                    const allChecklists = await checklistResponse.json();

                    const filteredChecklists = allChecklists.filter(checklist => {
                        const checklistSubcategoryId = checklist.subcategory?._id || checklist.subcategory;
                        return String(checklistSubcategoryId) === String(subcategoryId);
                    });

                    // ✅ Fetch checklist records for the current device
                    const recordsResponse = await fetch(`https://battlekart-maintenance.onrender.com/api/checklistRecords?device=${device._id}`);
                    let records = [];
                    if (recordsResponse.ok) {
                        records = await recordsResponse.json();
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // ✅ Check each filtered checklist for overdue status
                    for (const checklist of filteredChecklists) {
                        const lastRecord = records.find(record => record.checklist._id === checklist._id);
                        let dueDate;

                        if (!lastRecord) {
                            // No records found - overdue immediately
                            dueDate = "Never completed";
                            overdueResults.push({
                                deviceName: device.name,
                                deviceId: device._id,
                                checklistName: checklist.name,
                                dueDate: dueDate,
                            });
                        } else {
                            // Calculate next due date
                            const lastCompleted = new Date(lastRecord.createdAt);
                            dueDate = new Date(lastCompleted);
                            dueDate.setDate(lastCompleted.getDate() + checklist.frequency);

                            // Check if the next due date has passed
                            if (dueDate <= today) {
                                overdueResults.push({
                                    deviceName: device.name,
                                    deviceId: device._id,
                                    checklistName: checklist.name,
                                    dueDate: dueDate.toLocaleDateString(),
                                });
                            }
                        }
                    }
                }

                setOverdueChecklists(overdueResults);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOverdueChecklists();
    }, []);

    // ✅ Handle row click to navigate to the device's inspect page
    const handleRowClick = (deviceId) => {
        navigate(`/inspect/${deviceId}`);
    };

    if (loading) {
        return <Spinner animation="border" />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div className="widget-container">
            <h3>🚨 Overdue Checklists</h3>
            {overdueChecklists.length === 0 ? (
                <Alert variant="success">✅ No overdue checklists!</Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Device Name</th>
                            <th>Device ID</th>
                            <th>Checklist Name</th>
                            <th>Due Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {overdueChecklists.map((item, index) => (
                            <tr 
                                key={index} 
                                onClick={() => handleRowClick(item.deviceId)}
                                style={{ cursor: "pointer" }}
                                className="table-row-hover"
                            >
                                {/* 🔗 Device name as a hyperlink */}
                                <td>
                                    <span 
                                        onClick={() => handleRowClick(item.deviceId)}
                                        style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }}
                                    >
                                        {item.deviceName}
                                    </span>
                                </td>
                                <td>{item.deviceId}</td>
                                <td>{item.checklistName}</td>
                                <td>{item.dueDate}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default OverdueWidget;
