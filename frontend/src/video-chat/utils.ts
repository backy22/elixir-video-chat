export const fallbackIceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
]

export function newPeerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `p_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

export function shouldInitiateOffer(selfId: string, remoteId: string): boolean {
  return selfId < remoteId
}

export function socketUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/socket`
}

export function shortPeerId(id: string): string {
  if (id.length <= 14) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

export function formatChatTime(sentAtMs: number): string {
  return new Date(sentAtMs).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export function badgeColors(status: string): { bg: string; color: string; borderColor: string } {
  const s = status.toLowerCase()
  if (s.includes("failed") || (s.includes("disconnected") && !s.includes("connecting"))) {
    return { bg: "$red4", color: "$red11", borderColor: "$red8" }
  }
  const parts = status.split("·").map((p) => p.trim().toLowerCase())
  if (parts.length >= 2 && parts[0] === "connected" && parts[1] === "connected") {
    return { bg: "$green4", color: "$green11", borderColor: "$green8" }
  }
  return { bg: "$yellow4", color: "$yellow11", borderColor: "$yellow8" }
}
