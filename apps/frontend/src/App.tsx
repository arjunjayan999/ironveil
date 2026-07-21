import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar.js";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./auth/context.js";
import { AppSidebar } from "./components/AppSidebar.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { TooltipProvider } from "./components/ui/tooltip.js";
import { AuditCenterPage } from "./pages/AuditCenterPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { LiveMapPage } from "./pages/LiveMapPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { RegisterPage } from "./pages/RegisterPage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { ThreatCenterPage } from "./pages/ThreatCenterPage.js";
import { ThreatDetailPage } from "./pages/ThreatDetailPage.js";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function AppShell() {
	const { isAuthenticated } = useAuth();
	if (!isAuthenticated) return <Navigate to="/login" replace />;

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="overflow-hidden">
				<header className="flex h-14 shrink-0 items-center border-b px-4">
					<SidebarTrigger />
				</header>
				<main className="min-h-0 flex-1 overflow-y-auto">
					<Routes>
						<Route
							path="/"
							element={
								<ProtectedRoute>
									<DashboardPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/threats"
							element={
								<ProtectedRoute>
									<ThreatCenterPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/organizations"
							element={
								isAuthenticated ? (
									<OrganizationsPage />
								) : (
									<Navigate to="/login" replace />
								)
							}
						/>
						<Route
							path="/threats/:id"
							element={
								<ProtectedRoute>
									<ThreatDetailPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/map"
							element={
								<ProtectedRoute>
									<LiveMapPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/audit"
							element={
								<ProtectedRoute>
									<AuditCenterPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/settings"
							element={
								<ProtectedRoute allowedRoles={["ADMIN"]}>
									<SettingsPage />
								</ProtectedRoute>
							}
						/>
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<TooltipProvider>
					<BrowserRouter>
						<Routes>
							<Route path="/login" element={<LoginPage />} />
							<Route path="/register" element={<RegisterPage />} />
							<Route path="/*" element={<AppShell />} />
						</Routes>
						<Toaster />
					</BrowserRouter>
				</TooltipProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}
