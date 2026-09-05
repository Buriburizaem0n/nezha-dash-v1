import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { createTestQueryClient } from "@/test/utils";

const appMocks = vi.hoisted(() => ({
	backgroundImage: undefined as string | undefined,
	fetchSetting: vi.fn(),
	injectContext: vi.fn(),
	setTheme: vi.fn(),
	updateBackground: vi.fn(),
	effectiveTheme: "light" as "light" | "dark",
}));

vi.mock("../components/DashCommand", () => ({
	DashCommand: () => <div>dash-command</div>,
}));

vi.mock("../components/Footer", () => ({
	default: () => <footer>footer</footer>,
}));

vi.mock("../components/Header", () => ({
	default: () => <header>header</header>,
	RefreshToast: () => <div>refresh-toast</div>,
}));

vi.mock("../pages/Server", () => ({
	default: ({ backendError }: { backendError?: Error | null }) => (
		<div>
			<div>server-page</div>
			{backendError && <p>{backendError.message}</p>}
		</div>
	),
}));

vi.mock("../pages/ServerDetail", () => ({
	default: () => <div>server-detail-page</div>,
}));

vi.mock("../hooks/use-background", () => ({
	useBackground: () => ({
		backgroundImage: appMocks.backgroundImage,
		updateBackground: appMocks.updateBackground,
	}),
}));

vi.mock("../hooks/use-theme", () => ({
	useTheme: () => ({
		setTheme: appMocks.setTheme,
		effectiveTheme: appMocks.effectiveTheme,
	}),
}));

vi.mock("../lib/inject", () => ({
	InjectContext: appMocks.injectContext,
}));

vi.mock("../lib/nezha-api", () => ({
	fetchSetting: appMocks.fetchSetting,
}));

function settingResponse(customCode = "") {
	return {
		success: true,
		data: {
			config: {
				debug: false,
				language: "zh-CN",
				site_name: "Nezha",
				user_template: "",
				admin_template: "",
				custom_code: customCode,
			},
			version: "1.0.0",
		},
	};
}

function renderApp(route = "/") {
	window.history.pushState({}, "", route);
	const queryClient = createTestQueryClient();

	return {
		queryClient,
		...render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		),
	};
}

