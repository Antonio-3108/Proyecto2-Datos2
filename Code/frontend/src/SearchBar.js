import { useState } from "react";

function SearchBar({ onSearch, darkMode }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [activeIndex, setActiveIndex] = useState(-1);

    const handleChange = async (e) => {
        const value = e.target.value;
        setQuery(value);
        setActiveIndex(-1);

        if (value.length > 0) {
            try {
                const response = await fetch(`http://localhost:8000/search?query=${value}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    onSearch(data);
                    setSuggestions(data);
                } else {
                    onSearch([]);
                    setSuggestions([]);
                }
            } catch (error) {
                console.error("Error fetching search results:", error);
                onSearch([]);
                setSuggestions([]);
            }
        } else {
            onSearch([]);
            setSuggestions([]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            setActiveIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" && activeIndex >= 0) {
            const selected = suggestions[activeIndex];
            setQuery(selected.name);
            setSuggestions([]);
            onSearch([selected]);
        } else if (e.key === "Escape") {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (product) => {
        setQuery(product.name);
        setSuggestions([]);
        onSearch([product]);
    };

    const highlightMatch = (text, query) => {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;

        return (
            <>
                {text.slice(0, index)}
                <strong style={{
                    backgroundColor: darkMode ? "#3cb371" : "#ffff00",  // verde menta o amarillo
                    color: darkMode ? "#fff" : "#000",
                    padding: "0 2px",
                    borderRadius: "3px"
                }}>
                    {text.slice(index, index + query.length)}
                </strong>
                {text.slice(index + query.length)}
            </>
        );
    };

    return (
        <div style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: darkMode ? '#2c2c2c' : '#fff',
                borderRadius: '10px',
                padding: '12px 18px',
                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid #ddd'
            }}>
                <span style={{
                    marginRight: '12px',
                    fontSize: '18px',
                    color: darkMode ? '#aaa' : '#888'
                }}>
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={query}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    style={{
                        border: 'none',
                        outline: 'none',
                        fontSize: '16px',
                        width: '100%',
                        backgroundColor: 'transparent',
                        color: darkMode ? '#f0f0f0' : '#222',
                        fontFamily: "'Segoe UI', sans-serif"
                    }}
                />
            </div>

            {query && suggestions.length > 0 && (
                <ul style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "0 0 10px 10px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    padding: 0,
                    margin: 0,
                    listStyle: "none"
                }}>
                    {suggestions.map((product, index) => (
                        <li
                            key={product._id} // Use _id instead of id if MongoDB returns _id
                            onClick={() => handleSuggestionClick(product)}
                            style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                backgroundColor: index === activeIndex ? (darkMode ? "#333" : "#f0f0f0") : "transparent",
                                color: darkMode ? "#f0f0f0" : "#222",
                                borderBottom: "1px solid #eee"
                            }}
                        >
                            {highlightMatch(product.name, query)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchBar;
