import { createContext, type ReactNode, useEffect, useState } from "react";
import { DateTime } from "luxon";

export type Theme = "dark" | "light" | "system" | "scheduled";

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

	const [isSystemDark, setIsSystemDark] = useState(
		() => window.matchMedia("(prefers-color-scheme: dark)").matches,
	);

	const [hour, setHour] = useState(() => DateTime.now().hour);

	useEffect(() => {
		const timer = setInterval(() => {
			setHour(DateTime.now().hour);
		}, 60000);

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
		mediaQuery.addEventListener("change", handler);

		return () => {
			clearInterval(timer);
			mediaQuery.removeEventListener("change", handler);
		};
	}, []);

	useEffect(() => {
		const root = window.document.documentElement;

		const updateThemeColor = (nextTheme: "light" | "dark") => {

			const themeColor =
				nextTheme === "dark" ? "hsl(30 15% 8%)" : "hsl(0 0% 98%)";
			document
				.querySelector('meta[name="theme-color"]')
				?.setAttribute("content", themeColor);
		};

		const applyTheme = (nextTheme: "light" | "dark") => {
			root.classList.remove("light", "dark");
			root.classList.add(nextTheme);
			root.style.colorScheme = nextTheme;
			root.style.backgroundColor =
				nextTheme === "dark" ? "hsl(30 15% 8%)" : "hsl(0 0% 98%)";
			updateThemeColor(nextTheme);
		};

		root.classList.add("disable-transitions");

		let effectiveTheme: "light" | "dark" = "light";
		if (theme === "system") {
			effectiveTheme = isSystemDark ? "dark" : "light";
		} else if (theme === "scheduled") {
			const isNight = hour >= 18 || hour < 6;
			effectiveTheme = isNight ? "dark" : "light";
		} else {
			effectiveTheme = theme;
		}

		applyTheme(effectiveTheme);

		const timeoutId = window.setTimeout(() => {
			root.classList.remove("disable-transitions");
		}, 0);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [theme, hour, isSystemDark]);


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
