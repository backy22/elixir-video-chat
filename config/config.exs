import Config

config :elixir_video_chat,
  generators: [timestamp_type: :utc_datetime]

config :elixir_video_chat, ElixirVideoChatWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  live_view: [signing_salt: "lv_signing_salt_change_in_prod_use_mix_phx_gen_secret"],
  render_errors: [
    formats: [html: ElixirVideoChatWeb.ErrorHTML, json: ElixirVideoChatWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: ElixirVideoChat.PubSub

config :phoenix, :json_library, Jason

config :elixir_video_chat, :webrtc_ice_servers, [
  %{"urls" => "stun:stun.l.google.com:19302"},
  %{"urls" => "stun:stun1.l.google.com:19302"}
]

import_config "#{config_env()}.exs"
import_config "runtime.exs"
