import * as React from "react"
import { H4, Paragraph, Text, XStack, YStack } from "tamagui"

export function VideoChatHeader(props: { joined: boolean; roomId: string }): React.ReactElement {
  return (
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
      {props.joined ? (
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
          {`Room · ${props.roomId}`}
        </Text>
      ) : null}
    </XStack>
  )
}
