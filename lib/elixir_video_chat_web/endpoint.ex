defmodule ElixirVideoChatWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :elixir_video_chat

  @session_options [
    store: :cookie,
    key: "_elixir_video_chat_key",
    signing_salt: "video_chat_signing_salt",
    same_site: "Lax"
  ]

  socket "/socket", ElixirVideoChatWeb.UserSocket,
    websocket: true,
    longpoll: false

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: [connect_info: [session: @session_options]]

  plug Plug.Static,
    at: "/",
    from: :elixir_video_chat,
    gzip: false,
    only: ElixirVideoChatWeb.static_paths()

  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
  end

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug ElixirVideoChatWeb.Router
end
