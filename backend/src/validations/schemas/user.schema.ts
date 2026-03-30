import { z } from "zod";

export const completeProfileSchema = z.object({
	phone: z.string().min(1, "Phone is required"),
	nationalId: z.string().min(1, "National ID is required"),
});

export const becomeDriverSchema = z.object({
	licenseNumber: z.string().min(1, "License number is required"),
	vehicleModel: z.string().min(1, "Vehicle model is required"),
	vehiclePlate: z.string().min(1, "Vehicle plate is required"),
	vehicleSeats: z.number().int().min(1).max(8, "Seats must be between 1 and 8"),
});
