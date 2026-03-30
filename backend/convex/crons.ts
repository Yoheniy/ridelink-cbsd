import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled cron jobs for cleaning up stale realtime data.
 *
 * Convex stores ephemeral data (locations, presence, old notifications)
 * that should be periodically cleaned up to keep the DB lean.
 */
const crons = cronJobs();

/**
 * Clean up stale presence records.
 *
 * Users who haven't sent a heartbeat in 5+ minutes are marked offline.
 * Runs every 2 minutes.
 */
crons.interval("clean stale presence", { minutes: 2 }, internal.cronCleanup.cleanStalePresence);

/**
 * Clean up old completed location tracking records.
 *
 * Location records with status "completed" older than 24 hours are deleted.
 * Active tracking is preserved.
 * Runs every hour.
 */
crons.interval("clean old location data", { hours: 1 }, internal.cronCleanup.cleanOldLocationData);

/**
 * Clean up old read notifications.
 *
 * Read notifications older than 30 days are deleted.
 * Unread notifications are preserved regardless of age.
 * Runs daily at 3:00 AM UTC.
 */
crons.cron("clean old notifications", "0 3 * * *", internal.cronCleanup.cleanOldNotifications);

export default crons;
