"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 text-black hover:text-amber-600 dark:text-white dark:hover:text-amber-400 transition-all flex items-center justify-center rounded-full bg-secondary/30 hover:bg-secondary/50"
            aria-label="Toggle theme"
        >
            <span className="material-symbols-outlined !text-[22px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
        </button>
    );
}
