const MOBILE_QUERY = "(max-width: 820px), (pointer: coarse)";

export function detectQuality() {
  const mobileQuery = matchMedia(MOBILE_QUERY);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const memory = Number(navigator.deviceMemory) || 8;
  const cores = Number(navigator.hardwareConcurrency) || 8;
  const mobile = mobileQuery.matches || memory <= 4;
  const constrained = mobile || cores <= 4;

  return {
    tier: mobile ? "mobile" : constrained ? "balanced" : "high",
    mobile,
    reducedMotion,
    antialias: !mobile,
    pixelRatio: Math.min(devicePixelRatio, mobile ? 1.1 : constrained ? 1.35 : 1.75),
    shadows: !mobile,
    shadowMapSize: mobile ? 512 : constrained ? 768 : 1024,
    ssr: !constrained && !reducedMotion && innerWidth >= 1024,
    bloom: !mobile && !reducedMotion,
    postProcessing: !mobile && !reducedMotion,
    pbr: !mobile,
    maxAnisotropy: mobile ? 2 : constrained ? 4 : 8,
    leafCardCount: mobile ? 0 : constrained ? 40 : 68,
    petalCount: mobile ? 92 : constrained ? 180 : 280,
    dustCount: mobile ? 72 : constrained ? 120 : 180,
    smokeCapacity: mobile ? 140 : constrained ? 240 : 350,
    lodBias: mobile ? 1.5 : constrained ? 1.2 : 1,
    devicePixelRatio: devicePixelRatio
  };
}
