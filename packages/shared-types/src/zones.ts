export interface RestrictedZone {
	id: string;
	organizationId: string;
	name: string;
	latitude: number;
	longitude: number;
	radiusKm: number;
	createdAt: string;
}
