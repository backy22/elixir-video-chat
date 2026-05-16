defmodule ElixirVideoChatWeb.RoomChannel do
  @moduledoc false
  use ElixirVideoChatWeb, :channel

  alias ElixirVideoChatWeb.Presence

  @impl true
  def join("room:" <> room_id, %{"peer_id" => peer_id, "display_name" => raw_name}, socket) do
    cond do
      not valid_room_id?(room_id) ->
        {:error, %{reason: "invalid room id"}}

      not valid_peer_id?(peer_id) ->
        {:error, %{reason: "invalid peer id"}}

      true ->
        case normalize_display_name(raw_name) do
          {:error, reason} ->
            {:error, %{reason: reason}}

          {:ok, display_name} ->
            socket =
              socket
              |> assign(:room_id, room_id)
              |> assign(:peer_id, peer_id)
              |> assign(:display_name, display_name)

            send(self(), :after_join)
            {:ok, socket}
        end
    end
  end

  def join("room:" <> _, _payload, _socket) do
    {:error, %{reason: "invalid join payload"}}
  end

  @impl true
  def handle_info(:after_join, socket) do
    {:ok, _} =
      Presence.track(socket, socket.assigns.peer_id, %{
        joined_at: System.system_time(:second),
        name: socket.assigns.display_name
      })

    peers_payload =
      socket.topic
      |> Presence.list()
      |> Enum.reject(fn {id, _} -> id == socket.assigns.peer_id end)
      |> Enum.map(fn {id, %{metas: metas}} ->
        name =
          case metas do
            [%{} = meta | _] -> presence_display_name(meta)
            _ -> ""
          end

        %{"peer_id" => id, "display_name" => name}
      end)

    push(socket, "peers", %{"peers" => peers_payload})

    broadcast_from!(socket, "peer_joined", %{
      "peer_id" => socket.assigns.peer_id,
      "display_name" => socket.assigns.display_name
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
  def handle_in("chat_msg", payload, socket) do
    case chat_body(payload) do
      {:ok, body} ->
        msg = %{
          "id" => chat_message_id(),
          "peer_id" => socket.assigns.peer_id,
          "display_name" => socket.assigns.display_name,
          "body" => body,
          "sent_at" => System.system_time(:millisecond)
        }

        broadcast!(socket, "chat_msg", msg)
        {:reply, :ok, socket}

      {:error, reason} ->
        {:reply, {:error, %{"reason" => reason}}, socket}
    end
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

  defp normalize_display_name(raw) when is_binary(raw) do
    name = String.trim(raw)

    cond do
      not String.valid?(name) ->
        {:error, "invalid_display_name"}

      name == "" ->
        {:error, "empty_display_name"}

      String.length(name) > 40 ->
        {:error, "display_name_too_long"}

      true ->
        {:ok, name}
    end
  end

  defp normalize_display_name(_), do: {:error, "invalid_display_name"}

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  defp chat_body(payload) when is_map(payload) do
    body =
      case Map.get(payload, "body") do
        b when is_binary(b) -> b
        _ -> Map.get(payload, :body)
      end

    cond do
      not is_binary(body) ->
        {:error, "bad_request"}

      true ->
        body = String.trim(body)

        cond do
          body == "" ->
            {:error, "empty"}

          byte_size(body) > 2_000 ->
            {:error, "too_long"}

          true ->
            {:ok, body}
        end
    end
  end

  defp chat_body(_), do: {:error, "bad_request"}

  defp chat_message_id do
    :crypto.strong_rand_bytes(12) |> Base.url_encode64(padding: false)
  end

  defp presence_display_name(meta) when is_map(meta) do
    case Map.get(meta, "name") || Map.get(meta, :name) do
      n when is_binary(n) -> String.trim(n)
      _ -> ""
    end
  end
end
