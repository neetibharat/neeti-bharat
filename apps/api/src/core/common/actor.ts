import type { ActivityActor } from '../../activity/services/activity.service';

/** The signed-in person doing something, as the activity log names them. */
export type Actor = ActivityActor & { id: string };

/** How the activity log names someone: by name, or by email when they have no name yet. */
export function actorOf(user: { id: string; name: string; email: string }): Actor {
  return { id: user.id, label: user.name || user.email };
}
