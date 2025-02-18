import React, { useState } from "react";
import { Container, Card, Dropdown } from "react-bootstrap";
import OverdueWidget from "./OverdueWidget";
import UpcomingWidget from "./UpcomingWidget";
import DeviceWidget from "./DeviceWidget";
import FailedDevicesWidget from "./FailedDevicesWidget"; // ✅ New Widget Added

const Dashboard = () => {
    const [selectedWidget, setSelectedWidget] = useState("Overdue Checklists");

    const handleSelect = (eventKey) => {
        setSelectedWidget(eventKey);
    };

    const renderWidget = () => {
        switch (selectedWidget) {
            case "Overdue Checklists":
                return <OverdueWidget />;
            case "Upcoming Inspections":
                return <UpcomingWidget />;
            case "Devices Overview":
                return <DeviceWidget />;
            default:
                return <OverdueWidget />;
        }
    };

    return (
        <Container className="mt-5">
            <Card className="p-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>🛠️ Dashboard</h2>
                    <Dropdown onSelect={handleSelect}>
                        <Dropdown.Toggle variant="primary" id="widget-dropdown">
                            {selectedWidget}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item eventKey="Overdue Checklists">Overdue Checklists</Dropdown.Item>
                            <Dropdown.Item eventKey="Upcoming Inspections">Upcoming Inspections</Dropdown.Item>
                            <Dropdown.Item eventKey="Devices Overview">Devices Overview</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>

                {/* 📋 Existing Widget */}
                {renderWidget()}

                {/* 🚨 New Widget for Failed Devices */}
                <div className="mt-5">
                    <FailedDevicesWidget />
                </div>
            </Card>
        </Container>
    );
};

export default Dashboard;
