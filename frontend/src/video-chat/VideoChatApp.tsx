import * as React from "react"
import { Card, Text, XStack, YStack, useMedia } from "tamagui"
import { JoinPanel } from "./components/JoinPanel"
import { RoomChatPanel } from "./components/RoomChatPanel"
import { RoomControls } from "./components/RoomControls"
import { VideoChatHeader } from "./components/VideoChatHeader"
import { VideoGallery } from "./components/VideoGallery"
import { useVideoRoom } from "./useVideoRoom"

export function VideoChatApp(): React.ReactElement {
  const room = useVideoRoom()
  const media = useMedia()
  const chatFillHeight = Boolean(media.gtSm)

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$background">
      <VideoChatHeader joined={room.joined} roomId={room.roomId} />

      <YStack flex={1} maxWidth={1440} width="100%" alignSelf="center" padding="$4" gap="$4" minHeight={0}>
        {room.error ? (
          <Card bordered elevate padding="$3" backgroundColor="$red3" borderColor="$red8">
            <Text color="$red11">{room.error}</Text>
          </Card>
        ) : null}

        <Card
          bordered
          elevate
          padding="$4"
          gap="$3"
          flexShrink={0}
          width="100%"
          {...(!room.joined ? { maxWidth: 520, alignSelf: "center" } : { alignSelf: "stretch" })}
        >
          {!room.joined ? (
            <JoinPanel
              roomId={room.roomId}
              setRoomId={room.setRoomId}
              displayName={room.displayName}
              setDisplayName={room.setDisplayName}
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

        {room.joined ? (
          <XStack
            flex={1}
            width="100%"
            minHeight={0}
            gap="$4"
            alignItems="stretch"
            flexWrap="wrap"
            $sm={{ alignItems: "flex-start" }}
          >
            <YStack flex={1} minWidth={280} minHeight={0} gap="$4" flexBasis={420} flexGrow={1}>
              <VideoGallery
                joined={room.joined}
                selfId={room.selfId}
                localDisplayName={room.displayName}
                localVideoRef={room.localVideoRef}
                remoteEntries={room.remoteEntries}
                peerStatuses={room.peerStatuses}
                peerDisplayNames={room.peerDisplayNames}
                roomId={room.roomId}
              />
            </YStack>

            <YStack
              width={380}
              flexShrink={0}
              flexGrow={0}
              minHeight={0}
              alignSelf="stretch"
              $sm={{ width: "100%" }}
            >
              <RoomChatPanel
                selfId={room.selfId}
                messages={room.chatMessages}
                onSend={room.sendChat}
                fillHeight={chatFillHeight}
              />
            </YStack>
          </XStack>
        ) : null}
      </YStack>
    </YStack>
  )
}
