import { DateTime } from "luxon";
import {
	createContext,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

export type Theme = "dark" | "light" | "system" | "scheduled";

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	effectiveTheme: "light" | "dark";
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
	effectiveTheme: "light",
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
		const handler = (e?: MediaQueryListEvent) =>
			setIsSystemDark(e?.matches ?? mediaQuery.matches);
		mediaQuery.addEventListener("change", handler);

		return () => {
			clearInterval(timer);
			mediaQuery.removeEventListener("change", handler);
		};
	}, []);

	const effectiveTheme: "light" | "dark" = useMemo(() => {
		if (theme === "system") {
			return isSystemDark ? "dark" : "light";
		}
		if (theme === "scheduled") {
			const isNight = hour >= 18 || hour < 6;
			return isNight ? "dark" : "light";
		}
		return theme;
	}, [theme, isSystemDark, hour]);

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
		applyTheme(effectiveTheme);

		const timeoutId = window.setTimeout(() => {
			root.classList.remove("disable-transitions");
		}, 0);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [effectiveTheme]);

	const handleSetTheme = useCallback(
		(nextTheme: Theme) => {
			localStorage.setItem(storageKey, nextTheme);
			setTheme(nextTheme);
		},
		[storageKey],
	);

	const value = useMemo(
		() => ({
			theme,
			setTheme: handleSetTheme,
			effectiveTheme,
		}),
		[theme, handleSetTheme, effectiveTheme],
	);

	return (
		<ThemeProviderContext.Provider value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export { ThemeProviderContext };
