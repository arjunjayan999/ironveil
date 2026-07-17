import type { Role } from "@ironveil/shared-types";
import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../auth/context.js";

interface ProtectedRouteProps {
	children: ReactNode;
	allowedRoles?: Role[];
}

export function ProtectedRoute({
	children,
	allowedRoles,
}: ProtectedRouteProps) {
	const { isAuthenticated, currentOrganization } = useAuth();

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
