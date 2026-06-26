import api from "./api.js";

export const loginUser = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    return res.data;
};

export const registerUser = async (name, email, password, phone) => {
    const res = await api.post("/api/auth/register", { name, email, password, phone });
    return res.data;
};

export const logoutUser = async () => {
    const res = await api.post("/api/auth/logout");
    return res.data;
};

export const getProfile = async () => {
    const res = await api.get("/api/profile");
    return res.data;
};
