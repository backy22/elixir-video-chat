import Config

config :elixir_video_chat, ElixirVideoChatWeb.Endpoint,
  cache_static_manifest: "priv/static/cache_manifest.json"

config :logger, level: :info
