import { prisma } from '../db/client';

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    // Log but don't throw — activity logging should never break the main flow
    console.error('[activity] Failed to log activity:', err);
  }
}
