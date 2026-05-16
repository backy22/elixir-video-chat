export type SignalPayload = {
  type: "offer" | "answer" | "ice"
  from: string
  to?: string
  sdp?: string
  candidate?: RTCIceCandidateInit | null
}

export type ChatMessage = {
  id: string
  peer_id: string
  display_name: string
  body: string
  sent_at: number
}
