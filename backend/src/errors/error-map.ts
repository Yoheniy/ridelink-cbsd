import type { AppError } from "./app-errors";
import createHttpError from "http-errors";

const errorStatusMap: Record<string, number> = {
	NOT_FOUND: 404,
	CONFLICT: 409,
	VALIDATION_ERROR: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	BAD_REQUEST: 400,
};

export function mapErrorToHttp(error: AppError): createHttpError.HttpError {
	const status = errorStatusMap[error.code] || 500;
	return createHttpError(status, error.message);
}
