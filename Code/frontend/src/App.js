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
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(6);

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

    // Función para calcular los productos a mostrar en la página actual
    const getCurrentProducts = () => {
        const productsToShow = searchResults.length > 0 ? searchResults : products;
        const filteredProducts = productsToShow.filter(product => !selectedCategory || product.category_id == selectedCategory);
        
        // Calcular índices para la paginación
        const indexOfLastProduct = currentPage * productsPerPage;
        const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
        
        // Devolver los productos de la página actual
        return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    };

    // Función para cambiar de página
    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Scroll hacia arriba para mejor experiencia
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Calcular el número total de páginas
    const getTotalPages = () => {
        const productsToShow = searchResults.length > 0 ? searchResults : products;
        const filteredProducts = productsToShow.filter(product => !selectedCategory || product.category_id == selectedCategory);
        return Math.ceil(filteredProducts.length / productsPerPage);
    };

    // Resetear la página cuando cambia la categoría o los resultados de búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchResults]);

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
                                <option value="">Todas las categorías</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Grid de productos */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px',
                            marginBottom: '30px'
                        }}>
                            {getCurrentProducts().map(product => (
                                <div key={product._id || product.id} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: '16px',
                                    backgroundColor: darkMode ? "#2C2C2C" : '#fff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                    border: '1px solid #eee',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                    cursor: 'pointer',
                                    height: '100%'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                                }}
                                >
                                    <div style={{
                                        height: '200px',
                                        overflow: 'hidden'
                                    }}>
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s ease-in-out'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        />
                                    </div>
                                    <div style={{ 
                                        padding: '15px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flexGrow: 1
                                    }}>
                                        <h3 style={{
                                            margin: '0 0 10px 0',
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: darkMode ? "#F0F0F0" : "#333"
                                        }}>
                                            {product.name}
                                        </h3>
                                        <p style={{
                                            margin: '0 0 15px 0',
                                            fontWeight: "bold",
                                            fontSize: "18px",
                                            color: "#2E7D32"
                                        }}>
                                            ${product.price.toFixed(2)}
                                        </p>
                                        <button
                                            onClick={() => addToCart(product)}
                                            style={{
                                                marginTop: 'auto',
                                                padding: "10px",
                                                borderRadius: "8px",
                                                border: "none",
                                                backgroundColor: "#2E7D32",
                                                color: "#fff",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                transition: 'background-color 0.2s ease-in-out'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = '#1B5E20';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = '#2E7D32';
                                            }}
                                        >
                                            🛍️ Agregar al carrito
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Paginación */}
                        {getTotalPages() > 1 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: '30px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'center'
                                }}>
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            backgroundColor: currentPage === 1 ? '#f5f5f5' : darkMode ? '#3C3C3C' : '#fff',
                                            color: currentPage === 1 ? '#aaa' : darkMode ? '#fff' : '#333',
                                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        ← Anterior
                                    </button>
                                    
                                    {/* Primera página */}
                                    <button
                                        onClick={() => paginate(1)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            backgroundColor: currentPage === 1 ? '#2E7D32' : darkMode ? '#3C3C3C' : '#fff',
                                            color: currentPage === 1 ? '#fff' : darkMode ? '#fff' : '#333',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        1
                                    </button>
                                    
                                    {/* Puntos suspensivos iniciales */}
                                    {currentPage > 3 && (
                                        <span style={{
                                            color: darkMode ? '#fff' : '#333',
                                            fontSize: '14px',
                                            padding: '0 5px'
                                        }}>
                                            ...
                                        </span>
                                    )}
                                    
                                    {/* Páginas centrales */}
                                    {Array.from({ length: getTotalPages() }, (_, i) => i + 1)
                                        .filter(number => {
                                            // Mostrar páginas cercanas a la actual
                                            return number > 1 && 
                                                   number < getTotalPages() && 
                                                   Math.abs(number - currentPage) <= 1;
                                        })
                                        .map(number => (
                                            <button
                                                key={number}
                                                onClick={() => paginate(number)}
                                                style={{
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ddd',
                                                    backgroundColor: currentPage === number ? '#2E7D32' : darkMode ? '#3C3C3C' : '#fff',
                                                    color: currentPage === number ? '#fff' : darkMode ? '#fff' : '#333',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {number}
                                            </button>
                                        ))}
                                    
                                    {/* Puntos suspensivos finales */}
                                    {currentPage < getTotalPages() - 2 && (
                                        <span style={{
                                            color: darkMode ? '#fff' : '#333',
                                            fontSize: '14px',
                                            padding: '0 5px'
                                        }}>
                                            ...
                                        </span>
                                    )}
                                    
                                    {/* Última página */}
                                    {getTotalPages() > 1 && (
                                        <button
                                            onClick={() => paginate(getTotalPages())}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                backgroundColor: currentPage === getTotalPages() ? '#2E7D32' : darkMode ? '#3C3C3C' : '#fff',
                                                color: currentPage === getTotalPages() ? '#fff' : darkMode ? '#fff' : '#333',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {getTotalPages()}
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === getTotalPages()}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #ddd',
                                            backgroundColor: currentPage === getTotalPages() ? '#f5f5f5' : darkMode ? '#3C3C3C' : '#fff',
                                            color: currentPage === getTotalPages() ? '#aaa' : darkMode ? '#fff' : '#333',
                                            cursor: currentPage === getTotalPages() ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Siguiente →
                                    </button>
                                </div>
                            </div>
                        )}

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
                                boxShadow: "0 0 20px rgba(0,0,0,0.2)",
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
                                    marginBottom: "20px",
                                    borderBottom: "1px solid #eee",
                                    paddingBottom: "15px"
                                }}>
                                    <h2 style={{ 
                                        margin: 0,
                                        fontSize: "22px",
                                        fontWeight: "600",
                                        color: darkMode ? "#fff" : "#333"
                                    }}>
                                        🛒 Carrito de compras
                                    </h2>
                                    <button
                                        onClick={toggleCartVisibility}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            fontSize: "20px",
                                            cursor: "pointer",
                                            color: darkMode ? "#fff" : "#333",
                                            width: "30px",
                                            height: "30px",
                                            borderRadius: "50%",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "background-color 0.2s ease-in-out"
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = darkMode ? "#3C3C3C" : "#f5f5f5";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent";
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
                                                    padding: "15px",
                                                    borderBottom: "1px solid #eee",
                                                    marginBottom: "10px",
                                                    borderRadius: "8px",
                                                    backgroundColor: darkMode ? "#3C3C3C" : "#f9f9f9",
                                                    transition: "transform 0.2s ease-in-out"
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.transform = "translateY(-2px)";
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                }}
                                                >
                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center"
                                                    }}>
                                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                            <img 
                                                                src={item.image_url} 
                                                                alt={item.name}
                                                                style={{
                                                                    width: "50px",
                                                                    height: "50px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid #eee"
                                                                }}
                                                            />
                                                            <div>
                                                                <h4 style={{ 
                                                                    margin: "0 0 5px 0",
                                                                    fontSize: "16px",
                                                                    fontWeight: "500",
                                                                    color: darkMode ? "#fff" : "#333"
                                                                }}>
                                                                    {item.name}
                                                                </h4>
                                                                <p style={{ 
                                                                    margin: 0, 
                                                                    color: "#2E7D32",
                                                                    fontWeight: "bold"
                                                                }}>
                                                                    ${item.price.toFixed(2)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#FF5252",
                                                                cursor: "pointer",
                                                                fontSize: "16px",
                                                                padding: "5px",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                transition: "background-color 0.2s ease-in-out"
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.backgroundColor = "rgba(255, 82, 82, 0.1)";
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.backgroundColor = "transparent";
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        marginTop: "10px"
                                                    }}>
                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px"
                                                        }}>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                                                style={{
                                                                    padding: "5px 10px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #ddd",
                                                                    background: darkMode ? "#2C2C2C" : "#fff",
                                                                    color: darkMode ? "#fff" : "#333",
                                                                    cursor: "pointer",
                                                                    transition: "background-color 0.2s ease-in-out"
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    e.currentTarget.style.backgroundColor = darkMode ? "#444" : "#f5f5f5";
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    e.currentTarget.style.backgroundColor = darkMode ? "#2C2C2C" : "#fff";
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <span style={{
                                                                fontWeight: "bold",
                                                                color: darkMode ? "#fff" : "#333"
                                                            }}>
                                                                {item.quantity || 1}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                                                style={{
                                                                    padding: "5px 10px",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #ddd",
                                                                    background: darkMode ? "#2C2C2C" : "#fff",
                                                                    color: darkMode ? "#fff" : "#333",
                                                                    cursor: "pointer",
                                                                    transition: "background-color 0.2s ease-in-out"
                                                                }}
                                                                onMouseOver={(e) => {
                                                                    e.currentTarget.style.backgroundColor = darkMode ? "#444" : "#f5f5f5";
                                                                }}
                                                                onMouseOut={(e) => {
                                                                    e.currentTarget.style.backgroundColor = darkMode ? "#2C2C2C" : "#fff";
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <p style={{ 
                                                            margin: 0, 
                                                            fontWeight: "bold",
                                                            color: darkMode ? "#fff" : "#333"
                                                        }}>
                                                            ${((item.price * (item.quantity || 1))).toFixed(2)}
                                                        </p>
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
                                                <h3 style={{ 
                                                    margin: 0,
                                                    fontSize: "18px",
                                                    fontWeight: "600",
                                                    color: darkMode ? "#fff" : "#333"
                                                }}>
                                                    Total:
                                                </h3>
                                                <h3 style={{ 
                                                    margin: 0, 
                                                    color: "#2E7D32",
                                                    fontSize: "20px",
                                                    fontWeight: "bold"
                                                }}>
                                                    ${cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0).toFixed(2)}
                                                </h3>
                                            </div>
                                            <button
                                                onClick={handleCheckout}
                                                style={{
                                                    width: "100%",
                                                    padding: "14px",
                                                    backgroundColor: "#2E7D32",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    fontSize: "16px",
                                                    fontWeight: "600",
                                                    transition: "background-color 0.2s ease-in-out, transform 0.2s ease-in-out",
                                                    boxShadow: "0 4px 8px rgba(46, 125, 50, 0.2)"
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#1B5E20";
                                                    e.currentTarget.style.transform = "translateY(-2px)";
                                                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(46, 125, 50, 0.3)";
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#2E7D32";
                                                    e.currentTarget.style.transform = "translateY(0)";
                                                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(46, 125, 50, 0.2)";
                                                }}
                                            >
                                                Proceder al pago
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        padding: "40px 0",
                                        color: darkMode ? "#aaa" : "#777"
                                    }}>
                                        <span style={{ fontSize: "50px", marginBottom: "20px" }}>🛒</span>
                                        <p style={{ textAlign: "center", fontSize: "16px" }}>
                                            No hay productos en el carrito
                                        </p>
                                        <button
                                            onClick={toggleCartVisibility}
                                            style={{
                                                marginTop: "20px",
                                                padding: "10px 20px",
                                                backgroundColor: darkMode ? "#3C3C3C" : "#f5f5f5",
                                                color: darkMode ? "#fff" : "#333",
                                                border: "none",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                transition: "background-color 0.2s ease-in-out"
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? "#444" : "#e0e0e0";
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = darkMode ? "#3C3C3C" : "#f5f5f5";
                                            }}
                                        >
                                            Continuar comprando
                                        </button>
                                    </div>
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