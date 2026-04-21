import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm, SmokeyBackground } from "@/components/ui/login-form";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    login,
    register,
    resetPassword,
    updatePassword,
    loginWithGoogle,
    currentUser,
    loading: authLoading,
    isPasswordRecovery,
  } = useAuth();
  const navigate = useNavigate();

  const mode = isPasswordRecovery
    ? "password-recovery"
    : isForgotPassword
      ? "forgot-password"
      : isLogin
        ? "login"
        : "signup";

  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  useEffect(() => {
    if (!authLoading && currentUser && !isPasswordRecovery) {
      navigate("/", { replace: true });
    }
  }, [authLoading, currentUser, isPasswordRecovery, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isPasswordRecovery) {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        await updatePassword(password);
        setMessage("Password updated successfully. Redirecting to your dashboard...");
      } else if (isForgotPassword) {
        await resetPassword(email);
        setMessage("Check your inbox for a password reset email");
      } else if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error("Full name is required");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        await register(name, email, password);
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
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (nextMode: "login" | "signup" | "forgot-password") => {
    setError("");
    setMessage("");

    if (nextMode === "forgot-password") {
      setIsForgotPassword(true);
      return;
    }

    setIsForgotPassword(false);
    setIsLogin(nextMode === "login");
    setConfirmPassword("");
  };

  const handleBackToLogin = () => {
    setError("");
    setMessage("");
    setIsForgotPassword(false);
    navigate("/login", { replace: true });
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      <SmokeyBackground className="absolute inset-0" color="#2563EB" backdropBlurAmount="sm" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.72),rgba(2,6,23,0.92))]" />
      <LoginForm
        mode={mode}
        name={name}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        loading={loading}
        error={error}
        message={message}
        passwordMismatch={passwordMismatch}
        onNameChange={setName}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleSubmit}
        onGoogleLogin={handleGoogleLogin}
        onModeChange={handleModeChange}
        onBackToLogin={handleBackToLogin}
      />
    </main>
  );
}
