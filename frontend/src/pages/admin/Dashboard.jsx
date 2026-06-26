import { useState, useEffect } from "react";
import { ShoppingBag, DollarSign, TrendingUp, Clock } from "lucide-react";
import api from "../../services/api.js";

const Dashboard = () => {
    const [stats, setStats] = useState({ today: {}, this_week: {}, this_month: {} });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const [statsRes, ordersRes] = await Promise.all([
                api.get("/api/admin/analytics/summary"),
                api.get("/api/admin/orders?status=pending"),
            ]);
            setStats(statsRes.data);
            setRecentOrders(ordersRes.data.orders?.slice(0, 5) || []);
        } catch (error) {
            console.error("Dashboard fetch error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        { label: "Today's Orders", value: stats.today?.total_orders || 0, icon: ShoppingBag, color: "bg-primary" },
        { label: "Today's Revenue", value: `₹${parseFloat(stats.today?.total_revenue || 0).toFixed(0)}`, icon: DollarSign, color: "bg-accent" },
        { label: "Weekly Revenue", value: `₹${parseFloat(stats.this_week?.total_revenue || 0).toFixed(0)}`, icon: TrendingUp, color: "bg-primary-light" },
        { label: "Avg Order Value", value: `₹${parseFloat(stats.today?.average_order_value || 0).toFixed(0)}`, icon: Clock, color: "bg-charcoal" },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-charcoal mb-6">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-charcoal/50 text-sm">{card.label}</p>
                                <p className="text-2xl font-bold text-charcoal mt-1">{card.value}</p>
                            </div>
                            <div className={`${card.color} p-3 rounded-lg`}>
                                <card.icon size={20} className="text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Orders */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4">Pending Orders</h2>
                {recentOrders.length === 0 ? (
                    <p className="text-charcoal/50 text-sm">No pending orders right now.</p>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="font-medium text-charcoal">Order #{order.id}</p>
                                    <p className="text-charcoal/50 text-sm">{order.customer_name || "Customer"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-primary">₹{order.total_amount}</p>
                                    <p className="text-xs text-charcoal/40">
                                        {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
