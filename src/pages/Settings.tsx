import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useData } from "../context/DataContext";
import { User, Mail, Globe, Tag, Trash2, Plus } from "lucide-react";

export default function Settings() {
  const { currentUser, profileData, updateUserProfile } = useAuth();
  const { theme, setTheme, currency, setCurrency, timezone, setTimezone } = useApp();
  const { categories, addCategory, deleteCategory } = useData();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile state
  const [name, setName] = useState(profileData?.name || currentUser?.displayName || "");
  const [bio, setBio] = useState(profileData?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: "", text: "" });

  const [newCategory, setNewCategory] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  // Sync state when profile data loads
  React.useEffect(() => {
    if (profileData?.name && !name) setName(profileData.name);
    else if (currentUser?.displayName && !name) setName(currentUser.displayName);
    if (profileData?.bio && !bio) setBio(profileData.bio);
  }, [profileData, currentUser]);

  const PREDEFINED_AVATARS = [
    { name: "Luffy", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Luffy" },
    { name: "Naruto", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Naruto" },
    { name: "Ash", url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Ash" },
    { name: "Klaus", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Klaus" },
    { name: "Buster", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Buster" },
    { name: "Sasha", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha" },
    { name: "Felix", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix" },
    { name: "Goku", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Goku" },
  ];

  const handleAvatarSelect = (url: string) => {
    setAvatarPreview(url);
  };

  const handleSaveProfile = async () => {
    const timeoutId = setTimeout(() => {
      if (saveLoading) {
        setSaveLoading(false);
        setSaveMessage({ type: "error", text: "Update is taking longer than expected. Please check your internet connection." });
      }
    }, 15000); // 15 second timeout

    setSaveLoading(true);
    setSaveMessage({ type: "", text: "" });
    try {
      console.log("Settings: Initiating profile save...");
      await updateUserProfile({
        name,
        bio,
        photoURL: avatarPreview || currentUser?.photoURL || undefined
      });

      clearTimeout(timeoutId);
      setAvatarPreview(null);
      setSaveMessage({ type: "success", text: "Profile updated successfully!" });
      console.log("Settings: Profile save completed successfully.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Settings: Profile save error:", err);
      setSaveMessage({ type: "error", text: err.message || "Failed to update profile" });
    } finally {
      setSaveLoading(false);
    }
  };

  const tabBtnClass = (tab: string) =>
    `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium`;

  const tabBtnStyle = (tab: string): React.CSSProperties =>
    activeTab === tab
      ? { background: "var(--bg-muted)", color: "var(--accent)" }
      : { color: "var(--text-muted)" };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setCategoryLoading(true);
    setCategoryError("");
    try {
      await addCategory(newCategory.trim());
      setNewCategory("");
    } catch (err: any) {
      console.error(err);
      setCategoryError(err.message || "Failed to add category. Check your connection or Firestore rules.");
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Manage your account and preferences
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row min-h-[600px] border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        {/* Sidebar */}
        <div
          className="w-full md:w-64 p-6 space-y-2 border-r"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          {[
            { key: "profile", icon: User, label: "Profile" },
            { key: "preferences", icon: Globe, label: "Preferences" },
            { key: "categories", icon: Tag, label: "Categories" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={tabBtnClass(key)}
              style={tabBtnStyle(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                Public Profile
              </h2>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative">
                    <img
                      src={
                        avatarPreview ||
                        currentUser?.photoURL ||
                        `https://ui-avatars.com/api/?name=${currentUser?.email}&background=random`
                      }
                      alt="Profile"
                      className="w-32 h-32 rounded-3xl border-4 object-cover rotate-3 shadow-xl"
                      style={{ borderColor: "var(--accent)", background: "var(--bg-elevated)" }}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-black font-bold px-3 py-1 rounded-lg text-[10px] shadow-lg uppercase tracking-tighter">
                      Current
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Select Your Vibe</h3>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Pick an anime or cartoon character to represent you!
                      </p>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {PREDEFINED_AVATARS.map((avatar) => (
                        <button
                          key={avatar.url}
                          onClick={() => handleAvatarSelect(avatar.url)}
                          title={avatar.name}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-110 active:scale-95 shadow-md ${(avatarPreview === avatar.url || (!avatarPreview && currentUser?.photoURL === avatar.url))
                            ? "border-[var(--accent)] scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            : "border-[var(--border)] opacity-60 hover:opacity-100 hover:border-[var(--accent)]"
                            }`}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {saveMessage.text && (
                <div
                  className={`p-4 rounded-xl text-sm border ${saveMessage.type === "success"
                    ? "bg-green-500/10 border-green-500/50 text-green-500"
                    : "bg-red-500/10 border-red-500/50 text-red-500"
                    }`}
                >
                  {saveMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                    </div>
                    <input
                      type="email"
                      defaultValue={currentUser?.email || ""}
                      disabled
                      className="w-full rounded-xl pl-10 pr-4 py-2.5 outline-none cursor-not-allowed"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 outline-none transition-all resize-none"
                    style={inputStyle}
                    placeholder="Tell us a little bit about yourself"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors text-black disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                App Preferences
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Default Currency</h3>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Select the currency for your expenses
                    </p>
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className="rounded-xl px-4 py-2 outline-none transition-all appearance-none w-32"
                    style={inputStyle}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="LKR">LKR (Rs.)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Time Zone</h3>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Your local time zone
                    </p>
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="rounded-xl px-4 py-2 outline-none transition-all appearance-none w-64"
                    style={inputStyle}
                  >
                    <option value="UTC">UTC (GMT+0:00)</option>
                    <option value="IST">IST (UTC+5:30) Colombo, Sri Lanka</option>
                    <option value="EST">EST (UTC-5:00)</option>
                    <option value="PST">PST (UTC-8:00)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Theme</h3>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Customize the look of your workspace
                    </p>
                  </div>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as "dark" | "light")}
                    className="rounded-xl px-4 py-2 outline-none transition-all appearance-none w-32"
                    style={inputStyle}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>Date Format</h3>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      How dates should be displayed
                    </p>
                  </div>
                  <select
                    className="rounded-xl px-4 py-2 outline-none transition-all appearance-none w-40"
                    style={inputStyle}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-8 animate-in fade-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  Expense Categories
                </h2>
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Add new category (e.g. Travel, Software)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 rounded-xl px-4 py-2.5 outline-none transition-all"
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={categoryLoading}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors text-black flex items-center space-x-2 disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  <Plus size={18} />
                  <span>Add</span>
                </button>
              </form>

              {categoryError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
                  {categoryError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {categories.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="italic text-sm" style={{ color: "var(--text-muted)" }}>
                      No categories found. If you just signed up, they will appear in a moment.
                    </p>
                    <button
                      onClick={() => addCategory("Marketing")}
                      className="px-4 py-2 rounded-xl text-xs font-medium transition-colors border"
                      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                    >
                      Manually initialize (click if they don't appear)
                    </button>
                  </div>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-4 rounded-xl border transition-all hover:border-[var(--accent)] group"
                      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <Tag size={18} style={{ color: "var(--accent)" }} />
                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {cat.name}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
