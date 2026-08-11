/**
 * Ambient life inside the BETHAK room.
 *
 * Purely decorative CSS-driven overlays positioned in percentages of the
 * illustration (they live inside .room-frame, which mirrors object-cover),
 * so nothing here touches the music engine or the UI chrome.
 */
export function RoomAmbience() {
  return (
    <div className="ambience" aria-hidden="true">
      {/* Ceiling fan — a faint rotating sweep over the blades. */}
      <div className="fan-sweep" />

      {/* Night breeze on the curtain by the open window. */}
      <div className="curtain-breeze" />

      {/* Chai steam. */}
      <div className="steam steam-a">
        <span /><span /><span />
      </div>
      <div className="steam steam-b">
        <span /><span /><span />
      </div>

      {/* A single distant window light outside. */}
      <div className="far-light" />
    </div>
  );
}
