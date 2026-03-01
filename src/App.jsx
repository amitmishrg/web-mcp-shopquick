import { useState, useEffect } from 'react';
import './App.css';
import { registerWebMCPTools, unregisterWebMCPTools } from './clientMCP';

const PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, emoji: '🎧' },
  { id: 2, name: 'Mechanical Keyboard', price: 129.99, emoji: '⌨️' },
  { id: 3, name: 'USB-C Hub', price: 49.99, emoji: '🔌' },
  { id: 4, name: 'Webcam HD', price: 89.99, emoji: '📷' },
  { id: 5, name: 'Mouse Pad XL', price: 24.99, emoji: '🖱️' },
  { id: 6, name: 'LED Desk Lamp', price: 39.99, emoji: '💡' },
];

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    registerWebMCPTools({
      addToCart: (productId, qty = 1) => {
        const product = PRODUCTS.find((p) => p.id === productId);
        if (!product) return { error: `Product ${productId} not found` };
        for (let i = 0; i < qty; i++) addToCart(product);
        return { success: true, product: product.name, qty };
      },
      removeFromCart: (productId) => {
        removeFromCart(productId);
        return { success: true, removedId: productId };
      },
    });
    return () => unregisterWebMCPTools();
  }, []);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="app">
      <header className="header">
        <h1>🛍️ ShopQuick</h1>
        <button className="cart-btn" onClick={() => setCartOpen(true)}>
          🛒 Cart
          {totalItems > 0 && <span className="badge">{totalItems}</span>}
        </button>
      </header>

      <main className="products-grid">
        {PRODUCTS.map((product) => {
          const inCart = cart.find((item) => item.id === product.id);
          return (
            <div key={product.id} className="product-card">
              <div className="product-emoji">{product.emoji}</div>
              <h3>{product.name}</h3>
              <p className="price">${product.price.toFixed(2)}</p>
              {inCart ? (
                <div className="qty-control">
                  <button onClick={() => updateQty(product.id, -1)}>−</button>
                  <span>{inCart.qty}</span>
                  <button onClick={() => updateQty(product.id, 1)}>+</button>
                </div>
              ) : (
                <button className="add-btn" onClick={() => addToCart(product)}>
                  Add to Cart
                </button>
              )}
            </div>
          );
        })}
      </main>

      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>Your Cart</h2>
              <button className="close-btn" onClick={() => setCartOpen(false)}>
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is empty.</p>
            ) : (
              <>
                <ul className="cart-list">
                  {cart.map((item) => (
                    <li key={item.id} className="cart-item">
                      <span className="cart-emoji">{item.emoji}</span>
                      <div className="cart-info">
                        <span className="cart-name">{item.name}</span>
                        <span className="cart-price">
                          ${item.price.toFixed(2)} × {item.qty}
                        </span>
                      </div>
                      <span className="cart-subtotal">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        🗑️
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="cart-footer">
                  <span>Total</span>
                  <span className="total-price">${totalPrice.toFixed(2)}</span>
                </div>
                <button className="checkout-btn">Checkout</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
