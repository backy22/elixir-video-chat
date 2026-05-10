import * as React from "react"
import { Card, Text, YStack } from "tamagui"
import { JoinPanel } from "./components/JoinPanel"
import { RoomControls } from "./components/RoomControls"
import { VideoChatHeader } from "./components/VideoChatHeader"
import { VideoGallery } from "./components/VideoGallery"
import { useVideoRoom } from "./useVideoRoom"

export function VideoChatApp(): React.ReactElement {
  const room = useVideoRoom()

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$background">
      <VideoChatHeader joined={room.joined} roomId={room.roomId} />

      <YStack flex={1} maxWidth={1280} width="100%" alignSelf="center" padding="$4" gap="$4">
        {room.error ? (
          <Card bordered elevate padding="$3" backgroundColor="$red3" borderColor="$red8">
            <Text color="$red11">{room.error}</Text>
          </Card>
        ) : null}

        <Card bordered elevate padding="$4" gap="$3">
          {!room.joined ? (
            <JoinPanel
              roomId={room.roomId}
              setRoomId={room.setRoomId}
              iceReady={room.iceReady}
              joining={room.joining}
              joinBlocked={room.joinBlocked}
              onJoin={room.join}
            />
          ) : (
            <RoomControls
              mutedAudio={room.mutedAudio}
              setMutedAudio={room.setMutedAudio}
              mutedVideo={room.mutedVideo}
              setMutedVideo={room.setMutedVideo}
              onLeave={room.leave}
            />
          )}
        </Card>

        <VideoGallery
          joined={room.joined}
          selfId={room.selfId}
          localVideoRef={room.localVideoRef}
          remoteEntries={room.remoteEntries}
          peerStatuses={room.peerStatuses}
          roomId={room.roomId}
        />
      </YStack>
    </YStack>
  )
}
