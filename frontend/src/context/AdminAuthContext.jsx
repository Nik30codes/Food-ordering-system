import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
    return context;
};

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
        try {
            const res = await api.get("/api/admin/auth/me");
            setAdmin(res.data.admin);
        } catch {
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    };

    const login = (adminData) => {
        setAdmin(adminData);
    };

    const logout = async () => {
        try {
            await api.post("/api/admin/auth/logout");
        } catch { }
        setAdmin(null);
    };

    return (
        <AdminAuthContext.Provider value={{ admin, loading, login, logout, checkAdminAuth }}>
            {children}
        </AdminAuthContext.Provider>
    );
};
