import * as React from "react"
import { Button, Input, Paragraph, Text, XStack, YStack } from "tamagui"
import { ButtonGlyph } from "./ButtonGlyph"
import { IconJoin } from "./RoomIcons"

export function JoinPanel(props: {
  roomId: string
  setRoomId: (v: string) => void
  displayName: string
  setDisplayName: (v: string) => void
  iceReady: boolean
  joining: boolean
  joinBlocked: boolean
  onJoin: () => void
}): React.ReactElement {
  return (
    <YStack width="100%" maxWidth={400} alignSelf="center" gap="$2">
      <Paragraph color="$color11" margin={0} size="$3">
        Pick a room name and join from this browser. Open the same room in another window or device to start a call.
      </Paragraph>
      {!props.iceReady ? (
        <Text fontSize="$3" color="$color10">
          Loading connection settings…
        </Text>
      ) : null}
      <Text fontSize="$2" fontWeight="700" color="$color9" textTransform="uppercase" letterSpacing={1}>
        Your name
      </Text>
      <Input
        id="display-name"
        value={props.displayName}
        disabled={props.joining}
        onChangeText={props.setDisplayName}
        autoComplete="name"
        placeholder="e.g. Alex"
        maxLength={40}
        size="$3"
        width="100%"
      />
      <Text fontSize="$2" color="$color9">
        Shown in chat (1–40 characters, trimmed).
      </Text>
      <Text fontSize="$2" fontWeight="700" color="$color9" textTransform="uppercase" letterSpacing={1}>
        Room name
      </Text>
      <YStack gap="$2" width="100%">
        <Input
          width="100%"
          id="room"
          value={props.roomId}
          disabled={props.joining}
          onChangeText={props.setRoomId}
          autoComplete="off"
          placeholder="e.g. standup"
          size="$3"
        />
        <XStack justifyContent="flex-end">
          <Button
            size="$3"
            theme="active"
            icon={
              <ButtonGlyph>
                <IconJoin />
              </ButtonGlyph>
            }
            disabled={props.joinBlocked}
            onPress={() => void props.onJoin()}
          >
            {props.joining ? "Joining…" : "Join room"}
          </Button>
        </XStack>
      </YStack>
      <Text fontSize="$2" color="$color9">
        Use letters, numbers, underscores, or hyphens (1–64 characters).
      </Text>
    </YStack>
  )
}
