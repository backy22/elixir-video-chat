defmodule ElixirVideoChatWeb.RoomChannel do
  @moduledoc false
  use ElixirVideoChatWeb, :channel

  alias ElixirVideoChatWeb.Presence

  @impl true
  def join("room:" <> room_id, %{"peer_id" => peer_id}, socket) do
    cond do
      not valid_room_id?(room_id) ->
        {:error, %{reason: "invalid room id"}}

      not valid_peer_id?(peer_id) ->
        {:error, %{reason: "invalid peer id"}}

      true ->
        socket =
          socket
          |> assign(:room_id, room_id)
          |> assign(:peer_id, peer_id)

        send(self(), :after_join)
        {:ok, socket}
    end
  end

  def join("room:" <> _, _payload, _socket) do
    {:error, %{reason: "missing peer_id"}}
  end

  @impl true
  def handle_info(:after_join, socket) do
    {:ok, _} =
      Presence.track(socket, socket.assigns.peer_id, %{
        joined_at: System.system_time(:second)
      })

    others =
      Presence.list(socket.topic)
      |> Map.keys()
      |> Enum.reject(&(&1 == socket.assigns.peer_id))

    push(socket, "peers", %{"ids" => others})

    broadcast_from!(socket, "peer_joined", %{
      "peer_id" => socket.assigns.peer_id
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("signal", payload, socket) do
    body =
      payload
      |> Map.put("from", socket.assigns.peer_id)
      |> stringify_keys()

    broadcast_from!(socket, "signal", body)
    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    peer_id = socket.assigns[:peer_id]
    topic = socket.topic

    if is_binary(peer_id) and is_binary(topic) do
      ElixirVideoChatWeb.Endpoint.broadcast!(topic, "peer_left", %{
        "peer_id" => peer_id
      })
    end

    :ok
  end

  defp valid_room_id?(id) do
    byte_size(id) in 1..64 and Regex.match?(~r/^[a-zA-Z0-9_-]+$/, id)
  end

  defp valid_peer_id?(id) do
    byte_size(id) in 8..128 and Regex.match?(~r/^[a-zA-Z0-9_-]+$/, id)
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
