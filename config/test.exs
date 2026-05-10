import Config

config :elixir_video_chat, ElixirVideoChatWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test_secret_key_base_minimum_64_chars________________________________",
  server: false

config :logger, level: :warning
