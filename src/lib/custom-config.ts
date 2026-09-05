import { DateTime } from "luxon";

export function initCustomConfig() {
	try {
		// Default day / night background images
		window.CustomBackgroundImageDay =
			window.CustomBackgroundImageDay ||
			"https://loohui.com/wp-content/uploads/images/background_day.jpg";
		window.CustomBackgroundImageNight =
			window.CustomBackgroundImageNight ||
			"https://loohui.com/wp-content/uploads/images/background.jpg";

		const savedTheme = localStorage.getItem("vite-ui-theme");
		const systemDark =
			typeof window !== "undefined" && window.matchMedia
				? window.matchMedia("(prefers-color-scheme: dark)").matches
				: false;
		const hour = DateTime.now().hour;
		const isScheduledNight = hour >= 18 || hour < 6;

		let isDark = false;
		if (savedTheme === "dark") {
			isDark = true;
		} else if (savedTheme === "light") {
			isDark = false;
		} else if (savedTheme === "scheduled") {
			isDark = isScheduledNight;
		} else if (savedTheme === "system") {
			isDark = systemDark;
		} else {
			isDark = isScheduledNight;
		}

		window.CustomBackgroundImage = isDark
			? window.CustomBackgroundImageNight
			: window.CustomBackgroundImageDay;

		window.CustomMobileBackgroundImage = window.CustomBackgroundImage;

		/* LOGO / 副标题 / 链接 */
		window.CustomLogo = "https://loohui.com/wp-content/uploads/images/pet.png";
		window.CustomDesc = "树树皆秋色，山山唯落晖";
		window.CustomLinks = JSON.stringify([
			{ link: "https://loohui.com/", name: "返回Blog", blank: false },
		]);

		// Handle internal redirects if needed
		document.addEventListener("click", (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const a = target.closest("a");
			if (a && a.href === "https://loohui.com/") {
				e.preventDefault();
				window.location.href = a.href;
			}
		});
	} catch (e) {
		console.error("[Nezha custom_config] crash:", e);
	}
}
