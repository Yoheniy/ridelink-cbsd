/**
 * In-memory application configuration singleton.
 * Holds configurable values that admins can update at runtime
 * without restarting the server.
 */

export interface CommutingWindow {
	start: number; // hour (0-23)
	end: number; // hour (0-23)
}

export interface AppConfigData {
	maxPricePerKm: number;
	commutingWindows: CommutingWindow[];
}

const DEFAULT_CONFIG: AppConfigData = {
	maxPricePerKm: 4,
	commutingWindows: [
		{ start: 6, end: 10 },
		{ start: 17, end: 20 },
	],
};

class AppConfig {
	private config: AppConfigData;

	constructor() {
		this.config = { ...DEFAULT_CONFIG };
	}

	get(): AppConfigData {
		return { ...this.config };
	}

	update(partial: Partial<AppConfigData>): AppConfigData {
		if (partial.maxPricePerKm !== undefined) {
			this.config.maxPricePerKm = partial.maxPricePerKm;
		}
		if (partial.commutingWindows !== undefined) {
			this.config.commutingWindows = [...partial.commutingWindows];
		}
		return this.get();
	}

	reset(): AppConfigData {
		this.config = { ...DEFAULT_CONFIG };
		return this.get();
	}
}

export const appConfig = new AppConfig();
