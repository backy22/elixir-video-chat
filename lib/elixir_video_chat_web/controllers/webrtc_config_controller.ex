defmodule ElixirVideoChatWeb.WebrtcConfigController do
  @moduledoc false
  use ElixirVideoChatWeb, :controller

  def show(conn, _params) do
    servers = Application.fetch_env!(:elixir_video_chat, :webrtc_ice_servers)
    json(conn, %{iceServers: servers})
  end
end
