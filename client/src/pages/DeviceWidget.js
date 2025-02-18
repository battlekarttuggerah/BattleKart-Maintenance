import React, { useState, useEffect } from "react";
import { ListGroup, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const DeviceWidget = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await fetch("https://battlekart-maintenance.onrender.com/api/devices");
                if (!response.ok) throw new Error("Failed to fetch devices");

                const devices = await response.json();

                // Filter devices with valid subcategories
                const validDevices = devices.filter(device => device.subcategory);
                setDevices(validDevices);
            } catch (err) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDevices();
    }, []);

    // Navigate to the device inspection page when clicked
    const handleDeviceClick = (deviceId) => {
        navigate(`/inspect/${deviceId}`);
    };

    return (
        <div>
            <h4>🚗 Devices Overview</h4>
            {loading ? (
                <Spinner animation="border" />
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : devices.length === 0 ? (
                <Alert variant="warning">⚠️ No devices available!</Alert>
            ) : (
                <ListGroup>
                    {devices.map((device, index) => (
                        <ListGroup.Item
                            key={index}
                            className="d-flex justify-content-between align-items-center"
                        >
                            <div
                                style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                                onClick={() => handleDeviceClick(device._id)}
                            >
                                🔧 {device.name}
                            </div>
                            <div className="text-secondary">
                                Category: {device.subcategory?.name || "N/A"}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

export default DeviceWidget;
