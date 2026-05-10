import * as React from "react"

export function RemoteVideo(props: { stream: MediaStream }): React.ReactElement {
  const ref = React.useRef<HTMLVideoElement | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    el.srcObject = props.stream
    void el.play().catch(() => {})
    return () => {
      el.srcObject = null
    }
  }, [props.stream])

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  )
}
