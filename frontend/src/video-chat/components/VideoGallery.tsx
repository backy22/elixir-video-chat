import * as React from "react"
import { Text, XStack, YStack } from "tamagui"
import { LocalPreviewCard } from "./LocalPreviewCard"
import { RemoteParticipantCard } from "./RemoteParticipantCard"
import { WaitingForPeers } from "./WaitingForPeers"

export function VideoGallery(props: {
  joined: boolean
  selfId: string | null
  localVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  remoteEntries: [string, MediaStream][]
  peerStatuses: Record<string, string>
  roomId: string
}): React.ReactElement {
  return (
    <>
      <YStack gap="$2">
        <Text fontSize="$2" fontWeight="700" color="$color9" textTransform="uppercase" letterSpacing={1}>
          Video
        </Text>
        <XStack flexWrap="wrap" gap="$3">
          <LocalPreviewCard joined={props.joined} selfId={props.selfId} localVideoRef={props.localVideoRef} />
          {props.remoteEntries.map(([peerId, stream]) => (
            <RemoteParticipantCard
              key={peerId}
              peerId={peerId}
              stream={stream}
              statusLabel={props.peerStatuses[peerId] ?? "Connecting…"}
            />
          ))}
        </XStack>
      </YStack>

      {props.joined && props.remoteEntries.length === 0 ? <WaitingForPeers roomId={props.roomId} /> : null}
    </>
  )
}
