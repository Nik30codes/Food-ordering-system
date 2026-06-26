import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Leaf } from "lucide-react";
import api from "../../services/api.js";
import { toast } from "sonner";

const AdminMenuItems = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState({
        category_id: "", name: "", description: "", price: "", discount_price: "",
        image_url: "", is_veg: false, is_available: true, preparation_time: "", calories: "",
    });

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        setUploading(true);
        try {
            const res = await api.post("/api/admin/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setForm((prev) => ({ ...prev, image_url: res.data.image_url }));
            toast.success("Image uploaded!");
        } catch (error) {
            toast.error("Upload not available right now, paste a URL instead.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [itemsRes, catRes] = await Promise.all([
                api.get("/api/admin/menu-items"),
                api.get("/api/admin/categories"),
            ]);
            setItems(itemsRes.data.menu_items || []);
            setCategories(catRes.data.categories || []);
        } catch { } finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ category_id: categories[0]?.id || "", name: "", description: "", price: "", discount_price: "", image_url: "", food_type: "veg", is_available: true, preparation_time: "", calories: "" });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        const foodType = item.food_type || (item.is_veg ? "veg" : "non-veg");
        setForm({
            category_id: item.category_id, name: item.name, description: item.description || "",
            price: item.price, discount_price: item.discount_price || "", image_url: item.image_url || "",
            food_type: foodType, is_available: item.is_available, preparation_time: item.preparation_time || "", calories: item.calories || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            category_id: parseInt(form.category_id),
            price: parseFloat(form.price),
            discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
            preparation_time: form.preparation_time ? parseInt(form.preparation_time) : null,
            calories: form.calories ? parseInt(form.calories) : null,
            is_veg: form.food_type === "veg" || form.food_type === "both",
            food_type: form.food_type,
        };
        delete payload.food_type;
        try {
            if (editing) {
                await api.put(`/api/admin/menu-items/${editing.id}`, payload);
                toast.success("Item updated");
            } else {
                await api.post("/api/admin/menu-items", payload);
                toast.success("Item created");
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't save, try again");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this menu item?")) return;
        try {
            await api.delete(`/api/admin/menu-items/${id}`);
            toast.success("Item deleted");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Couldn't delete, try again");
        }
    };

    const toggleAvailability = async (id) => {
        try {
            const res = await api.put(`/api/admin/menu-items/${id}/availability`);
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const toggleFeatured = async (id) => {
        try {
            const res = await api.put(`/api/admin/menu-items/${id}/featured`);
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-charcoal">Menu Items</h1>
                <button onClick={openCreate} className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors">
                    <Plus size={16} /> Add Item
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                    <p className="text-charcoal/50">No menu items yet. Add your first dish!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                            <div className="h-32 bg-primary-light/10 flex items-center justify-center">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">🍽️</span>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-charcoal flex items-center gap-1">
                                            {item.name}
                                            {item.food_type === "both" ? (
                                                <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-green-50 to-red-50 border border-gray-200 text-[10px] rounded font-medium text-charcoal/70">
                                                    <span className="w-2.5 h-2.5 rounded-sm flex overflow-hidden"><span className="w-1/2 bg-green-600"></span><span className="w-1/2 bg-red-600"></span></span>
                                                    Veg/Non-Veg
                                                </span>
                                            ) : item.is_veg ? (
                                                <Leaf size={14} className="text-green-500" />
                                            ) : (
                                                <span className="w-3 h-3 border-2 border-red-600 rounded-sm inline-flex items-center justify-center ml-1"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>
                                            )}
                                        </h3>
                                        <p className="text-charcoal/50 text-xs">{item.category_name}</p>
                                    </div>
                                    <p className="font-bold text-primary">₹{item.price}</p>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleAvailability(item.id)}
                                            className={`px-2 py-1 rounded text-xs font-medium ${item.is_available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                        >
                                            {item.is_available ? "Available" : "Unavailable"}
                                        </button>
                                        <button
                                            onClick={() => toggleFeatured(item.id)}
                                            className={`px-2 py-1 rounded text-xs font-medium ${item.is_featured ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}
                                        >
                                            {item.is_featured ? "⭐ Featured" : "☆ Feature"}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(item)} className="text-charcoal/40 hover:text-primary"><Pencil size={14} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="text-charcoal/40 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-charcoal">{editing ? "Edit Item" : "New Menu Item"}</h2>
                            <button onClick={() => setShowModal(false)} className="text-charcoal/40 hover:text-charcoal"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-charcoal mb-1">Name *</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-charcoal mb-1">Category *</label>
                                    <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm">
                                        <option value="">Select</option>
                                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-charcoal mb-1">Price (₹) *</label>
                                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-charcoal mb-1">Discount Price</label>
                                    <input type="number" step="0.01" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-charcoal mb-1">Prep Time (mins)</label>
                                    <input type="number" value={form.preparation_time} onChange={(e) => setForm({ ...form, preparation_time: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-charcoal mb-1">Calories</label>
                                    <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-charcoal mb-1">Image</label>
                                    <div className="space-y-2">
                                        {form.image_url && (
                                            <img src={form.image_url} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                                        )}
                                        <label className="block cursor-pointer bg-gray-100 hover:bg-gray-200 text-charcoal text-xs font-medium py-2 rounded-lg text-center transition-colors">
                                            {uploading ? "Uploading..." : "📷 Upload Image"}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="hidden"
                                            />
                                        </label>
                                        <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm" placeholder="Or paste URL" />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary outline-none text-sm resize-none" />
                                </div>
                                <div className="flex items-center gap-4 col-span-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-medium text-charcoal mb-1">Food Type</label>
                                        <div className="flex gap-3">
                                            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${form.food_type === "veg" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-charcoal/60"}`}>
                                                <input type="radio" name="food_type" value="veg" checked={form.food_type === "veg"} onChange={(e) => setForm({ ...form, food_type: e.target.value })} className="hidden" />
                                                <span className="w-3 h-3 border-2 border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>
                                                Veg
                                            </label>
                                            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${form.food_type === "non-veg" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-charcoal/60"}`}>
                                                <input type="radio" name="food_type" value="non-veg" checked={form.food_type === "non-veg"} onChange={(e) => setForm({ ...form, food_type: e.target.value })} className="hidden" />
                                                <span className="w-3 h-3 border-2 border-red-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>
                                                Non-Veg
                                            </label>
                                            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${form.food_type === "both" ? "border-amber-500 bg-gradient-to-r from-green-50 to-red-50 text-charcoal" : "border-gray-200 text-charcoal/60"}`}>
                                                <input type="radio" name="food_type" value="both" checked={form.food_type === "both"} onChange={(e) => setForm({ ...form, food_type: e.target.value })} className="hidden" />
                                                <span className="w-3.5 h-3.5 border rounded-sm flex overflow-hidden"><span className="w-1/2 bg-green-600"></span><span className="w-1/2 bg-red-600"></span></span>
                                                Veg/Non-Veg
                                            </label>
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm mt-2">
                                        <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="rounded" />
                                        Available
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-medium transition-all">
                                {editing ? "Update" : "Create"} Item
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminMenuItems;
