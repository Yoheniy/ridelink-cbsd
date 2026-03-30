import { ConflictError } from "@/errors";
import prisma from "@/lib/prisma";

export async function completeUserProfile(
	userId: string,
	data: {
		phone: string;
		nationalId: string;
	},
) {
	const user = await prisma.user.update({
		where: { id: userId },
		data: {
			phone: data.phone,
			nationalId: data.nationalId,
			status: "active",
		},
	});

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		phone: user.phone,
		nationalId: user.nationalId,
		role: user.role,
		status: user.status,
	};
}

export async function becomeDriver(
	userId: string,
	data: {
		licenseNumber: string;
		vehicleModel: string;
		vehiclePlate: string;
		vehicleSeats: number;
	},
) {
	const result = await prisma.$transaction(async (tx) => {
		const existingDriver = await tx.driver.findUnique({
			where: { userId },
		});

		if (existingDriver) {
			throw new ConflictError("You are already a driver");
		}

		const driver = await tx.driver.create({
			data: {
				userId,
				licenseNumber: data.licenseNumber,
				vehicleModel: data.vehicleModel,
				vehiclePlate: data.vehiclePlate,
				vehicleSeats: data.vehicleSeats,
			},
		});

		await tx.passenger.delete({
			where: {
				userId,
			},
		});

		await tx.user.update({
			where: { id: userId },
			data: { role: "driver", status: "active" },
		});

		return driver;
	});

	return {
		id: result.id,
		licenseNumber: result.licenseNumber,
		vehicleModel: result.vehicleModel,
		vehiclePlate: result.vehiclePlate,
		vehicleSeats: result.vehicleSeats,
	};
}
