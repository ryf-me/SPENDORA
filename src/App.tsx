import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { AppProvider, useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import { Loader2 } from "lucide-react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import Debtors from "./pages/Debtors";
import ExpenseHistory from "./pages/ExpenseHistory";
import Calendar from "./pages/Calendar";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import Reports from "./pages/Reports";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const { theme } = useApp();

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen font-sans space-y-4"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: "var(--accent)" }} />
        <span className="text-sm font-medium animate-pulse" style={{ color: "var(--text-muted)" }}>
          Checking authentication...
        </span>
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="expenses" element={<AddExpense />} />
                <Route path="debtors" element={<Debtors />} />
                <Route path="history" element={<ExpenseHistory />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="settings" element={<Settings />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </AppProvider>
  );
}
