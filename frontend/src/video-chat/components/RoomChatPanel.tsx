import * as React from "react"
import { Button, Card, Input, Paragraph, Text, XStack, YStack } from "tamagui"
import type { ChatMessage } from "../types"
import { formatChatTime, shortPeerId } from "../utils"

export function RoomChatPanel(props: {
  selfId: string | null
  messages: ChatMessage[]
  onSend: (body: string) => void
  /** When true, panel grows with parent (sidebar) and message list scrolls inside. */
  fillHeight?: boolean
}): React.ReactElement {
  const [draft, setDraft] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const fill = props.fillHeight === true

  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [props.messages])

  const submit = React.useCallback(() => {
    const t = draft.trim()
    if (!t) return
    props.onSend(t)
    setDraft("")
  }, [draft, props])

  const scrollBoxStyle = React.useMemo(
    () =>
      fill
        ? {
            flex: 1,
            minHeight: 0,
            overflowY: "auto" as const,
            display: "flex" as const,
            flexDirection: "column" as const,
            gap: 10,
            paddingBlock: 4,
          }
        : {
            maxHeight: 320,
            overflowY: "auto" as const,
            display: "flex" as const,
            flexDirection: "column" as const,
            gap: 10,
            paddingBlock: 4,
          },
    [fill],
  )

  return (
    <YStack flex={fill ? 1 : undefined} minHeight={fill ? 0 : undefined} width="100%" height={fill ? "100%" : undefined}>
      <Card bordered elevate padding="$4" gap="$3" flex={fill ? 1 : undefined} minHeight={fill ? 0 : undefined} height={fill ? "100%" : undefined}>
        <YStack flex={fill ? 1 : undefined} minHeight={fill ? 0 : undefined} gap="$3">
          <YStack flexShrink={0} gap="$2">
            <Text fontSize="$2" fontWeight="700" color="$color9" textTransform="uppercase" letterSpacing={1}>
              Room chat
            </Text>
            <Paragraph color="$color10" size="$2" margin={0}>
              Messages are not stored; they disappear when you leave the room.
            </Paragraph>
          </YStack>

          <div ref={scrollRef} style={scrollBoxStyle}>
            {props.messages.length === 0 ? (
              <Text color="$color9" fontSize="$3">
                No messages yet — say hello.
              </Text>
            ) : (
              props.messages.map((m) => {
                const mine = props.selfId != null && m.peer_id === props.selfId
                const author = m.display_name.trim() || shortPeerId(m.peer_id)
                return (
                  <XStack key={m.id} width="100%" justifyContent={mine ? "flex-end" : "flex-start"}>
                    <YStack
                      maxWidth="88%"
                      padding="$3"
                      borderRadius="$5"
                      borderWidth={0}
                      backgroundColor={mine ? "$purple9" : "$color4"}
                      gap="$1"
                    >
                      <XStack justifyContent="space-between" alignItems="center" gap="$2" flexWrap="wrap">
                        <Text fontSize="$2" fontWeight="700" color={mine ? "rgba(255,255,255,0.92)" : "$color11"}>
                          {author}
                          {mine ? " · you" : ""}
                        </Text>
                        <Text fontSize="$2" color={mine ? "rgba(255,255,255,0.65)" : "$color9"}>
                          {formatChatTime(m.sent_at)}
                        </Text>
                      </XStack>
                      <Text fontSize="$3" color={mine ? "rgba(255,255,255,0.98)" : "$color12"} whiteSpace="pre-wrap">
                        {m.body}
                      </Text>
                    </YStack>
                  </XStack>
                )
              })
            )}
          </div>

          <XStack gap="$2" flexWrap="wrap" alignItems="stretch" flexShrink={0}>
            <Input
              flex={1}
              minWidth={200}
              size="$4"
              value={draft}
              placeholder="Message everyone in this room…"
              multiline={false}
              maxLength={2000}
              onChangeText={setDraft}
              onSubmitEditing={() => submit()}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Button size="$4" theme="active" disabled={draft.trim() === ""} onPress={() => submit()}>
              Send
            </Button>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  )
}
