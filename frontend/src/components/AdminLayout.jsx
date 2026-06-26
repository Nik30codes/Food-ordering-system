import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar.jsx";

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen bg-cream">
            <AdminSidebar />
            <main className="flex-1 ml-64 p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
