export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

// Calculates the distance in kilometres between two latitude/longitude coordinates using the Haversine formula.
export function distanceKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371; // Earth's mean radius in kilometres
	const toRad = (deg: number) => (deg * Math.PI) / 180; // Convert degrees to radians

	const dLat = toRad(lat2 - lat1); // Difference in latitude
	const dLon = toRad(lon2 - lon1); // Difference in longitude

	// Apply the Haversine formula
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

	// Convert the result into distance in kilometres
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates the GPS coordinates reached after moving a given distance in a specified direction from a starting point
 * using flat-earth approximation for small distances.
 */
export function movePoint(
	lat: number,
	lon: number,
	headingDeg: number,
	distanceKm: number,
): { lat: number; lon: number } {
	const headingRad = (headingDeg * Math.PI) / 180; // Convert heading from degrees to radians

	const latDelta = (Math.cos(headingRad) * distanceKm) / 111; // Calculate the change in latitude

	// Calculate the change in longitude
	const lonDelta =
		(Math.sin(headingRad) * distanceKm) /
		(111 * Math.cos((lat * Math.PI) / 180));

	// Return the new GPS coordinates
	return { lat: lat + latDelta, lon: lon + lonDelta };
}
