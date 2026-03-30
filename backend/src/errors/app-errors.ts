export class AppError extends Error {
	constructor(message: string, public code: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, "NOT_FOUND");
	}
}

export class ConflictError extends AppError {
	constructor(message = "Resource already exists") {
		super(message, "CONFLICT");
	}
}

export class ValidationError extends AppError {
	constructor(message = "Validation failed") {
		super(message, "VALIDATION_ERROR");
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, "UNAUTHORIZED");
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, "FORBIDDEN");
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request") {
		super(message, "BAD_REQUEST");
	}
}
