import { useQuery } from "@tanstack/react-query";
import type React from "react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { DashCommand } from "./components/DashCommand";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Header, { RefreshToast } from "./components/Header";
import { useBackground } from "./hooks/use-background";
import { useTheme } from "./hooks/use-theme";
import { InjectContext } from "./lib/inject";
import { fetchSetting } from "./lib/nezha-api";
import { cn } from "./lib/utils";
import ErrorPage from "./pages/ErrorPage";
import Server from "./pages/Server";

const NotFound = lazy(() => import("./pages/NotFound"));
const loadServerDetail = () => import("./pages/ServerDetail");
const ServerDetail = lazy(loadServerDetail);

// Route checker component
const RouteChecker: React.FC = () => {
	return <MainApp />;
};

const toError = (error: unknown) => {
	if (!error) return null;
	return error instanceof Error ? error : new Error(String(error));
};

const MainApp: React.FC = () => {
	const { data: settingData, error } = useQuery({
		queryKey: ["setting"],
		queryFn: () => fetchSetting(),
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		retry: false,
	});
	const { i18n } = useTranslation();
	const { setTheme, effectiveTheme } = useTheme();
	const [isCustomCodeInjected, setIsCustomCodeInjected] = useState(false);
	const { backgroundImage: customBackgroundImage, updateBackground } =
		useBackground();

	useEffect(() => {
		loadServerDetail();
	}, []);

	useEffect(() => {
		const config = settingData?.data?.config;
		if (config) {
			if (config.custom_code) {
				InjectContext(config.custom_code);
				setIsCustomCodeInjected(true);
			}

			// 同步自定义配置到全局变量
			if (config.custom_logo) window.CustomLogo = config.custom_logo;
			if (config.custom_description)
				window.CustomDesc = config.custom_description;
			if (config.custom_links) window.CustomLinks = config.custom_links;

			if (config.background_image_day) {
				window.CustomBackgroundImageDay = config.background_image_day;
			}
			if (config.background_image_night) {
				window.CustomBackgroundImageNight = config.background_image_night;
			}
		}
	}, [settingData]);

	// 监听有效主题以及配置变化，动态切换日夜背景
	useEffect(() => {
		const config = settingData?.data?.config;
		const bgDay =
			config?.background_image_day || window.CustomBackgroundImageDay;
		const bgNight =
			config?.background_image_night || window.CustomBackgroundImageNight;

		const targetBg =
			effectiveTheme === "dark"
				? bgNight || window.CustomBackgroundImage
				: bgDay || window.CustomBackgroundImage;

		if (targetBg) {
			updateBackground?.(targetBg);
			window.CustomMobileBackgroundImage = targetBg;
		}
	}, [effectiveTheme, settingData, updateBackground]);

	// 检测是否强制指定了主题颜色
	const forceTheme =
		(window.ForceTheme as string) !== "" ? window.ForceTheme : undefined;

	useEffect(() => {
		const savedTheme = localStorage.getItem("vite-ui-theme");
		if (
			(!savedTheme || savedTheme === "system") &&
			(forceTheme === "dark" || forceTheme === "light")
		) {
			setTheme(forceTheme);
		}
	}, [forceTheme, setTheme]);

	const initialBackendError = !settingData ? toError(error) : null;

	if (settingData?.data?.config?.custom_code && !isCustomCodeInjected) {
		return null;
	}

	if (
		settingData?.data?.config?.language &&
		!localStorage.getItem("language")
	) {
		i18n.changeLanguage(settingData?.data?.config?.language);
	}

	const customMobileBackgroundImage =
		window.CustomMobileBackgroundImage !== ""
			? window.CustomMobileBackgroundImage
			: undefined;

	return (
		<ErrorBoundary>
			{/* 固定定位的背景层 */}
			{customBackgroundImage && (
				<div
					className={cn(
						"fixed inset-0 z-0 bg-cover w-screen h-screen bg-no-repeat bg-center transition-none dark:brightness-75",
						{
							"hidden sm:block": customMobileBackgroundImage,
						},
					)}
					style={{
						backgroundImage: `url(${customBackgroundImage})`,
						backfaceVisibility: "hidden",
						perspective: "1000px",
					}}
				/>
			)}
			{customMobileBackgroundImage && (
				<div
					className={cn(
						"fixed inset-0 z-0 bg-cover w-screen h-screen bg-no-repeat bg-center transition-none sm:hidden dark:brightness-75",
					)}
					style={{
						backgroundImage: `url(${customMobileBackgroundImage})`,
						backfaceVisibility: "hidden",
						perspective: "1000px",
					}}
				/>
			)}
			<div
				className={cn("flex min-h-screen w-full flex-col", {
					"bg-background": !customBackgroundImage,
				})}
			>
				<main className="flex z-20 min-h-[calc(100vh-calc(var(--spacing)*16))] flex-1 flex-col gap-4 p-4 md:p-10 md:pt-8">
					<RefreshToast />
					<Header />
					<DashCommand />
					<Routes>
						<Route
							path="/"
							element={<Server backendError={initialBackendError} />}
						/>
						<Route
							path="/server/:id"
							element={
								<Suspense fallback={null}>
									<ServerDetail />
								</Suspense>
							}
						/>
						<Route path="/error" element={<ErrorPage />} />
						<Route
							path="*"
							element={
								<Suspense fallback={null}>
									<NotFound />
								</Suspense>
							}
						/>
					</Routes>
					<Footer />
				</main>
			</div>
		</ErrorBoundary>
	);
};

// Main App wrapper with router
const App: React.FC = () => {
	return (
		<Router basename={import.meta.env.BASE_URL}>
			<RouteChecker />
		</Router>
	);
};

export default App;
