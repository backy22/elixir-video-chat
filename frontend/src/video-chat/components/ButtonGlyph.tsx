import * as React from "react"
import { getVariableValue, useTheme } from "tamagui"

/** Tamagui Button does not always forward label color into the icon slot; SVG `currentColor` needs this. */
export function ButtonGlyph(props: { children: React.ReactNode }): React.ReactElement {
  const theme = useTheme()
  let color = "#f4f4f5"
  const token = theme.color
  if (token != null) {
    const resolved = getVariableValue(token)
    if (typeof resolved === "string" && resolved.length > 0) color = resolved
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color }}>
      {props.children}
    </span>
  )
}
