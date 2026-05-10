import * as React from "react"
import { Button, Input, Paragraph, Text, XStack } from "tamagui"
import { ButtonGlyph } from "./ButtonGlyph"
import { IconJoin } from "./RoomIcons"

export function JoinPanel(props: {
  roomId: string
  setRoomId: (v: string) => void
  iceReady: boolean
  joining: boolean
  joinBlocked: boolean
  onJoin: () => void
}): React.ReactElement {
  return (
    <>
      <Paragraph color="$color11" margin={0}>
        Pick a room name and join from this browser. Open the same room in another window or device to start a call.
      </Paragraph>
      {!props.iceReady ? (
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
          value={props.roomId}
          disabled={props.joining}
          onChangeText={props.setRoomId}
          autoComplete="off"
          placeholder="e.g. standup"
          size="$4"
        />
        <Button
          size="$4"
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
      <Text fontSize="$2" color="$color9">
        Use letters, numbers, underscores, or hyphens (1–64 characters).
      </Text>
    </>
  )
}
