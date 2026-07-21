import { useQuery } from "@tanstack/react-query";
import {
	ClipboardList,
	LayoutDashboard,
	LogOut,
	Map as MapIcon,
	Settings,
	Shield,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { getMyOrganizations } from "@/api/organizations";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "../auth/context";

const NAV_ITEMS = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/threats", label: "Threat Center", icon: Shield },
	{ to: "/map", label: "Live Map", icon: MapIcon },
	{ to: "/audit", label: "Audit Center", icon: ClipboardList },
	{ to: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function AppSidebar() {
	const { currentOrganizationId, user, logout } = useAuth();

	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);
	const navigate = useNavigate();
	const handleLogout = () => {
		logout();
		navigate("/login");
	};
	const location = useLocation();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							className="cursor-default hover:bg-transparent"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<Shield className="size-4" />
							</div>

							<div className="grid flex-1 text-left leading-tight">
								<span className="truncate font-bold tracking-widest">
									IRONVEIL
								</span>

								<span className="truncate text-xs text-muted-foreground">
									Defense Intelligence
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Platform</SidebarGroupLabel>

					<SidebarGroupContent>
						<SidebarMenu>
							{NAV_ITEMS.map((item) => {
								if (item.adminOnly && currentOrganization?.role !== "ADMIN") {
									return null;
								}

								const isActive =
									item.to === "/"
										? location.pathname === "/"
										: location.pathname.startsWith(item.to);

								return (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											tooltip={item.label}
										>
											<NavLink to={item.to} end={item.to === "/"}>
												<item.icon />
												<span>{item.label}</span>
											</NavLink>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg">
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								{user?.username?.[0]?.toUpperCase()}
							</div>

							<div className="grid flex-1 text-left leading-tight">
								<span className="truncate text-sm font-medium">
									{user?.username}
								</span>

								<span className="truncate text-xs text-muted-foreground">
									{currentOrganization?.role}
								</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton tooltip="Sign out" onClick={handleLogout}>
							<LogOut />
							<span>Sign out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
