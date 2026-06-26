import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AdminSidebar from "./AdminSidebar.jsx";

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-cream">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <AdminSidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-4 sm:p-6">
                {/* Mobile header */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden mb-4 p-2 bg-white rounded-lg shadow-sm"
                    aria-label="Open menu"
                >
                    <Menu size={22} className="text-charcoal" />
                </button>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
