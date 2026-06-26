import api from "./api.js";

export const getCart = async () => {
    const res = await api.get("/api/cart");
    return res.data;
};

export const addToCart = async (menu_item_id, quantity, food_type_choice = null) => {
    const body = { menu_item_id, quantity };
    if (food_type_choice) body.food_type_choice = food_type_choice;
    const res = await api.post("/api/cart/add", body);
    return res.data;
};

export const updateCartItem = async (item_id, quantity) => {
    const res = await api.put("/api/cart/update", { item_id, quantity });
    return res.data;
};

export const removeFromCart = async (itemId) => {
    const res = await api.delete(`/api/cart/remove/${itemId}`);
    return res.data;
};

export const clearCart = async () => {
    const res = await api.delete("/api/cart/clear");
    return res.data;
};
