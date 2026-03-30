import { AppError, mapErrorToHttp } from "@/errors";
import { error } from "@/lib/response";
import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "http-errors";
import createHttpError from "http-errors";

export function errorHandler(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
) {
	let httpError: HttpError;

	if (err instanceof AppError) {
		httpError = mapErrorToHttp(err);
	} else if (err instanceof Error) {
		httpError = err as HttpError;
	} else {
		httpError = createHttpError(500, "Internal Server Error");
	}

	const status = httpError.status || 500;
	const message = httpError.message || "Internal Server Error";

	return error(res, message, status);
}
