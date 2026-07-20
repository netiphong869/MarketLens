export type CacheStrategy = "network-only" | "network-first" | "cache-first";
export function cacheStrategyFor(url: URL): CacheStrategy {
  if (url.pathname.startsWith("/api/")) return "network-only";
  if (url.pathname.startsWith("/_next/static/") || /\.(?:png|svg|ico|woff2)$/.test(url.pathname)) return "cache-first";
  return "network-first";
}
