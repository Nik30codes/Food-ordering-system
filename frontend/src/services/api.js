import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Response interceptor — only redirect on 401 for protected customer pages
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url || "";
            // Don't redirect for admin endpoints or public menu browsing
            if (!url.includes("/api/admin/") && !url.includes("/api/profile")) {
                const path = window.location.pathname;
                if (["/cart", "/orders", "/profile"].includes(path)) {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
