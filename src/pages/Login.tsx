import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register, resetPassword, loginWithGoogle } = useAuth();
  const { theme } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setMessage("Check your inbox for a password reset email");
      } else if (isLogin) {
        await login(email, password);
        navigate("/");
      } else {
        if (!name.trim()) throw new Error("Full name is required");
        await register(name, email, password);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <span className="font-bold text-4xl tracking-wider" style={{ color: "var(--accent)" }}>
            SPEND
          </span>
          <span className="font-bold text-4xl tracking-wider" style={{ color: "var(--text-primary)" }}>
            ORA
          </span>
        </div>
        <h2
          className="mt-6 text-center text-3xl font-extrabold"
          style={{ color: "var(--text-primary)" }}
        >
          {isForgotPassword
            ? "Reset your password"
            : isLogin
              ? "Sign in to your account"
              : "Create a new account"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="py-8 px-4 shadow sm:rounded-2xl sm:px-10 border transition-colors duration-300"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-xl text-sm">
                {message}
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl block w-full pl-10 sm:text-sm py-3 border outline-none focus:ring-2 transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl block w-full pl-10 sm:text-sm py-3 border outline-none focus:ring-2 transition-all"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl block w-full pl-10 sm:text-sm py-3 border outline-none focus:ring-2 transition-all"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-black transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading
                  ? "Processing..."
                  : isForgotPassword
                    ? "Send reset link"
                    : isLogin
                      ? "Sign in"
                      : "Sign up"}
              </button>
            </div>
          </form>

          {isForgotPassword ? (
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsForgotPassword(false)}
                className="flex items-center justify-center space-x-2 text-sm transition-colors mx-auto"
                style={{ color: "var(--text-muted)" }}
              >
                <ArrowLeft size={16} />
                <span>Back to sign in</span>
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span
                      className="px-2"
                      style={{ background: "var(--bg-surface)", color: "var(--text-muted)" }}
                    >
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border rounded-xl shadow-sm text-sm font-medium transition-colors disabled:opacity-50"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm transition-colors"
                  style={{ color: "var(--accent)" }}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
