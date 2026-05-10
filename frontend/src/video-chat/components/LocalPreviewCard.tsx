import * as React from "react"
import { Card, Text, XStack, YStack } from "tamagui"
import { shortPeerId } from "../utils"

export function LocalPreviewCard(props: {
  joined: boolean
  selfId: string | null
  localVideoRef: React.MutableRefObject<HTMLVideoElement | null>
}): React.ReactElement {
  return (
    <Card bordered elevate flexBasis={300} flexGrow={1} maxWidth="100%" overflow="hidden" borderColor="$teal7">
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
          {props.joined && props.selfId ? shortPeerId(props.selfId) : "Not connected"}
        </Text>
      </XStack>
      <YStack aspectRatio={16 / 10} backgroundColor="black" alignItems="center" justifyContent="center">
        {props.joined ? (
          <video
            ref={props.localVideoRef}
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
  )
}
