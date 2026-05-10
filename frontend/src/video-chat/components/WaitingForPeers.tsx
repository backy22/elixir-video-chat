import * as React from "react"
import { Card, Paragraph, Text } from "tamagui"

export function WaitingForPeers(props: { roomId: string }): React.ReactElement {
  return (
    <Card bordered elevate padding="$5" alignItems="center" borderStyle="dashed">
      <Paragraph color="$color11" textAlign="center" margin={0}>
        Waiting for others in <Text color="$teal10">{props.roomId}</Text>. Share the URL or room name so someone can join.
      </Paragraph>
    </Card>
  )
}
