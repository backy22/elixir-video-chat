import * as React from "react"
import { Card, Separator, Text, XStack, YStack } from "tamagui"
import { badgeColors, shortPeerId } from "../utils"
import { RemoteVideo } from "./RemoteVideo"

export function RemoteParticipantCard(props: {
  peerId: string
  stream: MediaStream
  statusLabel: string
}): React.ReactElement {
  const bc = badgeColors(props.statusLabel || "connecting")
  return (
    <Card bordered elevate flexBasis={300} flexGrow={1} maxWidth="100%" overflow="hidden">
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
          {shortPeerId(props.peerId)}
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
          {props.statusLabel}
        </Text>
      </XStack>
      <YStack aspectRatio={16 / 10} backgroundColor="black" overflow="hidden">
        <RemoteVideo stream={props.stream} />
      </YStack>
    </Card>
  )
}
