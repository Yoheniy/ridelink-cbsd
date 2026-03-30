import { appConfig } from "@/lib/config";

/**
 * Returns the commuting window config variable
 */
export function getCommutingWindows() {
	return appConfig.get().commutingWindows;
}

/**
 * Returns the max price cap config variable
 */
export function getMaxPricePerKm() {
	return appConfig.get().maxPricePerKm;
}
