import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /bethak?mood=baarish — the shareable address of a sitting. There is only one
 * room, so this simply walks the visitor to it with the mood intact.
 */
export const Route = createFileRoute("/bethak")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/", search: search as Record<string, unknown>, replace: true });
  },
});
