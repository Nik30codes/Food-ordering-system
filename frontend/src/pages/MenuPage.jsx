import { useState, useEffect } from "react";
import { Search, Leaf, Clock, Plus, Minus } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../services/api.js";
import toast from "react-hot-toast";

const MenuPage = () => {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [addingItemId, setAddingItemId] = useState(null);

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const [catRes, itemRes] = await Promise.all([
                api.get("/api/menu/categories"),
                api.get("/api/menu/items"),
            ]);
            setCategories(catRes.data.categories || []);
            setMenuItems(itemRes.data.menu_items || []);
        } catch (error) {
            setCategories([]);
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (itemId) => {
        if (!user) {
            toast.error("Please login to add items to cart");
            return;
        }
        try {
            setAddingItemId(itemId);
            await addToCart(itemId, 1);
            toast.success("Added to cart!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add item");
        } finally {
            setAddingItemId(null);
        }
    };

    const filteredItems = menuItems.filter((item) => {
        const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch && item.is_available;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cream">
            {/* Header */}
            <div className="bg-primary py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-bold text-white">Our Menu</h1>
                    <p className="text-white/70 mt-2">Discover dishes crafted with love and premium ingredients</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="relative max-w-md mx-auto mb-8">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${!selectedCategory
                                ? "bg-primary text-white"
                                : "bg-white text-charcoal border border-gray-200 hover:border-primary"
                                }`}
                        >
                            All
                        </button>
                        {categories.filter(c => c.is_active).map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${selectedCategory === cat.id
                                    ? "bg-primary text-white"
                                    : "bg-white text-charcoal border border-gray-200 hover:border-primary"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Menu Items Grid */}
                {filteredItems.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-charcoal/60 text-lg">No dishes found</p>
                        <p className="text-charcoal/40 mt-2">Try a different category or search term</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all group"
                            >
                                {/* Image */}
                                <div className="h-48 bg-primary-light/20 relative overflow-hidden">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-6xl">🍽️</span>
                                        </div>
                                    )}
                                    {/* Veg/Non-veg badge */}
                                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${item.food_type === "both" ? "bg-amber-100 text-amber-700" : item.is_veg ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        }`}>
                                        <Leaf size={12} />
                                        {item.food_type === "both" ? "Veg & Non-Veg" : item.is_veg ? "Veg" : "Non-Veg"}
                                    </div>
                                    {/* Discount badge */}
                                    {item.discount_price && (
                                        <div className="absolute top-3 right-3 bg-accent text-white px-2 py-1 rounded-full text-xs font-bold">
                                            {Math.round(((item.price - item.discount_price) / item.price) * 100)}% OFF
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-semibold text-charcoal text-lg">{item.name}</h3>
                                    {item.description && (
                                        <p className="text-charcoal/60 text-sm mt-1 line-clamp-2">{item.description}</p>
                                    )}

                                    {/* Meta info */}
                                    <div className="flex items-center gap-3 mt-3 text-charcoal/50 text-xs">
                                        {item.preparation_time && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} /> {item.preparation_time} mins
                                            </span>
                                        )}
                                        {item.calories && (
                                            <span>{item.calories} cal</span>
                                        )}
                                    </div>

                                    {/* Price + Add to Cart */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div>
                                            {item.discount_price ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-bold text-primary">₹{item.discount_price}</span>
                                                    <span className="text-sm text-charcoal/40 line-through">₹{item.price}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xl font-bold text-primary">₹{item.price}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(item.id)}
                                            disabled={addingItemId === item.id}
                                            className="bg-accent hover:bg-accent-dark text-white w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                                            aria-label={`Add ${item.name} to cart`}
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuPage;
