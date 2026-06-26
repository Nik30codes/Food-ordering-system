import api from "./api.js";

export const getCategories = async (restaurantId) => {
    const res = await api.get(`/api/admin/categories`, { params: { restaurant_id: restaurantId } });
    return res.data;
};

export const getMenuItems = async (categoryId) => {
    const params = categoryId ? { category_id: categoryId } : {};
    const res = await api.get("/api/admin/menu-items", { params });
    return res.data;
};
