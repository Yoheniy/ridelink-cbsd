import type { Response } from "express";

type SuccessResponse<T> = {
	success: true;
	data: T;
	message?: string;
};

type ErrorResponse = {
	success: false;
	message: string;
	data?: null;
};

export function success<T>(
	res: Response,
	data: T,
	message?: string,
): Response<SuccessResponse<T>> {
	return res.json({
		success: true,
		data,
		message,
	});
}

export function error(
	res: Response,
	message: string,
	statusCode = 400,
): Response<ErrorResponse> {
	return res.status(statusCode).json({
		success: false,
		message,
		data: null,
	});
}
