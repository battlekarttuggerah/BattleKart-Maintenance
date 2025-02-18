import React, { useEffect, useState } from "react";
import { Container, Card, Button, Form, Alert, Spinner } from "react-bootstrap";

const Profile = () => {
    const [profile, setProfile] = useState({
        username: "",
        email: "",
        role: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [email, setEmail] = useState("");

    // ✅ Fetch profile on component mount
    useEffect(() => {
        const username = localStorage.getItem("userName");  // ✅ Correct key
        if (!username) {
            setError("No username found in localStorage");
            setLoading(false);
            return;
        }

        // ✅ Fetch user profile
        const fetchProfile = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/profile?username=${username}`);
                if (!response.ok) throw new Error("Failed to fetch profile");
                const data = await response.json();
                setProfile(data);
                setEmail(data.email);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // ✅ Handle Edit Mode
    const handleEdit = () => {
        setEditMode(true);
    };

    // ✅ Handle Save Changes
    const handleSave = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: profile.username,
                    email
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to update profile");

            setProfile({ ...profile, email });
            setSuccess("Profile updated successfully!");
            setEditMode(false);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container className="mt-5">
            <Card className="p-4 shadow-lg">
                <Card.Body>
                    <h3 className="mb-4">🧑‍💼 User Profile</h3>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control type="text" value={profile.username} disabled />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!editMode}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Control type="text" value={profile.role} disabled />
                        </Form.Group>

                        {editMode ? (
                            <Button variant="success" onClick={handleSave}>
                                Save Changes
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleEdit}>
                                Edit Profile
                            </Button>
                        )}
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Profile;
