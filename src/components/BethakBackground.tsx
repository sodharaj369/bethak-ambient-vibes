import roomAsset from "@/assets/bethak-room.png.asset.json";

export function BethakBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <img
        src={roomUrl}
        alt="A quiet Indian sitting room at night: a wooden diwan with cushions, chai on a low table, a harmonium, a warm lamp and a moonlit window"
        className="room-image h-full w-full object-cover object-[42%_center] md:object-center"
      />
      <div className="absolute inset-0 bg-[oklch(0.15_0.03_60_/_0.08)]" />
      <div className="lamp-glow" aria-hidden="true" />
    </div>
  );
}
