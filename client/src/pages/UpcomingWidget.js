import React, { useState, useEffect } from "react";
import { Table, Alert, Spinner, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const UpcomingWidget = () => {
    const [upcomingInspections, setUpcomingInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [daysAhead, setDaysAhead] = useState(14);
    const navigate = useNavigate();

    // 🛠️ Fetch inspections based on selected days
    useEffect(() => {
        const fetchUpcomingInspections = async () => {
            setLoading(true);
            try {
                const devicesResponse = await fetch("http://localhost:5000/api/devices");
                if (!devicesResponse.ok) throw new Error("Failed to fetch devices");
                const devices = await devicesResponse.json();

                let upcomingResults = [];

                for (const device of devices) {
                    const subcategoryId = device.subcategory?._id || device.subcategory;

                    // ✅ Fetch all checklists and filter by subcategory
                    const checklistResponse = await fetch("http://localhost:5000/api/checklists");
                    if (!checklistResponse.ok) throw new Error("Failed to fetch checklists");
                    const allChecklists = await checklistResponse.json();

                    const filteredChecklists = allChecklists.filter(checklist => {
                        const checklistSubcategoryId = checklist.subcategory?._id || checklist.subcategory;
                        return String(checklistSubcategoryId) === String(subcategoryId);
                    });

                    // ✅ Fetch checklist records for the current device
                    const recordsResponse = await fetch(`http://localhost:5000/api/checklistRecords?device=${device._id}`);
                    let records = [];
                    if (recordsResponse.ok) {
                        records = await recordsResponse.json();
                    }

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // ✅ Check each filtered checklist for upcoming status
                    for (const checklist of filteredChecklists) {
                        const lastRecord = records.find(record => record.checklist._id === checklist._id);
                        let dueDate;

                        if (!lastRecord) {
                            // No records found - inspection overdue
                            dueDate = "Never completed";
                            upcomingResults.push({
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

                            // Check if the next due date is within the selected window
                            const daysFromNow = new Date();
                            daysFromNow.setDate(today.getDate() + daysAhead);

                            if (dueDate >= today && dueDate <= daysFromNow) {
                                upcomingResults.push({
                                    deviceName: device.name,
                                    deviceId: device._id,
                                    checklistName: checklist.name,
                                    dueDate: dueDate.toLocaleDateString(),
                                });
                            }
                        }
                    }
                }

                setUpcomingInspections(upcomingResults);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUpcomingInspections();
    }, [daysAhead]);

    // 🔄 Navigate to device inspection page
    const handleRowClick = (deviceId) => {
        navigate(`/inspect/${deviceId}`);
    };

    // 📅 Handle day range selection
    const handleDayRangeClick = (days) => {
        setDaysAhead(days);
    };

    if (loading) {
        return <Spinner animation="border" />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    return (
        <div className="widget-container">
            <h3>📆 Upcoming Inspections (Next {daysAhead} Days)</h3>

            {/* 🔲 Day Range Buttons */}
            <div className="mb-3">
                {[7, 14, 21, 30].map((day) => (
                    <Button
                        key={day}
                        onClick={() => handleDayRangeClick(day)}
                        className="me-2"
                        style={{
                            backgroundColor: daysAhead === day ? "blue" : "lightgray",
                            color: daysAhead === day ? "white" : "black",
                            textDecoration: daysAhead === day ? "underline" : "none"
                        }}
                    >
                        Next {day} Days
                    </Button>
                ))}
            </div>

            {upcomingInspections.length === 0 ? (
                <Alert variant="info">✅ No upcoming inspections within {daysAhead} days!</Alert>
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
                        {upcomingInspections.map((item, index) => (
                            <tr
                                key={index}
                                onClick={() => handleRowClick(item.deviceId)}
                                style={{ cursor: "pointer" }}
                                className="table-row-hover"
                            >
                                <td style={{ color: "blue", textDecoration: "underline" }}>{item.deviceName}</td>
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

export default UpcomingWidget;
