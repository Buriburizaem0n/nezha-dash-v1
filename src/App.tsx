import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { DashCommand } from "./components/DashCommand";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Header, { RefreshToast } from "./components/Header";
import { useBackground } from "./hooks/use-background";
import { InjectContext } from "./lib/inject";
import { fetchSetting } from "./lib/nezha-api";
import { cn } from "./lib/utils";
import ErrorPage from "./pages/ErrorPage";
import NotFound from "./pages/NotFound";
import Server from "./pages/Server";
import ServerDetail from "./pages/ServerDetail";

// Route checker component
const RouteChecker: React.FC = () => {
	return <MainApp />;
};

const MainApp: React.FC = () => {
	const { data: settingData, error } = useQuery({
		queryKey: ["setting"],
		queryFn: () => fetchSetting(),
		refetchOnMount: true,
		refetchOnWindowFocus: true,
	});
	const { i18n } = useTranslation();
	const [isCustomCodeInjected, setIsCustomCodeInjected] = useState(false);
	const { backgroundImage: customBackgroundImage } = useBackground();

	useEffect(() => {
		const updateConfig = () => {
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

				const hour = DateTime.now().hour;
				const isNight = hour >= 18 || hour < 6;

				if (isNight && config.background_image_night) {
					window.CustomBackgroundImage = config.background_image_night;
				} else if (!isNight && config.background_image_day) {
					window.CustomBackgroundImage = config.background_image_day;
				}
				window.CustomMobileBackgroundImage = window.CustomBackgroundImage;
			}
		};

		updateConfig();
		const interval = setInterval(updateConfig, 60000); // Check every minute
		return () => clearInterval(interval);
	}, [settingData]);

	if (error) {
		return <ErrorPage code={500} message={error.message} />;
	}

	if (!settingData) {
		return null;
	}

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
						backfaceVisibility: 'hidden',
						perspective: '1000px'
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
						backfaceVisibility: 'hidden',
						perspective: '1000px'
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
						<Route path="/" element={<Server />} />
						<Route path="/server/:id" element={<ServerDetail />} />
						<Route path="/error" element={<ErrorPage />} />
						<Route path="*" element={<NotFound />} />
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
