import type { Role } from "@ironveil/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	createInvitation,
	createOrganization,
	deleteInvitation,
	deleteOrganization,
	getInvitations,
	getMyOrganizations,
	getOrganizationMembers,
	removeOrganizationMember,
	updateOrganizationMemberRole,
} from "../api/organizations";

const ROLES: Role[] = ["ADMIN", "COMMANDER", "ANALYST"];

export function OrganizationsPage() {
	const queryClient = useQueryClient();
	const { setCurrentOrganization } = useAuth();
	const navigate = useNavigate();

	const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");

	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<Role>("ANALYST");

	const organizations = useQuery({
		queryKey: ["organizations"],
		queryFn: getMyOrganizations,
	});

	const currentOrg = useMemo(
		() =>
			organizations.data?.find((o) => o.organizationId === selectedOrg) ?? null,
		[selectedOrg, organizations.data],
	);

	const members = useQuery({
		queryKey: ["organization-members", selectedOrg],
		queryFn: () => {
			if (!selectedOrg) {
				throw new Error("No organization selected");
			}

			return getOrganizationMembers(selectedOrg);
		},
		enabled: !!selectedOrg,
	});

	const invitations = useQuery({
		queryKey: ["organization-invitations", selectedOrg],
		queryFn: () => {
			if (!selectedOrg) {
				throw new Error("No organization selected");
			}

			return getInvitations(selectedOrg);
		},
		enabled: !!selectedOrg && currentOrg?.role === "ADMIN",
	});

	const createOrgMutation = useMutation({
		mutationFn: () => createOrganization(name, slug),
		onSuccess: () => {
			toast.success("Organization created.");
			setName("");
			setSlug("");
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
		},
		onError: () => toast.error("Failed to create organization."),
	});

	const deleteOrgMutation = useMutation({
		mutationFn: (id: string) => deleteOrganization(id),
		onSuccess: () => {
			toast.success("Organization deleted.");
			setSelectedOrg(null);
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
		},
		onError: () => toast.error("Failed to delete organization."),
	});

	const inviteMutation = useMutation({
		mutationFn: () => {
			if (!selectedOrg) {
				throw new Error("No organization selected");
			}

			return createInvitation(selectedOrg, inviteEmail, inviteRole);
		},
		onSuccess: () => {
			toast.success("Invitation sent.");
			setInviteEmail("");
			queryClient.invalidateQueries({
				queryKey: ["organization-invitations", selectedOrg],
			});
		},
		onError: () => toast.error("Failed to create invitation."),
	});

	const deleteInvitationMutation = useMutation({
		mutationFn: (id: string) => {
			if (!selectedOrg) {
				throw new Error("No organization selected");
			}
			return deleteInvitation(selectedOrg, id);
		},
		onSuccess: () => {
			toast.success("Invitation deleted.");
			queryClient.invalidateQueries({
				queryKey: ["organization-invitations", selectedOrg],
			});
		},
	});

	const removeMemberMutation = useMutation({
		mutationFn: (userId: string) => {
			if (!selectedOrg) {
				throw new Error("No organization selected");
			}

			return removeOrganizationMember(selectedOrg, userId);
		},
		onSuccess: () => {
			toast.success("Member removed.");
			queryClient.invalidateQueries({
				queryKey: ["organization-members", selectedOrg],
			});
		},
	});

	const updateRoleMutation = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: Role }) => {
			if (!selectedOrg) {
				throw new Error("No organization selected");
			}
			return updateOrganizationMemberRole(selectedOrg, userId, role);
		},
		onSuccess: () => {
			toast.success("Role updated.");
			queryClient.invalidateQueries({
				queryKey: ["organization-members", selectedOrg],
			});
		},
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Organizations</h1>
					<p className="text-muted-foreground">
						Manage organizations, members and invitations.
					</p>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Create Organization</CardTitle>
						<CardDescription>Create a new organization.</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Name</Label>

							<Input value={name} onChange={(e) => setName(e.target.value)} />
						</div>

						<div className="space-y-2">
							<Label>Slug</Label>

							<Input value={slug} onChange={(e) => setSlug(e.target.value)} />
						</div>

						<Button
							className="w-full"
							onClick={() => createOrgMutation.mutate()}
							disabled={!name || !slug}
						>
							Create Organization
						</Button>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Your Organizations</CardTitle>
					</CardHeader>

					<CardContent className="space-y-3">
						{organizations.data?.map((org) => (
							<div
								key={org.organizationId}
								className={`rounded-lg border p-4 ${
									selectedOrg === org.organizationId ? "border-primary" : ""
								}`}
							>
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">{org.organizationId}</p>

										<div className="mt-2 flex gap-2">
											<Badge>{org.role}</Badge>

											<Badge variant="secondary">
												{new Date(org.joinedAt).toLocaleDateString()}
											</Badge>
										</div>
									</div>

									<div className="flex gap-2">
										<Button
											variant="outline"
											onClick={() => setSelectedOrg(org.organizationId)}
										>
											Manage
										</Button>
										<Button
											onClick={() => {
												setCurrentOrganization(org.organizationId);
												navigate("/");
											}}
										>
											Open
										</Button>

										{org.role === "ADMIN" && (
											<Button
												variant="destructive"
												onClick={() =>
													deleteOrgMutation.mutate(org.organizationId)
												}
											>
												Delete
											</Button>
										)}
									</div>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{selectedOrg && (
				<>
					<Separator />

					<div className="grid gap-6 lg:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Members</CardTitle>
							</CardHeader>

							<CardContent className="space-y-4">
								{members.data?.map((member) => (
									<div
										key={member.userId}
										className="flex items-center justify-between rounded border p-3"
									>
										<div>
											<p className="font-medium">{member.userId}</p>

											<p className="text-sm text-muted-foreground">
												Joined {new Date(member.joinedAt).toLocaleDateString()}
											</p>
										</div>

										<div className="flex gap-2">
											<Select
												value={member.role}
												onValueChange={(role) =>
													updateRoleMutation.mutate({
														userId: member.userId,
														role: role as Role,
													})
												}
											>
												<SelectTrigger className="w-40">
													<SelectValue />
												</SelectTrigger>

												<SelectContent>
													{ROLES.map((role) => (
														<SelectItem key={role} value={role}>
															{role}
														</SelectItem>
													))}
												</SelectContent>
											</Select>

											<Button
												variant="destructive"
												onClick={() =>
													removeMemberMutation.mutate(member.userId)
												}
											>
												Remove
											</Button>
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Invitations</CardTitle>
							</CardHeader>

							<CardContent className="space-y-4">
								{currentOrg?.role === "ADMIN" && (
									<>
										<div className="space-y-2">
											<Label>Email</Label>

											<Input
												value={inviteEmail}
												onChange={(e) => setInviteEmail(e.target.value)}
											/>
										</div>

										<div className="space-y-2">
											<Label>Role</Label>

											<Select
												value={inviteRole}
												onValueChange={(v) => setInviteRole(v as Role)}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>

												<SelectContent>
													{ROLES.map((role) => (
														<SelectItem key={role} value={role}>
															{role}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>

										<Button
											className="w-full"
											onClick={() => inviteMutation.mutate()}
										>
											Send Invitation
										</Button>

										<Separator />
									</>
								)}

								{invitations.data?.map((invite) => (
									<div
										key={invite.id}
										className="flex items-center justify-between rounded border p-3"
									>
										<div>
											<p>{invite.email}</p>

											<p className="text-sm text-muted-foreground">
												{invite.role}
											</p>
										</div>

										<Button
											variant="destructive"
											onClick={() => deleteInvitationMutation.mutate(invite.id)}
										>
											Delete
										</Button>
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</>
			)}
		</div>
	);
}
