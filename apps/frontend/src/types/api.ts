export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}

export interface SingleResponse<T> {
	data: T;
}

export interface ApiError {
	error: string;
	message: string;
}
