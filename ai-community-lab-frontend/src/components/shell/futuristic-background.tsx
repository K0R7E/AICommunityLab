export function FuturisticBackground() {
  return (
    <div
      aria-hidden="true"
      className="futuristic-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] overflow-hidden"
    >
      <div className="futuristic-bg__glow futuristic-bg__glow--left" />
      <div className="futuristic-bg__glow futuristic-bg__glow--right" />
      <div className="futuristic-bg__grid" />
      <div className="futuristic-bg__scanline" />
    </div>
  );
}
