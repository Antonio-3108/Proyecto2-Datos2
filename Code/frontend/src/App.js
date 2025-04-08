import React, { useState, useEffect } from 'react';
import Login from './Login';
import SearchBar from './SearchBar';

function App() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [cart, setCart] = useState([]);
    const [cartVisible, setCartVisible] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: (item.quantity || 1) + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        setCart(cart.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const handleCheckout = () => {
        // Mostrar mensaje de éxito
        setSuccessMessage("¡Compra realizada con éxito!");
        
        // Limpiar el carrito
        setCart([]);
        
        // Cerrar el carrito
        setCartVisible(false);
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
            setSuccessMessage(null);
        }, 3000);
    };

    const toggleCartVisibility = () => {
        setCartVisible(!cartVisible);
    };

    useEffect(() => {
        if (loggedIn) {
            fetch("http://localhost:8000/products", {
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                return response.json();
            })
            .then(data => setProducts(data))
            .catch(error => {
                console.error("Error fetching products:", error);
                setError("Error loading products");
            });

            fetch("http://localhost:8000/categories", {
                credentials: 'include'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                return response.json();
            })
            .then(data => setCategories(data))
            .catch(error => {
                console.error("Error fetching categories:", error);
                setError("Error loading categories");
            });
        }
    }, [loggedIn]);

    // Cargar el carrito al iniciar
    useEffect(() => {
        const loadCart = async () => {
            if (!products.length) return; // No cargar el carrito si no hay productos

            try {
                const response = await fetch("http://localhost:8000/cart", {
                    credentials: 'include'
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        // Si no hay sesión, simplemente inicializar un carrito vacío
                        setCart([]);
                        return;
                    }
                    throw new Error('Error al cargar el carrito');
                }

                const cartData = await response.json();
                const cartItems = cartData.items.map(item => {
                    const product = products.find(p => p.id === item.product_id);
                    if (!product) return null; // Ignorar items de productos que no existen
                    return {
                        id: item.product_id,
                        quantity: item.quantity,
                        ...product
                    };
                }).filter(item => item !== null); // Eliminar items nulos

                setCart(cartItems);
            } catch (error) {
                console.error("Error al cargar el carrito:", error);
                // No mostrar error al usuario, simplemente inicializar un carrito vacío
                setCart([]);
            }
        };

        loadCart();
    }, [products, loggedIn]); // Añadir loggedIn como dependencia

    if (error) {
        return (
            <div style={{
                textAlign: "center",
                padding: "20px",
                color: "red",
                backgroundColor: "#ffebee",
                margin: "20px",
                borderRadius: "4px"
            }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: darkMode ? "#121212" : "#F0F2F5",
            minHeight: "100vh",
            padding: "50px 0",
            fontFamily: "'Segoe UI', sans-serif",
            color: darkMode ? "#F0F0F0" : "#222"
        }}>
            {successMessage && (
                <div style={{
                    position: "fixed",
                    top: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    padding: "15px 30px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    zIndex: 1001,
                    animation: "fadeIn 0.5s, fadeOut 0.5s 2.5s"
                }}>
                    {successMessage}
                </div>
            )}
            <div style={{
                maxWidth: "900px",
                margin: "0 auto",
                backgroundColor: darkMode ? "#1E1E1E" : "#fff",
                borderRadius: "16px",
                boxShadow: darkMode ? "0 8px 20px rgba(0,0,0,0.4)" : "0 8px 20px rgba(0,0,0,0.05)",
                padding: "40px"
            }}>
                <div style={{ textAlign: "right", marginBottom: "20px" }}>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{
                            padding: "8px 14px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            backgroundColor: darkMode ? "#444" : "#eee",
                            color: darkMode ? "#fff" : "#222",
                            cursor: "pointer"
                        }}
                    >
                        {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
                    </button>
                </div>
                <h1 style={{
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: "32px",
                    marginBottom: "30px",
                    color: darkMode ? "#F0F0F0" : "#222"
                }}>
                    🛒 Online Store
                </h1>
                {!loggedIn ? (
                    <Login setLoggedIn={setLoggedIn} />
                ) : (
                    <>
                        <SearchBar onSearch={setSearchResults} darkMode={darkMode} />
                        <div style={{ marginBottom: "30px" }}>
                            <select
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #ccc",
                                    fontSize: "15px",
                                    backgroundColor: darkMode ? "#2C2C2C" : "#fff",
                                    color: darkMode ? "#F0F0F0" : "#222"
                                }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {(searchResults.length > 0 ? searchResults : products)
                                .filter(product => !selectedCategory || product.category_id == selectedCategory)
                                .map(product => (
                                    <li key={product._id || product.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '20px',
                                        padding: '20px',
                                        marginBottom: '20px',
                                        borderRadius: '16px',
                                        backgroundColor: darkMode ? "#2C2C2C" : '#fff',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                        border: '1px solid #eee',
                                        transition: 'transform 0.2s ease-in-out'
                                    }}>
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '12px',
                                                border: '1px solid #E0E0E0'
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{
                                                margin: '0 0 6px 0',
                                                fontSize: '18px',
                                                fontWeight: 600,
                                                color: darkMode ? "#F0F0F0" : "#333"
                                            }}>
                                                {product.name}
                                            </h3>
                                            <p style={{
                                                margin: 0,
                                                fontWeight: "bold",
                                                fontSize: "16px",
                                                color: "#2E7D32"
                                            }}>
                                                ${product.price.toFixed(2)}
                                            </p>
                                            <button
                                                onClick={() => addToCart(product)}
                                                style={{
                                                    marginTop: "10px",
                                                    padding: "8px 12px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: "#2E7D32",
                                                    color: "#fff",
                                                    cursor: "pointer",
                                                    fontSize: "14px"
                                                }}
                                            >
                                                🛍️ Agregar al carrito
                                            </button>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                        {/* Overlay con efecto blur */}
                        {loggedIn && cartVisible && (
                            <div 
                                onClick={toggleCartVisibility}
                                style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                                    backdropFilter: "blur(4px)",
                                    WebkitBackdropFilter: "blur(4px)",
                                    zIndex: 999,
                                    opacity: cartVisible ? 1 : 0,
                                    transition: "opacity 0.4s ease-in-out"
                                }}
                            />
                        )}

                        {/* Panel lateral del carrito */}
                        {loggedIn && (
                            <div style={{
                                position: "fixed",
                                top: 0,
                                right: cartVisible ? 0 : "-400px",
                                width: "350px",
                                height: "100vh",
                                backgroundColor: darkMode ? "#2C2C2C" : "#fff",
                                boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                                padding: "20px",
                                overflowY: "auto",
                                zIndex: 1000,
                                borderLeft: "1px solid #eee",
                                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                transform: cartVisible ? "translateX(0)" : "translateX(100%)",
                                visibility: cartVisible ? "visible" : "hidden"
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "20px"
                                }}>
                                    <h2 style={{ margin: 0 }}>🛒 Carrito</h2>
                                    <button
                                        onClick={toggleCartVisibility}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            fontSize: "20px",
                                            cursor: "pointer",
                                            color: darkMode ? "#fff" : "#333"
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                
                                {cart.length > 0 ? (
                                    <>
                                        <ul style={{ 
                                            listStyle: "none", 
                                            padding: 0,
                                            marginBottom: "20px"
                                        }}>
                                            {cart.map((item) => (
                                                <li key={item.id} style={{
                                                    padding: "10px",
                                                    borderBottom: "1px solid #eee",
                                                    marginBottom: "10px"
                                                }}>
                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}>
                                                        <div>
                                                            <h4 style={{ margin: "0 0 5px 0" }}>{item.name}</h4>
                                                            <p style={{ margin: 0, color: "#2E7D32" }}>
                                                                ${item.price.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px"
                                                        }}>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                                                style={{
                                                                    padding: "2px 8px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #ccc",
                                                                    background: "none",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <span>{item.quantity || 1}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                                                style={{
                                                                    padding: "2px 8px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #ccc",
                                                                    background: "none",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        <div style={{
                                            borderTop: "2px solid #eee",
                                            paddingTop: "20px",
                                            marginTop: "20px"
                                        }}>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "20px"
                                            }}>
                                                <h3 style={{ margin: 0 }}>Total:</h3>
                                                <h3 style={{ margin: 0, color: "#2E7D32" }}>
                                                    ${cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0).toFixed(2)}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={handleCheckout}
                                                style={{
                                                    width: "100%",
                                                    padding: "12px",
                                                    backgroundColor: "#2E7D32",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    fontSize: "16px"
                                                }}
                                            >
                                                Proceder al pago
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ textAlign: "center" }}>No hay productos en el carrito</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Carrito en la esquina superior derecha */}
            {loggedIn && (
                <div
                    onClick={toggleCartVisibility}
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        backgroundColor: "#FF5733",
                        color: "white",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
                    }}
                >
                    <span style={{ fontSize: "18px" }}>🛒</span>
                    <span style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        backgroundColor: "red",
                        color: "white",
                        borderRadius: "50%",
                        fontSize: "14px",
                        padding: "2px 6px"
                    }}>
                        {cart.length}
                    </span>
                </div>
            )}
        </div>
    );
}

export default App;