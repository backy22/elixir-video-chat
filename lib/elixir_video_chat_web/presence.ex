defmodule ElixirVideoChatWeb.Presence do
  @moduledoc false
  use Phoenix.Presence,
    otp_app: :elixir_video_chat,
    pubsub_server: ElixirVideoChat.PubSub
end
