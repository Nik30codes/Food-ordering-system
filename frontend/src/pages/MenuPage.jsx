import { useState, useEffect } from "react";
import { Search, ArrowLeft, Plus, Minus, Leaf, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../services/api.js";
import { toast } from "sonner";
import AnimatedList from "../components/AnimatedList.jsx";
import MagicBentoCard from "../components/MagicBentoCard.jsx";
import Counter from "../components/Counter.jsx";

const MenuPage = () => {
    const { user } = useAuth();
    const { addToCart, cartItems, updateItem, removeItem } = useCart();
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [foodTypeFilter, setFoodTypeFilter] = useState("all");
    const [viewAll, setViewAll] = useState(false); // "all", "veg", "nonveg"
    const [loading, setLoading] = useState(true);
    const [addingItemId, setAddingItemId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [foodTypeChoice, setFoodTypeChoice] = useState(null);

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
        } catch {
            setCategories([]);
            setMenuItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (itemId, quantity = 1, typeChoice = null) => {
        if (!user) {
            toast.error("Please login to add items");
            return;
        }
        try {
            setAddingItemId(itemId);
            await addToCart(itemId, quantity, typeChoice);
            toast.success("Added to cart!");
            setSelectedItem(null);
            setItemQuantity(1);
            setFoodTypeChoice(null);
        } catch (error) {
            toast.error("Couldn't add to cart");
        } finally {
            setAddingItemId(null);
        }
    };

    const getCartQuantity = (menuItemId) => {
        const cartItem = cartItems.find(ci => ci.menu_item_id === menuItemId);
        return cartItem ? cartItem.quantity : 0;
    };

    const getCartItemId = (menuItemId) => {
        const cartItem = cartItems.find(ci => ci.menu_item_id === menuItemId);
        return cartItem ? cartItem.id : null;
    };

    const handleIncrement = async (menuItemId) => {
        if (!user) { toast.error("Please login"); return; }
        try {
            setAddingItemId(menuItemId);
            await addToCart(menuItemId, 1);
        } catch { toast.error("Couldn't update"); }
        finally { setAddingItemId(null); }
    };

    const handleDecrement = async (menuItemId) => {
        const cartItemId = getCartItemId(menuItemId);
        const qty = getCartQuantity(menuItemId);
        if (!cartItemId) return;
        try {
            setAddingItemId(menuItemId);
            if (qty <= 1) {
                await removeItem(cartItemId);
            } else {
                await updateItem(cartItemId, qty - 1);
            }
        } catch { toast.error("Couldn't update"); }
        finally { setAddingItemId(null); }
    };

    const openItemDetail = (item) => {
        setSelectedItem(item);
        setItemQuantity(1);
        // Default food type choice for "both" items
        if (item.food_type === "both") {
            setFoodTypeChoice("veg");
        } else {
            setFoodTypeChoice(null);
        }
    };

    // Suggestions for dropdown
    const suggestionItems = searchQuery
        ? menuItems.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const suggestionCategories = searchQuery
        ? categories.filter((cat) =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    // Main search (categories + items)
    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Also show categories that contain matching items
    const categoriesWithMatchingItems = searchQuery
        ? categories.filter((cat) =>
            menuItems.some(
                (item) =>
                    item.category_id === cat.id &&
                    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
            )
        )
        : [];

    const visibleCategories = searchQuery
        ? [...new Map([...filteredCategories, ...categoriesWithMatchingItems].map(c => [c.id, c])).values()]
        : categories;

    // Items for selected category (with local search + food type filter)
    const categoryItems = menuItems.filter((item) => {
        if (item.category_id !== selectedCategory?.id) return false;
        if (searchQuery && !(
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )) return false;
        // Food type filter
        if (foodTypeFilter === "veg") {
            return item.is_veg || item.food_type === "veg" || item.food_type === "both";
        }
        if (foodTypeFilter === "nonveg") {
            return !item.is_veg || item.food_type === "non-veg" || item.food_type === "both";
        }
        return true;
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
            <div className="bg-primary py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        {selectedCategory && (
                            <button
                                onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                                className="text-white hover:text-accent transition-colors"
                                aria-label="Back to categories"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                {selectedCategory ? selectedCategory.name : "Our Menu"}
                            </h1>
                            <p className="text-white/60 text-sm mt-1">
                                {selectedCategory
                                    ? selectedCategory.description || "Browse items in this category"
                                    : "Choose a category to explore"}
                            </p>
                        </div>
                    </div>

                    {/* Search Bar with Suggestions */}
                    <div className="mt-6 relative max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" />
                        <input
                            type="text"
                            placeholder={selectedCategory ? `Search in ${selectedCategory.name}...` : "Search categories or dishes..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                            className="w-full pl-11 pr-4 py-3 bg-primary-light text-white placeholder:text-white/40 rounded-xl border border-primary-light focus:border-accent outline-none transition-colors"
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && searchQuery.length > 0 && !selectedCategory && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50">
                                {/* Matching items */}
                                {suggestionItems.length > 0 && (
                                    <div className="p-2">
                                        <p className="text-xs text-charcoal/40 font-medium px-3 py-1">Dishes</p>
                                        {suggestionItems.slice(0, 5).map((item) => (
                                            <button
                                                key={`item-${item.id}`}
                                                onClick={() => {
                                                    const cat = categories.find(c => c.id === item.category_id);
                                                    if (cat) setSelectedCategory(cat);
                                                    setSearchQuery(item.name);
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cream transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-cream">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-charcoal truncate">{item.name}</p>
                                                    <p className="text-xs text-charcoal/40">{item.category_name} • ₹{item.discount_price || item.price}</p>
                                                </div>
                                                <Plus size={16} className="text-accent flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Matching categories */}
                                {suggestionCategories.length > 0 && (
                                    <div className="p-2 border-t border-gray-100">
                                        <p className="text-xs text-charcoal/40 font-medium px-3 py-1">Categories</p>
                                        {suggestionCategories.slice(0, 3).map((cat) => (
                                            <button
                                                key={`cat-${cat.id}`}
                                                onClick={() => {
                                                    setSelectedCategory(cat);
                                                    setSearchQuery("");
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cream transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-cream">
                                                    {cat.image_url ? (
                                                        <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">📂</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-charcoal truncate">{cat.name}</p>
                                                    <p className="text-xs text-charcoal/40">{menuItems.filter(i => i.category_id === cat.id).length} items</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {suggestionItems.length === 0 && suggestionCategories.length === 0 && (
                                    <div className="p-4 text-center text-charcoal/40 text-sm">
                                        No results for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8" onClick={() => setShowSuggestions(false)}>
                {/* Categories View */}
                {!selectedCategory && !viewAll && (
                    <>
                        {visibleCategories.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-charcoal/50 text-lg">No categories found</p>
                            </div>
                        ) : (
                            <>
                                {/* View All button */}
                                <button
                                    onClick={() => setViewAll(true)}
                                    className="mb-5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-all"
                                >
                                    View All Items
                                </button>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {visibleCategories.map((cat) => {
                                    const catItemCount = menuItems.filter(i => i.category_id === cat.id).length;
                                    return (
                                        <MagicBentoCard
                                            key={cat.id}
                                            onClick={() => { setSelectedCategory(cat); setSearchQuery(""); }}
                                            glowColor="26, 60, 52"
                                            enableTilt={false}
                                            enableMagnetism={true}
                                            clickEffect={true}
                                            enableBorderGlow={true}
                                        >
                                            <div className="h-36 bg-primary-light/5 flex items-center justify-center overflow-hidden rounded-t-[19px]">
                                                {cat.image_url ? (
                                                    <img
                                                        src={cat.image_url}
                                                        alt={cat.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-5xl">🍽️</span>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-charcoal text-lg">{cat.name}</h3>
                                                {cat.description && (
                                                    <p className="text-charcoal/50 text-sm mt-1 line-clamp-2">{cat.description}</p>
                                                )}
                                                <p className="text-accent text-sm font-medium mt-2">{catItemCount} items →</p>
                                            </div>
                                        </MagicBentoCard>
                                    );
                                })}
                            </div>
                            </>
                        )}
                    </>
                )}

                {/* View All Items - grouped by category */}
                {viewAll && !selectedCategory && (
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <button
                                onClick={() => setViewAll(false)}
                                className="px-4 py-2 bg-white text-charcoal border border-gray-200 rounded-lg text-sm font-medium hover:border-primary transition-all"
                            >
                                ← Back to Categories
                            </button>
                            <button
                                onClick={() => setFoodTypeFilter("all")}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${foodTypeFilter === "all" ? "bg-primary text-white" : "bg-white text-charcoal border border-gray-200"}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFoodTypeFilter("veg")}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${foodTypeFilter === "veg" ? "bg-green-500 text-white" : "bg-white text-charcoal border border-gray-200"}`}
                            >
                                <span className="w-3 h-3 border-2 border-current rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-current rounded-full"></span></span>
                                Veg
                            </button>
                            <button
                                onClick={() => setFoodTypeFilter("nonveg")}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${foodTypeFilter === "nonveg" ? "bg-red-500 text-white" : "bg-white text-charcoal border border-gray-200"}`}
                            >
                                <span className="w-3 h-3 border-2 border-current rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-current rounded-full"></span></span>
                                Non-Veg
                            </button>
                        </div>

                        {categories.map((cat) => {
                            const catItems = menuItems.filter(i => {
                                if (i.category_id !== cat.id) return false;
                                if (foodTypeFilter === "veg") return i.is_veg || i.food_type === "veg" || i.food_type === "both";
                                if (foodTypeFilter === "nonveg") return !i.is_veg || i.food_type === "non-veg" || i.food_type === "both";
                                return true;
                            });
                            if (catItems.length === 0) return null;
                            return (
                                <div key={cat.id} className="mb-8">
                                    <h2 className="text-lg font-bold text-charcoal mb-3 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-accent rounded-full"></span>
                                        {cat.name}
                                        <span className="text-sm font-normal text-charcoal/40">({catItems.length})</span>
                                    </h2>
                                    <div className="space-y-3">
                                        {catItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                                onClick={() => openItemDetail(item)}
                                            >
                                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-cream">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-charcoal text-sm">{item.name}</h3>
                                                        {item.is_veg ? (
                                                            <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>
                                                        ) : (
                                                            <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-accent text-sm">₹{item.discount_price || item.price}</span>
                                                </div>
                                                {getCartQuantity(item.id) > 0 ? (
                                                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <button onClick={() => handleDecrement(item.id)} className="w-7 h-7 rounded-full bg-cream flex items-center justify-center hover:bg-accent hover:text-white transition-all"><Minus size={12} /></button>
                                                        <span className="w-6 text-center font-semibold text-charcoal text-xs">{getCartQuantity(item.id)}</span>
                                                        <button onClick={() => handleIncrement(item.id)} className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-all"><Plus size={12} /></button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleAddToCart(item.id); }}
                                                        className="bg-accent hover:bg-accent-dark text-white w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Items View (inside a category) */}
                {selectedCategory && (
                    <>
                        {/* Veg/Non-Veg filter */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setFoodTypeFilter("all")}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${foodTypeFilter === "all" ? "bg-primary text-white" : "bg-white text-charcoal border border-gray-200"}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFoodTypeFilter("veg")}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${foodTypeFilter === "veg" ? "bg-green-500 text-white" : "bg-white text-charcoal border border-gray-200"}`}
                            >
                                <span className="w-3 h-3 border-2 border-current rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-current rounded-full"></span></span>
                                Veg
                            </button>
                            <button
                                onClick={() => setFoodTypeFilter("nonveg")}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${foodTypeFilter === "nonveg" ? "bg-red-500 text-white" : "bg-white text-charcoal border border-gray-200"}`}
                            >
                                <span className="w-3 h-3 border-2 border-current rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-current rounded-full"></span></span>
                                Non-Veg
                            </button>
                        </div>

                        {categoryItems.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-charcoal/50 text-lg">
                                    {searchQuery ? "No items match your search" : "No items in this category yet"}
                                </p>
                            </div>
                        ) : (
                            <AnimatedList
                                items={categoryItems}
                                showGradients={true}
                                enableArrowNavigation={true}
                                displayScrollbar={false}
                                onItemSelect={(item) => openItemDetail(item)}
                                renderItem={(item, index, isSelected) => (
                                    <div className={`bg-white rounded-2xl p-4 flex items-center gap-4 transition-all ${isSelected ? "shadow-md" : "shadow-sm"}`}>
                                        {/* Image */}
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-cream">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-charcoal text-sm sm:text-base">{item.name}</h3>
                                                {item.is_veg ? (
                                                    <span className="w-3.5 h-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>
                                                ) : (
                                                    <span className="w-3.5 h-3.5 border-2 border-red-600 rounded-sm flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-charcoal/50 text-xs sm:text-sm mt-0.5 line-clamp-1">{item.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {item.discount_price && parseFloat(item.discount_price) < parseFloat(item.price) ? (
                                                    <>
                                                        <span className="font-bold text-accent text-sm">₹{item.discount_price}</span>
                                                        <span className="text-charcoal/40 text-xs line-through">₹{item.price}</span>
                                                    </>
                                                ) : (
                                                    <span className="font-bold text-accent text-sm">₹{item.price}</span>
                                                )}
                                                {item.preparation_time && (
                                                    <span className="text-charcoal/40 text-xs flex items-center gap-0.5">
                                                        <Clock size={10} /> {item.preparation_time}min
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick add / quantity control */}
                                        {getCartQuantity(item.id) > 0 ? (
                                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleDecrement(item.id)}
                                                    disabled={addingItemId === item.id}
                                                    className="w-8 h-8 rounded-full bg-cream flex items-center justify-center hover:bg-accent hover:text-white transition-all disabled:opacity-50"
                                                    aria-label="Decrease"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-7 text-center font-semibold text-charcoal text-sm">
                                                    <Counter value={getCartQuantity(item.id)} fontSize={14} textColor="#1a1a1a" fontWeight={600} />
                                                </span>
                                                <button
                                                    onClick={() => handleIncrement(item.id)}
                                                    disabled={addingItemId === item.id}
                                                    className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-all disabled:opacity-50"
                                                    aria-label="Increase"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAddToCart(item.id); }}
                                                disabled={addingItemId === item.id}
                                                className="bg-accent hover:bg-accent-dark text-white w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 flex-shrink-0"
                                                aria-label={`Add ${item.name}`}
                                            >
                                                <Plus size={18} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Item Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0" onClick={() => setSelectedItem(null)}>
                    <div
                        className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto relative animate-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 z-10 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        {/* Image */}
                        <div className="h-64 sm:h-72 bg-cream overflow-hidden rounded-t-2xl">
                            {selectedItem.image_url ? (
                                <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-7xl">🍽️</div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            {/* Veg/Non-veg badge */}
                            <span className={`inline-flex items-center gap-1 text-xs font-medium mb-2 ${selectedItem.is_veg ? 'text-green-600' : 'text-red-600'}`}>
                                <span className={`w-4 h-4 border-2 ${selectedItem.is_veg ? 'border-green-600' : 'border-red-600'} rounded-sm flex items-center justify-center`}>
                                    <span className={`w-2 h-2 ${selectedItem.is_veg ? 'bg-green-600' : 'bg-red-600'} rounded-full`}></span>
                                </span>
                                {selectedItem.is_veg ? 'Veg' : 'Non-Veg'}
                            </span>

                            <h2 className="text-xl font-bold text-charcoal">{selectedItem.name}</h2>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedItem.calories && (
                                    <span className="bg-cream text-charcoal/60 text-xs px-2.5 py-1 rounded-full">{selectedItem.calories} cal</span>
                                )}
                                {selectedItem.preparation_time && (
                                    <span className="bg-cream text-charcoal/60 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Clock size={10} /> {selectedItem.preparation_time} min
                                    </span>
                                )}
                                {selectedItem.category_name && (
                                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">{selectedItem.category_name}</span>
                                )}
                            </div>

                            {/* Description */}
                            {selectedItem.description && (
                                <p className="text-charcoal/60 text-sm mt-3 leading-relaxed">{selectedItem.description}</p>
                            )}

                            {/* Veg/Non-Veg choice for "both" items */}
                            {selectedItem.food_type === "both" && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-charcoal mb-2">Choose type:</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setFoodTypeChoice("veg")}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${foodTypeChoice === "veg" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-charcoal/60"}`}
                                        >
                                            <span className="w-4 h-4 border-2 border-green-600 rounded-sm flex items-center justify-center">
                                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                            </span>
                                            Veg
                                        </button>
                                        <button
                                            onClick={() => setFoodTypeChoice("non-veg")}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${foodTypeChoice === "non-veg" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-charcoal/60"}`}
                                        >
                                            <span className="w-4 h-4 border-2 border-red-600 rounded-sm flex items-center justify-center">
                                                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                            </span>
                                            Non-Veg
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom bar — quantity + add button */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex items-center gap-4">
                            {/* Quantity selector */}
                            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                                    className="w-10 h-10 flex items-center justify-center text-accent hover:bg-cream transition-colors"
                                    aria-label="Decrease"
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="w-10 text-center font-semibold text-charcoal">{itemQuantity}</span>
                                <button
                                    onClick={() => setItemQuantity(Math.min(20, itemQuantity + 1))}
                                    className="w-10 h-10 flex items-center justify-center text-accent hover:bg-cream transition-colors"
                                    aria-label="Increase"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Add to cart button */}
                            <button
                                onClick={() => handleAddToCart(selectedItem.id, itemQuantity, foodTypeChoice)}
                                disabled={addingItemId === selectedItem.id}
                                className="flex-1 bg-accent hover:bg-accent-dark text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 text-center"
                            >
                                {addingItemId === selectedItem.id ? "Adding..." : (
                                    <>
                                        Add item
                                        {selectedItem.discount_price && parseFloat(selectedItem.discount_price) < parseFloat(selectedItem.price) ? (
                                            <> <span className="line-through opacity-60">₹{(selectedItem.price * itemQuantity).toFixed(0)}</span> ₹{(selectedItem.discount_price * itemQuantity).toFixed(0)}</>
                                        ) : (
                                            <> ₹{(selectedItem.price * itemQuantity).toFixed(0)}</>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
