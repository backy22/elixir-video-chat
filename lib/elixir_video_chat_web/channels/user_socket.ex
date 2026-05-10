defmodule ElixirVideoChatWeb.UserSocket do
  @moduledoc false
  use Phoenix.Socket

  channel "room:*", ElixirVideoChatWeb.RoomChannel

  @impl true
  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  @impl true
  def id(_socket), do: nil
end
