import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import {
  Compass,
  Camera,
  ClipboardList,
  BarChart3,
  Sun,
  Search,
  X,
} from "./Icons";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Wards" | "Theme" | "Language";
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
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
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // 4 Primary Navigation Links
    {
      id: "nav-overview",
      title: "Overview",
      category: "Navigation",
      icon: <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      action: () => { navigate("/"); setIsOpen(false); },
    },
    {
      id: "nav-scanner",
      title: "Scanner",
      category: "Navigation",
      icon: <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      action: () => { navigate("/scanner"); setIsOpen(false); },
    },
    {
      id: "nav-maintenance",
      title: "Maintenance",
      category: "Navigation",
      icon: <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      action: () => { navigate("/maintenance"); setIsOpen(false); },
    },
    {
      id: "nav-benchmarks",
      title: "Model Benchmarks",
      category: "Navigation",
      icon: <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      action: () => { navigate("/benchmarks"); setIsOpen(false); },
    },

    // Quick Actions
    {
      id: "act-create-order",
      title: "Dispatch Maintenance Work Order",
      category: "Actions",
      icon: <ClipboardList className="w-4 h-4 text-emerald-500" />,
      action: () => { navigate("/maintenance?tab=work-orders"); setIsOpen(false); },
    },
    {
      id: "act-report-hazard",
      title: "Report Public Road Hazard (Citizen Grievance)",
      category: "Actions",
      icon: <Camera className="w-4 h-4 text-amber-500" />,
      action: () => { navigate("/maintenance?tab=reports"); setIsOpen(false); },
    },
    {
      id: "act-scan-image",
      title: "Run Neural Edge Scanner (YOLO11n)",
      category: "Actions",
      icon: <Camera className="w-4 h-4 text-blue-500" />,
      action: () => { navigate("/scanner"); setIsOpen(false); },
    },

    // Municipal Wards
    {
      id: "ward-1",
      title: "Ward 1 — Clock Tower Central (13 defects)",
      category: "Wards",
      icon: <Compass className="w-4 h-4 text-slate-500" />,
      action: () => { navigate("/maintenance?tab=defects&ward=W-01"); setIsOpen(false); },
    },
    {
      id: "ward-2",
      title: "Ward 2 — Focal Point Industrial (13 defects)",
      category: "Wards",
      icon: <Compass className="w-4 h-4 text-slate-500" />,
      action: () => { navigate("/maintenance?tab=defects&ward=W-02"); setIsOpen(false); },
    },
    {
      id: "ward-3",
      title: "Ward 3 — Civil Lines & Mall Road (17 defects)",
      category: "Wards",
      icon: <Compass className="w-4 h-4 text-rose-500" />,
      action: () => { navigate("/maintenance?tab=defects&ward=W-03"); setIsOpen(false); },
    },
    {
      id: "ward-4",
      title: "Ward 4 — Model Town Residential (15 defects)",
      category: "Wards",
      icon: <Compass className="w-4 h-4 text-amber-500" />,
      action: () => { navigate("/maintenance?tab=defects&ward=W-04"); setIsOpen(false); },
    },
    {
      id: "ward-10",
      title: "Central GT Ward (15 defects)",
      category: "Wards",
      icon: <Compass className="w-4 h-4 text-slate-500" />,
      action: () => { navigate("/maintenance?tab=defects&ward=W-10"); setIsOpen(false); },
    },

    // Theme Toggle
    {
      id: "toggle-dark-mode",
      title: "Toggle Light / Dark Mode",
      category: "Theme",
      icon: <Sun className="w-4 h-4 text-slate-500" />,
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
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-lg card p-0 border overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-normal focus:outline-hidden"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-72 overflow-y-auto p-1.5 divide-y divide-transparent">
          {filtered.length > 0 ? (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0">{item.icon}</div>
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.category}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>ScamRoad</span>
        </div>
      </div>
    </div>
  );
};
