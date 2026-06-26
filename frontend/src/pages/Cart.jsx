import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { placeOrder } from "../services/orderService.js";
import toast from "react-hot-toast";

const Cart = () => {
    const { cartItems, itemCount, updateItem, removeItem, clearCartItems } = useCart();
    const [placingOrder, setPlacingOrder] = useState(false);
    const navigate = useNavigate();

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try {
            if (newQuantity <= 0) {
                await removeItem(itemId);
                toast.success("Item removed");
            } else {
                await updateItem(itemId, newQuantity);
            }
        } catch (error) {
            toast.error("Failed to update cart");
        }
    };

    const handlePlaceOrder = async () => {
        try {
            setPlacingOrder(true);
            const data = await placeOrder();
            toast.success("Order placed successfully!");
            navigate("/orders");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleClearCart = async () => {
        try {
            await clearCartItems();
            toast.success("Cart cleared");
        } catch {
            toast.error("Failed to clear cart");
        }
    };

    if (itemCount === 0) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center px-4">
                <div className="text-center">
                    <ShoppingBag size={64} className="text-primary/30 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-charcoal">Your cart is empty</h2>
                    <p className="text-charcoal/60 mt-2">Add some delicious items from our menu</p>
                    <Link
                        to="/menu"
                        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-6 py-3 rounded-full font-medium mt-6 transition-all"
                    >
                        Browse Menu <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream">
            <div className="bg-primary py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-white">Your Cart</h1>
                    <p className="text-white/70 mt-1">{itemCount} item{itemCount !== 1 ? "s" : ""} in your cart</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                    {/* Cart Items */}
                    <div className="divide-y divide-gray-100">
                        {cartItems.map((item) => (
                            <div key={item.id} className="p-5 flex items-center gap-4">
                                <div className="w-16 h-16 bg-primary-light/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🍽️</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-charcoal">Item #{item.menu_item_id}</p>
                                    <p className="text-charcoal/50 text-sm">Qty: {item.quantity}</p>
                                </div>
                                {/* Quantity controls */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                        className="w-8 h-8 rounded-full bg-cream flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                                        aria-label="Decrease quantity"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center font-semibold text-charcoal">{item.quantity}</span>
                                    <button
                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                        className="w-8 h-8 rounded-full bg-cream flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                                        aria-label="Increase quantity"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                {/* Remove button */}
                                <button
                                    onClick={() => handleUpdateQuantity(item.id, 0)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                    aria-label="Remove item"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Cart Actions */}
                    <div className="border-t border-gray-100 p-5">
                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                            <button
                                onClick={handleClearCart}
                                className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                            >
                                Clear Cart
                            </button>
                            <button
                                onClick={handlePlaceOrder}
                                disabled={placingOrder}
                                className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {placingOrder ? "Placing Order..." : "Place Order"} <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
