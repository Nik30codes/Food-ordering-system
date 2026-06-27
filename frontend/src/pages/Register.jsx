import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { registerUser } from "../services/authService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";
import SmoothInput from "../components/SmoothInput.jsx";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await registerUser(name, email, password, phone);
            login(data.user);
            localStorage.setItem('akio_show_onboarding', 'true');
            toast.success("Account created! Welcome to Akio.");
            navigate("/");
        } catch (err) {
            const msg = err.response?.data?.message || "";
            if (msg.includes("Unable to create account") || msg.includes("different credentials")) {
                setError("An account with this email already exists. Please sign in instead.");
            } else if (msg.includes("Validation failed")) {
                const errors = err.response?.data?.errors;
                if (errors && errors.length > 0) {
                    setError(errors.map(e => e.message).join(". "));
                } else {
                    setError("Please check your details and try again.");
                }
            } else if (msg.includes("Too many")) {
                setError("Too many attempts. Please wait 15 minutes and try again.");
            } else {
                setError("Something went wrong. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-charcoal">
                            Join Aki<span className="text-accent">o</span>
                        </h1>
                        <p className="text-charcoal/60 mt-2">Create your account</p>
                    </div>

                    {/* Inline error message */}
                    {error && (
                        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-red-600 text-sm">
                                {error}
                                {error.includes("already exists") && (
                                    <>
                                        {" "}
                                        <Link to="/login" className="text-accent font-medium hover:underline">
                                            Go to Sign In →
                                        </Link>
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1">
                                Full Name
                            </label>
                            <SmoothInput
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => { setName(e.target.value); setError(""); }}
                                required
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
                                Email
                            </label>
                            <SmoothInput
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-1">
                                Phone Number
                            </label>
                            <SmoothInput
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                                required
                                placeholder="7012XXXXXX"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <SmoothInput
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    required
                                    minLength={8}
                                    placeholder="Min 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-charcoal/60 mt-6">
                        Already have an account?{" "}
                        <Link to="/login" className="text-accent font-medium hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
