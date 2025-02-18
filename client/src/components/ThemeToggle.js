import React, { useContext } from "react";
import { ThemeContext } from "../App";
import { Button } from "react-bootstrap";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <div className="theme-toggle">
            <Button variant="secondary" onClick={toggleTheme}>
                Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </Button>
        </div>
    );
};

export default ThemeToggle;
