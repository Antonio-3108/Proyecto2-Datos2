import React, { useState, useEffect } from 'react';

function Login({ setLoggedIn }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Verificar si existe una sesión al cargar el componente
        fetch("http://localhost:8000/products", {
            credentials: 'include'
        })
        .then(response => {
            if (response.ok) {
                setLoggedIn(true);
            }
        })
        .catch(error => {
            console.error("Error checking session:", error);
            // No mostramos el error al usuario, solo lo registramos
        });
    }, [setLoggedIn]);

    const handleLogin = async () => {
        try {
            setError('');
            const response = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            
            if (response.ok) {
                setLoggedIn(true);
            } else {
                const data = await response.json();
                setError(data.detail || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Error connecting to server");
        }
    };

    return (
        <div style={{
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
            textAlign: "center"
        }}>
            <h2 style={{ marginBottom: "20px" }}>Login</h2>
            {error && (
                <div style={{
                    color: "red",
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "#ffebee",
                    borderRadius: "4px"
                }}>
                    {error}
                </div>
            )}
            <div style={{ marginBottom: "15px" }}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ddd"
                    }}
                />
            </div>
            <div style={{ marginBottom: "15px" }}>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px",
                        borderRadius: "4px",
                        border: "1px solid #ddd"
                    }}
                />
            </div>
            <button
                onClick={handleLogin}
                style={{
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#2E7D32",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "16px"
                }}
            >
                Login
            </button>
        </div>
    );
}

export default Login;