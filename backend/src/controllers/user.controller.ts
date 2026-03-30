import * as userService from "@/services/user.service";
import { success } from "@/lib/response";
import type { Request, Response } from "express";

export async function completeProfile(req: Request, res: Response) {
	const user = await userService.completeUserProfile(
		req.user.id,
		req.body as { phone: string; nationalId: string },
	);

	return success(res, { user });
}

export async function becomeDriver(req: Request, res: Response) {
	const driver = await userService.becomeDriver(
		req.user.id,
		req.body as {
			licenseNumber: string;
			vehicleModel: string;
			vehiclePlate: string;
			vehicleSeats: number;
		},
	);

	return success(res, { driver });
}
