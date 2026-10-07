import { Notification } from "../models/Notification.js";
import { AuditLog } from "../models/AuditLog.js";

export async function notify(userId: string | undefined, title: string, message: string, type: string) {
  if (!userId) return;
  await Notification.create({ userId, title, message, type });
}

export async function audit(actorId: string | undefined, action: string, entityType: string, entityId: string, metadata?: unknown) {
  await AuditLog.create({ actorId, action, entityType, entityId, metadata });
}
