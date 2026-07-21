import type { Role } from "@ironveil/shared-types";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { getMyOrganizations } from "@/api/organizations.js";
import { useAuth } from "../auth/context.js";

interface ProtectedRouteProps {
	children: ReactNode;
	allowedRoles?: Role[];
}

export function ProtectedRoute({
	children,
	allowedRoles,
}: ProtectedRouteProps) {
	const { isAuthenticated, currentOrganizationId } = useAuth();
	const { data: organizations } = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrganization = organizations?.find(
		(org) => org.organizationId === currentOrganizationId,
	);
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	if (!currentOrganization) {
		return <Navigate to="/organizations" replace />;
	}

	if (allowedRoles && !allowedRoles.includes(currentOrganization.role)) {
		return (
			<div className="flex h-full items-center justify-center text-gray-400">
				403 - You do not have permission to view this page.
			</div>
		);
	}

	return <>{children}</>;
}
