defmodule ElixirVideoChatWeb.Router do
  use ElixirVideoChatWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :put_root_layout, html: {ElixirVideoChatWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  scope "/api", ElixirVideoChatWeb do
    pipe_through :api

    get "/webrtc-config", WebrtcConfigController, :show
  end

  scope "/", ElixirVideoChatWeb do
    pipe_through :browser

    get "/", PageController, :spa
    get "/*path", PageController, :spa
  end
end
