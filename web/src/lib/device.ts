export type DeviceType = "desktop" | "ios" | "android";

export function getDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}
