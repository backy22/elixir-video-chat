import * as React from "react"
import { Channel, Socket } from "phoenix"
import type { SignalPayload } from "./types"
import {
  fallbackIceServers,
  newPeerId,
  shouldInitiateOffer,
  socketUrl,
} from "./utils"

export function useVideoRoom() {
  const [roomId, setRoomId] = React.useState("demo")
  const [joined, setJoined] = React.useState(false)
  const [joining, setJoining] = React.useState(false)
  const [iceReady, setIceReady] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [mutedAudio, setMutedAudio] = React.useState(false)
  const [mutedVideo, setMutedVideo] = React.useState(false)
  const [selfId, setSelfId] = React.useState<string | null>(null)
  const [remoteStreams, setRemoteStreams] = React.useState<Record<string, MediaStream>>({})
  const [peerStatuses, setPeerStatuses] = React.useState<Record<string, string>>({})
  const selfIdRef = React.useRef<string | null>(null)
  const rtcConfigRef = React.useRef<RTCConfiguration>({ iceServers: fallbackIceServers })
  const localStreamRef = React.useRef<MediaStream | null>(null)
  const socketRef = React.useRef<Socket | null>(null)
  const channelRef = React.useRef<Channel | null>(null)
  const pcsRef = React.useRef<Map<string, RTCPeerConnection>>(new Map())
  const pendingCandidatesRef = React.useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  const offerSentRef = React.useRef<Set<string>>(new Set())

  const localVideoRef = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/webrtc-config")
      .then((r) => r.json())
      .then((data: { iceServers?: RTCIceServer[] }) => {
        if (cancelled) return
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          rtcConfigRef.current = { iceServers: data.iceServers }
        }
        setIceReady(true)
      })
      .catch(() => {
        if (!cancelled) setIceReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const cleanupPeer = React.useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId)
    if (pc) {
      pc.onicecandidate = null
      pc.ontrack = null
      pc.close()
      pcsRef.current.delete(peerId)
    }
    pendingCandidatesRef.current.delete(peerId)
    offerSentRef.current.delete(peerId)
    setRemoteStreams((prev: Record<string, MediaStream>) => {
      if (!(peerId in prev)) return prev
      const next = { ...prev }
      delete next[peerId]
      return next
    })
    setPeerStatuses((prev) => {
      if (!(peerId in prev)) return prev
      const next = { ...prev }
      delete next[peerId]
      return next
    })
  }, [])

  const flushPendingCandidates = React.useCallback(async (remoteId: string, pc: RTCPeerConnection) => {
    const list = pendingCandidatesRef.current.get(remoteId)
    if (!list || list.length === 0) return
    for (const c of list) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c))
      } catch {
        /* ignore */
      }
    }
    pendingCandidatesRef.current.set(remoteId, [])
  }, [])

  const ensurePc = React.useCallback(
    (remoteId: string): RTCPeerConnection => {
      const existing = pcsRef.current.get(remoteId)
      if (existing) return existing

      const pc = new RTCPeerConnection(rtcConfigRef.current)

      const syncStatus = () => {
        setPeerStatuses((prev) => ({
          ...prev,
          [remoteId]: `${pc.iceConnectionState} · ${pc.connectionState}`,
        }))
      }

      pc.onconnectionstatechange = syncStatus
      pc.oniceconnectionstatechange = syncStatus

      pcsRef.current.set(remoteId, pc)

      pc.onicecandidate = (event) => {
        const ch = channelRef.current
        if (!ch || !event.candidate) return
        ch.push("signal", {
          type: "ice",
          to: remoteId,
          candidate: event.candidate.toJSON(),
        })
      }

      pc.ontrack = (event) => {
        const [stream] = event.streams
        if (!stream) return
        setRemoteStreams((prev: Record<string, MediaStream>) => ({ ...prev, [remoteId]: stream }))
      }

      const local = localStreamRef.current
      if (local) {
        for (const track of local.getTracks()) {
          pc.addTrack(track, local)
        }
      }

      syncStatus()

      return pc
    },
    [],
  )

  const sendOffer = React.useCallback(
    async (remoteId: string) => {
      const selfId = selfIdRef.current
      const ch = channelRef.current
      const local = localStreamRef.current
      if (!selfId || !ch || !local) return
      if (!shouldInitiateOffer(selfId, remoteId)) return
      if (offerSentRef.current.has(remoteId)) return

      const pc = ensurePc(remoteId)
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        offerSentRef.current.add(remoteId)
        ch.push("signal", { type: "offer", to: remoteId, sdp: offer.sdp })
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create offer")
      }
    },
    [ensurePc],
  )

  const handleSignal = React.useCallback(
    async (payload: SignalPayload) => {
      const selfId = selfIdRef.current
      if (!selfId) return

      const from = payload.from
      if (from === selfId) return

      const target = payload.to
      if (payload.type !== "offer" && target && target !== selfId) return

      if (payload.type === "ice") {
        const pc = ensurePc(from)
        if (!payload.candidate) return
        if (!pc.remoteDescription) {
          const list = pendingCandidatesRef.current.get(from) ?? []
          list.push(payload.candidate)
          pendingCandidatesRef.current.set(from, list)
          return
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
        } catch {
          /* ignore */
        }
        return
      }

      if (payload.type === "offer" && payload.sdp) {
        const pc = ensurePc(from)
        await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp })
        await flushPendingCandidates(from, pc)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        channelRef.current?.push("signal", { type: "answer", to: from, sdp: answer.sdp })
        return
      }

      if (payload.type === "answer" && payload.sdp) {
        const pc = ensurePc(from)
        await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp })
        await flushPendingCandidates(from, pc)
      }
    },
    [ensurePc, flushPendingCandidates],
  )

  const leave = React.useCallback(() => {
    const ch = channelRef.current
    if (ch) {
      ch.leave()
      channelRef.current = null
    }
    const sock = socketRef.current
    if (sock) {
      sock.disconnect()
      socketRef.current = null
    }

    for (const id of Array.from(pcsRef.current.keys())) {
      cleanupPeer(id)
    }

    const local = localStreamRef.current
    if (local) {
      for (const t of local.getTracks()) t.stop()
      localStreamRef.current = null
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null

    selfIdRef.current = null
    setSelfId(null)
    offerSentRef.current.clear()
    pendingCandidatesRef.current.clear()
    setRemoteStreams({})
    setPeerStatuses({})
    setJoined(false)
    setJoining(false)
  }, [cleanupPeer])

  React.useEffect(() => {
    return () => {
      leave()
    }
  }, [leave])

  const join = React.useCallback(async () => {
    setError(null)
    setJoining(true)

    const trimmed = roomId.trim()
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(trimmed)) {
      setError("Room id must be 1–64 characters: letters, numbers, underscore, hyphen.")
      setJoining(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      localStreamRef.current = stream

      const peerId = newPeerId()
      selfIdRef.current = peerId
      setSelfId(peerId)

      const socket = new Socket(socketUrl(), { params: {} })
      socketRef.current = socket
      socket.connect()

      const topic = `room:${trimmed}`
      const channel = socket.channel(topic, { peer_id: peerId })
      channelRef.current = channel

      channel.on("peers", (payload: unknown) => {
        const msg = payload as { ids?: string[] }
        const ids = msg.ids ?? []
        for (const id of ids) {
          if (id === peerId) continue
          void sendOffer(id)
        }
      })

      channel.on("peer_joined", (payload: unknown) => {
        const msg = payload as { peer_id?: string }
        const id = msg.peer_id
        if (!id || id === peerId) return
        void sendOffer(id)
      })

      channel.on("peer_left", (payload: unknown) => {
        const msg = payload as { peer_id?: string }
        const id = msg.peer_id
        if (!id) return
        cleanupPeer(id)
      })

      channel.on("signal", (msg: unknown) => {
        void handleSignal(msg as SignalPayload)
      })

      await new Promise<void>((resolve, reject) => {
        channel
          .join()
          .receive("ok", () => resolve())
          .receive("error", (resp: unknown) => reject(new Error(JSON.stringify(resp))))
          .receive("timeout", () => reject(new Error("Join timed out")))
      })

      setJoined(true)
    } catch (e) {
      leave()
      setError(e instanceof Error ? e.message : "Could not join room")
    } finally {
      setJoining(false)
    }
  }, [cleanupPeer, handleSignal, leave, roomId, sendOffer])

  React.useEffect(() => {
    const local = localStreamRef.current
    if (!local) return
    for (const t of local.getAudioTracks()) t.enabled = !mutedAudio
  }, [mutedAudio])

  React.useEffect(() => {
    const local = localStreamRef.current
    if (!local) return
    for (const t of local.getVideoTracks()) t.enabled = !mutedVideo
  }, [mutedVideo])

  React.useEffect(() => {
    if (!joined) return
    const el = localVideoRef.current
    const stream = localStreamRef.current
    if (!el || !stream) return
    el.srcObject = stream
    void el.play().catch(() => {
      /* autoplay policies / interrupted — stream still attached */
    })
    return () => {
      el.srcObject = null
    }
  }, [joined])

  const remoteEntries = Object.entries(remoteStreams) as [string, MediaStream][]
  const joinBlocked = joining || (!joined && !iceReady)

  return {
    roomId,
    setRoomId,
    joined,
    joining,
    iceReady,
    error,
    mutedAudio,
    setMutedAudio,
    mutedVideo,
    setMutedVideo,
    selfId,
    remoteEntries,
    peerStatuses,
    joinBlocked,
    join,
    leave,
    localVideoRef,
  }
}
