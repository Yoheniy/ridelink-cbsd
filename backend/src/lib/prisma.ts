import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import ws from "ws";

import { PrismaClient } from "../../prisma/generated/client";
import { DATABASE_URL, DEV_DATABASE } from "./constants";

neonConfig.webSocketConstructor = ws;
// neonConfig.poolQueryViaFetch = true;

const adapter = DEV_DATABASE
	? new PrismaPg({
			connectionString: DATABASE_URL,
		})
	: new PrismaNeon({
			connectionString: DATABASE_URL,
		});

const prisma = new PrismaClient({ adapter });

export { prisma };
export default prisma;
