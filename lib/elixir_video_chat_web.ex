defmodule ElixirVideoChatWeb do
  @moduledoc false

  def static_paths, do: ~w(assets fonts images favicon.ico robots.txt)

  def router do
    quote do
      use Phoenix.Router, helpers: false

      import Plug.Conn
      import Phoenix.Controller
    end
  end

  def channel do
    quote do
      use Phoenix.Channel
    end
  end

  def controller do
    quote do
      use Phoenix.Controller,
        formats: [:html, :json],
        layouts: [html: ElixirVideoChatWeb.Layouts]

      import Plug.Conn
    end
  end

  def html do
    quote do
      use Phoenix.Component

      import Phoenix.Controller,
        only: [get_csrf_token: 0, view_module: 1, view_template: 1]

      unquote(html_helpers())
    end
  end

  defp html_helpers do
    quote do
      use Phoenix.VerifiedRoutes,
        endpoint: ElixirVideoChatWeb.Endpoint,
        router: ElixirVideoChatWeb.Router,
        statics: ElixirVideoChatWeb.static_paths()

      import Phoenix.Controller,
        only: [view_module: 1, view_template: 1]
    end
  end

  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end
end
