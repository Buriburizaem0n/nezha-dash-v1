import { createContext, type ReactNode, useEffect, useState } from "react";
import { DateTime } from "luxon";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(
		() => (localStorage.getItem(storageKey) as Theme) || "system",
	);

	const [hour, setHour] = useState(() => DateTime.now().hour);

	useEffect(() => {
		const timer = setInterval(() => {
			setHour(DateTime.now().hour);
		}, 60000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.add("disable-transitions");
		root.classList.remove("light", "dark");

		let effectiveTheme = theme;
		if (theme === "system") {
			// Time-based theme: 18:00 - 06:00 is dark
			const isNight = hour >= 18 || hour < 6;
			effectiveTheme = isNight ? "dark" : "light";
		}

		root.classList.add(effectiveTheme);
		const themeColor =
			effectiveTheme === "dark" ? "hsl(30 15% 8%)" : "hsl(0 0% 98%)";
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute("content", themeColor);
		
		const timeoutId = window.setTimeout(() => {
			root.classList.remove("disable-transitions");
		}, 0);
		return () => window.clearTimeout(timeoutId);
	}, [theme, hour]);

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export { ThemeProviderContext };
