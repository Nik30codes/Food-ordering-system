import { createContext, useContext, useState, useEffect } from "react";
import { getCart, addToCart as addToCartAPI, updateCartItem as updateCartAPI, removeFromCart as removeAPI, clearCart as clearAPI } from "../services/cartService.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [cartId, setCartId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCart();
        } else {
            setCartItems([]);
            setCartId(null);
        }
    }, [user]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const data = await getCart();
            setCartItems(data.items || []);
            setCartId(data.cart_id);
        } catch {
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (menuItemId, quantity = 1) => {
        const data = await addToCartAPI(menuItemId, quantity);
        await fetchCart();
        return data;
    };

    const updateItem = async (itemId, quantity) => {
        const data = await updateCartAPI(itemId, quantity);
        await fetchCart();
        return data;
    };

    const removeItem = async (itemId) => {
        const data = await removeAPI(itemId);
        await fetchCart();
        return data;
    };

    const clearCartItems = async () => {
        const data = await clearAPI();
        setCartItems([]);
        return data;
    };

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, cartId, loading, itemCount, addToCart, updateItem, removeItem, clearCartItems, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};