describe("App", () => {
	beforeEach(() => {
		appMocks.backgroundImage = undefined;
		appMocks.fetchSetting.mockResolvedValue(settingResponse());
		appMocks.injectContext.mockResolvedValue(undefined);
		appMocks.setTheme.mockClear();
		appMocks.updateBackground.mockClear();
		appMocks.effectiveTheme = "light";
		window.ForceTheme = "";
		window.CustomBackgroundImageDay = "/day.png";
		window.CustomBackgroundImageNight = "/night.png";
		localStorage.clear();
	});

	it("renders the main shell after settings load and applies global theme/background settings", async () => {
		Object.assign(window, {
			ForceTheme: "dark",
			CustomMobileBackgroundImage: "/mobile.png",
		});
		appMocks.backgroundImage = "/desktop.png";

		const { container } = renderApp();

		expect(await screen.findByText("server-page")).toBeInTheDocument();
		expect(screen.getByText("refresh-toast")).toBeInTheDocument();
		expect(screen.getByText("header")).toBeInTheDocument();
		expect(screen.getByText("dash-command")).toBeInTheDocument();
		expect(screen.getByText("footer")).toBeInTheDocument();
		expect(appMocks.setTheme).toHaveBeenCalledWith("dark");
		expect(
			Array.from(container.querySelectorAll<HTMLElement>("[style]")).some(
				(element) => element.style.backgroundImage.includes("/desktop.png"),
			),
		).toBe(true);
		expect(
			Array.from(container.querySelectorAll<HTMLElement>("[style]")).some(
				(element) => element.style.backgroundImage.includes("/mobile.png"),
			),
		).toBe(true);
	});

	it("renders the app shell while initial settings are still pending", async () => {
		appMocks.fetchSetting.mockImplementation(
			() => new Promise(() => undefined),
		);

		renderApp();

		expect(await screen.findByText("server-page")).toBeInTheDocument();
		expect(screen.getByText("refresh-toast")).toBeInTheDocument();
		expect(screen.getByText("header")).toBeInTheDocument();
		expect(screen.getByText("dash-command")).toBeInTheDocument();
		expect(screen.getByText("footer")).toBeInTheDocument();
	});

	it("injects custom code before showing the app shell", async () => {
		appMocks.fetchSetting.mockResolvedValue(
			settingResponse("<script>custom</script>"),
		);

		renderApp();

		await waitFor(() => {
			expect(appMocks.injectContext).toHaveBeenCalledWith(
				"<script>custom</script>",
			);
		});
		expect(await screen.findByText("server-page")).toBeInTheDocument();
	});

	it("renders the app shell when initial settings fetch fails", async () => {
		appMocks.fetchSetting.mockRejectedValue(new Error("settings failed"));

		renderApp();

		expect(await screen.findByText("server-page")).toBeInTheDocument();
		expect(screen.getByText("refresh-toast")).toBeInTheDocument();
		expect(screen.getByText("header")).toBeInTheDocument();
		expect(screen.getByText("dash-command")).toBeInTheDocument();
		expect(screen.getByText("footer")).toBeInTheDocument();
		expect(await screen.findByText("settings failed")).toBeInTheDocument();
	});

	it("keeps rendering with stale settings when a later settings refetch fails", async () => {
		let requestCount = 0;
		appMocks.fetchSetting.mockImplementation(() => {
			requestCount += 1;
			return requestCount === 1
				? Promise.resolve(settingResponse())
				: Promise.reject(new Error("settings failed"));
		});

		const { queryClient } = renderApp();

		expect(await screen.findByText("server-page")).toBeInTheDocument();

		await queryClient.refetchQueries({ queryKey: ["setting"] });

		await waitFor(() => {
			expect(appMocks.fetchSetting.mock.calls.length).toBeGreaterThanOrEqual(2);
		});
		expect(screen.getByText("server-page")).toBeInTheDocument();
		expect(screen.queryByText("settings failed")).not.toBeInTheDocument();
	});

	it("routes server detail paths through the app router", async () => {
		renderApp("/server/42");

		expect(await screen.findByText("server-detail-page")).toBeInTheDocument();
	});

	it("does not overwrite user-selected theme with ForceTheme if user previously saved a theme", async () => {
		localStorage.setItem("vite-ui-theme", "light");
		Object.assign(window, {
			ForceTheme: "dark",
		});

		renderApp();

		expect(await screen.findByText("server-page")).toBeInTheDocument();
		expect(appMocks.setTheme).not.toHaveBeenCalledWith("dark");
	});

	it("updates background to day background when effective theme is light", async () => {
		appMocks.effectiveTheme = "light";
		window.CustomBackgroundImageDay = "/day.png";
		window.CustomBackgroundImageNight = "/night.png";

		renderApp();

		await waitFor(() => {
			expect(appMocks.updateBackground).toHaveBeenCalledWith("/day.png");
		});
		expect(window.CustomMobileBackgroundImage).toBe("/day.png");
	});

	it("updates background to night background when effective theme is dark", async () => {
		appMocks.effectiveTheme = "dark";
		window.CustomBackgroundImageDay = "/day.png";
		window.CustomBackgroundImageNight = "/night.png";

		renderApp();

		await waitFor(() => {
			expect(appMocks.updateBackground).toHaveBeenCalledWith("/night.png");
		});
		expect(window.CustomMobileBackgroundImage).toBe("/night.png");
	});

	it("applies day and night background images from backend settings config", async () => {
		appMocks.effectiveTheme = "light";
		appMocks.fetchSetting.mockResolvedValue({
			success: true,
			data: {
				config: {
					...settingResponse().data.config,
					background_image_day: "/backend-day.png",
					background_image_night: "/backend-night.png",
				},
				version: "1.0.0",
			},
		});

		renderApp();

		await waitFor(() => {
			expect(appMocks.updateBackground).toHaveBeenCalledWith(
				"/backend-day.png",
			);
		});
		expect(window.CustomBackgroundImageDay).toBe("/backend-day.png");
		expect(window.CustomBackgroundImageNight).toBe("/backend-night.png");
	});
});
