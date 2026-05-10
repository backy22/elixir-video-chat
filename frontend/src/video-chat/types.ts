export type SignalPayload = {
  type: "offer" | "answer" | "ice"
  from: string
  to?: string
  sdp?: string
  candidate?: RTCIceCandidateInit | null
}
