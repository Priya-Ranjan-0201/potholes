import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { ThemePreset } from "../ui/tokens";
import {
  Compass,
  Camera,
  Layers,
  ClipboardList,
  MessageSquareWarning,
  Sparkles,
  BarChart3,
  Sun,
  Search,
  X,
} from "./Icons";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Theme" | "Language" | "Actions";
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [easterEggChai, setEasterEggChai] = useState(false);

  const navigate = useNavigate();
  const { setThemePreset, toggleTheme } = useTheme();
  const { setLanguage } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
      setEasterEggChai(false);
    }
  }, [isOpen]);

  // Check easter egg
  useEffect(() => {
    if (query.trim().toLowerCase() === "chai") {
      setEasterEggChai(true);
    } else {
      setEasterEggChai(false);
    }
  }, [query]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dash",
      title: "Dashboard Overview",
      category: "Navigation",
      icon: <Compass className="w-4 h-4 text-amber-500" />,
      action: () => { navigate("/"); setIsOpen(false); },
    },
    {
      id: "nav-scan",
      title: "AI Pothole Scanner",
      category: "Navigation",
      icon: <Camera className="w-4 h-4 text-amber-500" />,
      action: () => { navigate("/scanner"); setIsOpen(false); },
    },
    {
      id: "nav-def",
      title: "Defect Registry",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-amber-500" />,
      action: () => { navigate("/defects"); setIsOpen(false); },
    },
    {
      id: "nav-wo",
      title: "Work Orders & Maintenance",
      category: "Navigation",
      icon: <ClipboardList className="w-4 h-4 text-emerald-500" />,
      action: () => { navigate("/maintenance"); setIsOpen(false); },
    },
    {
      id: "nav-comp",
      title: "Citizen Grievances",
      category: "Navigation",
      icon: <MessageSquareWarning className="w-4 h-4 text-blue-500" />,
      action: () => { navigate("/complaints"); setIsOpen(false); },
    },
    {
      id: "nav-eval",
      title: "Model Proofs & Evaluation",
      category: "Navigation",
      icon: <BarChart3 className="w-4 h-4 text-cyan-400" />,
      action: () => { navigate("/evaluation"); setIsOpen(false); },
    },
    {
      id: "nav-lab",
      title: "Design Lab (Theme Matrix)",
      category: "Navigation",
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      action: () => { navigate("/design-lab"); setIsOpen(false); },
    },

    // Themes
    {
      id: "theme-holi",
      title: "Theme: Holi Highway (Vibrant Festive)",
      category: "Theme",
      icon: <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 inline-block" />,
      action: () => { setThemePreset("holi-highway" as ThemePreset); setIsOpen(false); },
    },
    {
      id: "theme-neon",
      title: "Theme: Truck Art Neon (Bold High-Contrast)",
      category: "Theme",
      icon: <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-600 to-amber-400 inline-block" />,
      action: () => { setThemePreset("truck-art-neon" as ThemePreset); setIsOpen(false); },
    },
    {
      id: "theme-monsoon",
      title: "Theme: Monsoon Dusk (Cinematic Teal-Indigo)",
      category: "Theme",
      icon: <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-teal-400 to-indigo-600 inline-block" />,
      action: () => { setThemePreset("monsoon-dusk" as ThemePreset); setIsOpen(false); },
    },
    {
      id: "theme-punjab",
      title: "Theme: Punjab Fields (Mustard & Wheat)",
      category: "Theme",
      icon: <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 inline-block" />,
      action: () => { setThemePreset("punjab-fields" as ThemePreset); setIsOpen(false); },
    },
    {
      id: "toggle-dark-mode",
      title: "Toggle Light / Dark Mode",
      category: "Theme",
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      action: () => { toggleTheme(); setIsOpen(false); },
    },

    // Languages
    ...LANGUAGES.map((lang) => ({
      id: `lang-${lang.code}`,
      title: `Language: ${lang.nativeName} (${lang.label})`,
      category: "Language" as const,
      icon: <span className="text-xs">{lang.flag}</span>,
      action: () => { setLanguage(lang.code); setIsOpen(false); },
    })),
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-start justify-center pt-20 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl dhaba-card p-0 border-2 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (try 'scanner', 'theme', or 'chai')..."
            className="w-full bg-transparent text-stone-900 dark:text-stone-100 text-sm font-medium focus:outline-hidden"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Easter Egg: Chai Stall */}
        {easterEggChai && (
          <div className="p-4 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs font-mono">
            <span className="text-2xl animate-bounce">☕</span>
            <div>
              <span className="font-bold block">Masala Chai Break on NH-44!</span>
              <span className="text-[11px] opacity-80">Fresh ginger-cardamom tea brewed at the highway dhaba. Safe travels!</span>
            </div>
          </div>
        )}

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-stone-100 dark:divide-stone-800/60">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition ${
                    isSelected
                      ? "bg-amber-500 text-stone-950 font-bold shadow-xs"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">{item.icon}</div>
                    <span>{item.title}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                      isSelected
                        ? "bg-stone-950/20 text-stone-950"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-400"
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-stone-400 font-mono">
              No matching highway commands found.
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-amber-500 font-bold">ScamRoad v9 Palette Hub</span>
        </div>
      </div>
    </div>
  );
};
