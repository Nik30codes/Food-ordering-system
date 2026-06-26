import { useState, useEffect } from "react";
import { TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
import api from "../../services/api.js";

const AdminAnalytics = () => {
    const [daily, setDaily] = useState([]);
    const [popular, setPopular] = useState([]);
    const [revenue, setRevenue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            const [dailyRes, popularRes, revenueRes] = await Promise.all([
                api.get("/api/admin/analytics/daily?days=14"),
                api.get("/api/admin/analytics/popular-items?limit=5"),
                api.get("/api/admin/analytics/revenue"),
            ]);
            setDaily(dailyRes.data.analytics || []);
            setPopular(popularRes.data.popular_items || []);
            setRevenue(revenueRes.data.revenue_breakdown || []);
        } catch { } finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-accent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-charcoal mb-6">Analytics</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Revenue */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" /> Daily Revenue (14 days)
                    </h2>
                    {daily.length === 0 ? (
                        <p className="text-charcoal/50 text-sm">No data yet</p>
                    ) : (
                        <div className="space-y-2">
                            {daily.map((day) => (
                                <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-sm text-charcoal/60">
                                        {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-charcoal/40">{day.total_orders} orders</span>
                                        <span className="font-semibold text-primary text-sm">₹{parseFloat(day.total_revenue).toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Popular Items */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-accent" /> Most Popular Items
                    </h2>
                    {popular.length === 0 ? (
                        <p className="text-charcoal/50 text-sm">No data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {popular.map((item, i) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-charcoal text-sm">{item.name}</p>
                                        <p className="text-charcoal/40 text-xs">Ordered {item.total_quantity} times</p>
                                    </div>
                                    <span className="font-semibold text-primary text-sm">₹{item.price}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                        <DollarSign size={18} className="text-green-600" /> Revenue by Payment Status
                    </h2>
                    {revenue.length === 0 ? (
                        <p className="text-charcoal/50 text-sm">No payment data yet</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {revenue.map((item) => (
                                <div key={item.payment_status} className="bg-cream rounded-lg p-4 text-center">
                                    <p className="text-charcoal/50 text-sm capitalize">{item.payment_status}</p>
                                    <p className="text-2xl font-bold text-charcoal mt-1">₹{parseFloat(item.total_amount).toFixed(0)}</p>
                                    <p className="text-charcoal/40 text-xs">{item.count} payments</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
