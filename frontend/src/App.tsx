import * as React from "react"
import { Channel, Socket } from "phoenix"
import { Button, Card, H4, Input, Paragraph, Separator, Text, XStack, YStack } from "tamagui"

type SignalPayload = {
  type: "offer" | "answer" | "ice"
  from: string
  to?: string
  sdp?: string
  candidate?: RTCIceCandidateInit | null
}

const fallbackIceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
]

function newPeerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `p_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function shouldInitiateOffer(selfId: string, remoteId: string): boolean {
  return selfId < remoteId
}

function socketUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${window.location.host}/socket`
}

function shortPeerId(id: string): string {
  if (id.length <= 14) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function badgeColors(status: string): { bg: string; color: string; borderColor: string } {
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

function IconJoin(): React.ReactElement {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMic(): React.ReactElement {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm7-3a7 7 0 01-14 0M12 19v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMicMuted(): React.ReactElement {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 14a3 3 0 003-3V5M16 9v1a7 7 0 01-12 4M19 10v2a9 9 0 01-14.54 7M12 19v3M1 1l22 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconVideo(): React.ReactElement {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.5 4h-9A2.5 2.5 0 003 6.5v9A2.5 2.5 0 005.5 18h9a2.5 2.5 0 002.5-2.5v-9A2.5 2.5 0 0014.5 4zM21 9l-4 2.5v3L21 17V9z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconVideoOff(): React.ReactElement {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10.5 7h-5A1.5 1.5 0 004 8.5v6A1.5 1.5 0 005.5 16h7a1.5 1.5 0 001.5-1.5v-2M17 9l3.45 2.3A1 1 0 0122 12.2v3.1M2 2l20 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconLeave(): React.ReactElement {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 17l5-5-5-5M15 12H3M21 3v18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RemoteVideo(props: { stream: MediaStream }): React.ReactElement {
  const ref = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    el.srcObject = props.stream
    return () => {
      el.srcObject = null
    }
  }, [props.stream])

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  )
}

export default function App(): React.ReactElement {
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
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

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

  const remoteEntries = Object.entries(remoteStreams) as [string, MediaStream][]
  const joinBlocked = joining || (!joined && !iceReady)

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderBottomWidth={1}
        borderColor="$borderColor"
        alignItems="center"
        justifyContent="space-between"
        gap="$3"
        flexWrap="wrap"
        backgroundColor="$backgroundHover"
      >
        <XStack alignItems="center" gap="$3">
          <YStack width={40} height={40} borderRadius="$3" backgroundColor="$teal9" />
          <YStack>
            <H4 margin={0}>Video Chat</H4>
            <Paragraph size="$2" color="$color10" margin={0}>
              Elixir · Phoenix Channels · WebRTC mesh
            </Paragraph>
          </YStack>
        </XStack>
        {joined ? (
          <Text
            fontFamily="$mono"
            fontSize="$3"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius={999}
            backgroundColor="$teal3"
            color="$teal11"
            borderWidth={1}
            borderColor="$teal7"
            maxWidth={320}
            numberOfLines={1}
          >
            {`Room · ${roomId}`}
          </Text>
        ) : null}
      </XStack>

      <YStack flex={1} maxWidth={1280} width="100%" alignSelf="center" padding="$4" gap="$4">
        {error ? (
          <Card bordered elevate padding="$3" backgroundColor="$red3" borderColor="$red8">
            <Text color="$red11">{error}</Text>
          </Card>
        ) : null}

        <Card bordered elevate padding="$4" gap="$3">
          {!joined ? (
            <>
              <Paragraph color="$color11" margin={0}>
                Pick a room name and join from this browser. Open the same room in another window or device to start a
                call.
              </Paragraph>
              {!iceReady ? (
                <Text fontSize="$3" color="$color10">
                  Loading connection settings…
                </Text>
              ) : null}
              <Text fontSize="$2" fontWeight="700" color="$color9" textTransform="uppercase" letterSpacing={1}>
                Room name
              </Text>
              <XStack gap="$3" flexWrap="wrap" alignItems="stretch">
                <Input
                  flex={1}
                  minWidth={200}
                  id="room"
                  value={roomId}
                  disabled={joining}
                  onChangeText={setRoomId}
                  autoComplete="off"
                  placeholder="e.g. standup"
                  size="$4"
                />
                <Button
                  size="$4"
                  theme="active"
                  icon={<IconJoin />}
                  disabled={joinBlocked}
                  onPress={() => void join()}
                >
                  {joining ? "Joining…" : "Join room"}
                </Button>
              </XStack>
              <Text fontSize="$2" color="$color9">
                Use letters, numbers, underscores, or hyphens (1–64 characters).
              </Text>
            </>
          ) : (
            <XStack gap="$3" flexWrap="wrap" alignItems="center">
              <XStack gap="$2" flexWrap="wrap">
                <Button
                  size="$3"
                  variant="outlined"
                  theme={mutedAudio ? "red" : undefined}
                  icon={mutedAudio ? <IconMicMuted /> : <IconMic />}
                  onPress={() => setMutedAudio((m) => !m)}
                >
                  {mutedAudio ? "Mic off" : "Mic on"}
                </Button>
                <Button
                  size="$3"
                  variant="outlined"
                  theme={mutedVideo ? "red" : undefined}
                  icon={mutedVideo ? <IconVideoOff /> : <IconVideo />}
                  onPress={() => setMutedVideo((m) => !m)}
                >
                  {mutedVideo ? "Camera off" : "Camera on"}
                </Button>
              </XStack>
              <YStack flex={1} minWidth={8} />
              <Button size="$3" theme="red" variant="outlined" icon={<IconLeave />} onPress={() => leave()}>
                Leave room
              </Button>
            </XStack>
          )}
        </Card>

        <YStack gap="$2">
          <Text fontSize="$2" fontWeight="700" color="$color9" textTransform="uppercase" letterSpacing={1}>
            Video
          </Text>
          <XStack flexWrap="wrap" gap="$3">
            <Card
              bordered
              elevate
              flexBasis={300}
              flexGrow={1}
              maxWidth="100%"
              overflow="hidden"
              borderColor="$teal7"
            >
              <XStack
                paddingHorizontal="$3"
                paddingVertical="$2"
                backgroundColor="$backgroundHover"
                borderBottomWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                gap="$2"
                flexWrap="wrap"
              >
                <Text fontWeight="700" fontSize="$3">
                  You
                </Text>
                <Text fontFamily="$mono" fontSize="$2" color="$color10" flexShrink={1}>
                  {joined && selfId ? shortPeerId(selfId) : "Not connected"}
                </Text>
              </XStack>
              <YStack aspectRatio={16 / 10} backgroundColor="black" alignItems="center" justifyContent="center">
                {joined ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transform: "scaleX(-1)",
                    }}
                  />
                ) : (
                  <Text color="$color9" padding="$3" textAlign="center">
                    Preview appears after you join
                  </Text>
                )}
              </YStack>
            </Card>

            {remoteEntries.map(([peerId, stream]) => {
              const status = peerStatuses[peerId] ?? ""
              const bc = badgeColors(status || "connecting")
              return (
                <Card key={peerId} bordered elevate flexBasis={300} flexGrow={1} maxWidth="100%" overflow="hidden">
                  <XStack
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    backgroundColor="$backgroundHover"
                    borderBottomWidth={1}
                    borderColor="$borderColor"
                    alignItems="center"
                    gap="$2"
                    flexWrap="wrap"
                  >
                    <Text fontWeight="700" fontSize="$3">
                      Guest
                    </Text>
                    <Text fontFamily="$mono" fontSize="$2" color="$color10" flexShrink={1}>
                      {shortPeerId(peerId)}
                    </Text>
                    <Separator vertical marginHorizontal="$1" />
                    <Text
                      fontFamily="$mono"
                      fontSize="$2"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      borderWidth={1}
                      {...bc}
                      flexShrink={1}
                      numberOfLines={1}
                    >
                      {peerStatuses[peerId] ?? "Connecting…"}
                    </Text>
                  </XStack>
                  <YStack aspectRatio={16 / 10} backgroundColor="black" overflow="hidden">
                    <RemoteVideo stream={stream} />
                  </YStack>
                </Card>
              )
            })}
          </XStack>
        </YStack>

        {joined && remoteEntries.length === 0 ? (
          <Card
            bordered
            elevate
            padding="$5"
            alignItems="center"
            borderStyle="dashed"
          >
            <Paragraph color="$color11" textAlign="center" margin={0}>
              Waiting for others in <Text color="$teal10">{roomId}</Text>. Share the URL or room name so someone can
              join.
            </Paragraph>
          </Card>
        ) : null}
      </YStack>
    </YStack>
  )
}
