import React, { useState } from "react";
import * as Icons from "lucide-react";

interface IconSelectorProps {
  selectedIcon?: string;
  onIconSelect: (icon: string) => void;
  category?: string;
}

const iconCategories = {
  Transport: ["Car", "Bus", "Train", "Plane", "Bike", "Fuel", "Truck", "Ship"],
  Marketing: ["TrendingUp", "Megaphone", "Target", "BarChart", "Users", "Globe"],
  Stationery: ["PenTool", "FileText", "ClipboardList", "Book", "Notebook", "Printer"],
  Office: ["Briefcase", "Monitor", "Keyboard", "Mouse", "Coffee", "Calendar"],
  Utilities: ["Zap", "Droplets", "Wifi", "Phone", "Home", "Receipt"],
  Food: ["Utensils", "Coffee", "Pizza", "Apple", "ShoppingBag"],
  Shopping: ["ShoppingBag", "ShoppingCart", "Package", "Gift", "Shirt"],
  Entertainment: ["Film", "Music", "Gamepad2", "Camera", "Headphones"],
  Health: ["Heart", "Stethoscope", "Pill", "Thermometer", "Activity"],
  Travel: ["MapPin", "Compass", "Camera", "Suitcase", "Mountain"],
  Education: ["Book", "GraduationCap", "PenTool", "School", "Calculator"],
  Other: ["Tag", "Star", "Circle", "Square", "Triangle", "Diamond"],
};

const allLucideIcons = new Set(Object.keys(Icons));

const normalizeIconList = (list: string[]) =>
  Array.from(new Set(list)).filter((iconName) => allLucideIcons.has(iconName));

const validIconCategories: Record<string, string[]> = Object.fromEntries(
  Object.entries(iconCategories).map(([categoryName, iconList]) => [
    categoryName,
    normalizeIconList(iconList),
  ]),
);

const IconSelector: React.FC<IconSelectorProps> = ({ selectedIcon, onIconSelect, category }) => {
  const [isOpen, setIsOpen] = useState(false);

  const relevantIcons = category && validIconCategories[category]
    ? validIconCategories[category]
    : Array.from(new Set(Object.values(validIconCategories).flat()));

  const handleIconClick = (icon: string) => {
    onIconSelect(icon);
    setIsOpen(false);
  };

  const SelectedIconComponent = selectedIcon ? Icons[selectedIcon as keyof typeof Icons] as React.ComponentType<any> : null;

  return (
    <div className="relative">
      <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        Icon (Optional)
      </label>
      <div
        className="w-full rounded-xl px-4 py-3 outline-none border transition-all focus:ring-2 focus:ring-blue-500/20 cursor-pointer flex items-center gap-3"
        style={{ background: "var(--bg-base)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {SelectedIconComponent ? (
          <SelectedIconComponent size={20} />
        ) : (
          <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-500">?</span>
          </div>
        )}
        <span className="flex-1">{selectedIcon || "Select an icon"}</span>
        <Icons.ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div
          className="absolute top-full mt-2 w-full max-h-64 overflow-y-auto rounded-xl border shadow-lg z-10 p-4"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="grid grid-cols-6 gap-3">
            {relevantIcons.map((iconName) => {
              const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any> | undefined;
              const ResolvedIcon = IconComponent ?? Icons.Tag;

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleIconClick(iconName)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                    selectedIcon === iconName ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  style={{
                    background: selectedIcon === iconName ? 'var(--bg-muted)' : 'var(--bg-base)',
                    color: selectedIcon === iconName ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                >
                  <ResolvedIcon size={18} />
                </button>
              );
            })}
          </div>
          {category && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Showing icons for {category} category. Select any icon from the full library.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IconSelector;