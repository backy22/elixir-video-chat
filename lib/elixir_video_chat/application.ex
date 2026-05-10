defmodule ElixirVideoChat.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    :ok = apply_webrtc_ice_servers_from_env()

    children = [
      ElixirVideoChatWeb.Telemetry,
      {Phoenix.PubSub, name: ElixirVideoChat.PubSub},
      ElixirVideoChatWeb.Presence,
      ElixirVideoChatWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: ElixirVideoChat.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    ElixirVideoChatWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp apply_webrtc_ice_servers_from_env do
    case System.get_env("WEBRTC_ICE_SERVERS") do
      nil ->
        :ok

      json when is_binary(json) ->
        case String.trim(json) do
          "" ->
            :ok

          trimmed ->
            case Jason.decode(trimmed) do
              {:ok, list} when is_list(list) ->
                Application.put_env(:elixir_video_chat, :webrtc_ice_servers, list)
                :ok

              _ ->
                raise ArgumentError,
                      ~s(WEBRTC_ICE_SERVERS must be a JSON array of ICE server objects, e.g. [{"urls":"turn:turn.example.com:3478","username":"u","credential":"p"}])
            end
        end
    end
  end
end
