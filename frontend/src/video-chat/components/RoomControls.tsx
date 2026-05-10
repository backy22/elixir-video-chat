import * as React from "react"
import { Button, XStack, YStack } from "tamagui"
import { ButtonGlyph } from "./ButtonGlyph"
import { IconLeave, IconMic, IconMicMuted, IconVideo, IconVideoOff } from "./RoomIcons"

export function RoomControls(props: {
  mutedAudio: boolean
  setMutedAudio: React.Dispatch<React.SetStateAction<boolean>>
  mutedVideo: boolean
  setMutedVideo: React.Dispatch<React.SetStateAction<boolean>>
  onLeave: () => void
}): React.ReactElement {
  return (
    <XStack gap="$3" flexWrap="wrap" alignItems="center">
      <XStack gap="$2" flexWrap="wrap">
        <Button
          size="$3"
          variant="outlined"
          theme={props.mutedAudio ? "red" : undefined}
          icon={<ButtonGlyph>{props.mutedAudio ? <IconMicMuted /> : <IconMic />}</ButtonGlyph>}
          onPress={() => props.setMutedAudio((m) => !m)}
        >
          {props.mutedAudio ? "Mic off" : "Mic on"}
        </Button>
        <Button
          size="$3"
          variant="outlined"
          theme={props.mutedVideo ? "red" : undefined}
          icon={<ButtonGlyph>{props.mutedVideo ? <IconVideoOff /> : <IconVideo />}</ButtonGlyph>}
          onPress={() => props.setMutedVideo((m) => !m)}
        >
          {props.mutedVideo ? "Camera off" : "Camera on"}
        </Button>
      </XStack>
      <YStack flex={1} minWidth={8} />
      <Button
        size="$3"
        theme="red"
        variant="outlined"
        icon={
          <ButtonGlyph>
            <IconLeave />
          </ButtonGlyph>
        }
        onPress={() => props.onLeave()}
      >
        Leave room
      </Button>
    </XStack>
  )
}
