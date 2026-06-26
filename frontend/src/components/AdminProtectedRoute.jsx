import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

const AdminProtectedRoute = ({ children }) => {
    const { admin, loading } = useAdminAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!admin) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
