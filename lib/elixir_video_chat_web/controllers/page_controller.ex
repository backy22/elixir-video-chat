defmodule ElixirVideoChatWeb.PageController do
  @moduledoc false
  use ElixirVideoChatWeb, :controller

  @doc """
  Serves the Vite-built SPA (`priv/static/index.html`) for production and direct hits to Phoenix.
  In development, prefer http://localhost:5173 with `npm run dev` in `frontend/`.
  """
  def spa(conn, _params) do
    index = Application.app_dir(:elixir_video_chat, "priv/static/index.html")

    if File.exists?(index) do
      conn
      |> put_resp_content_type("text/html")
      |> put_resp_header("cache-control", "public, max-age=0, must-revalidate")
      |> send_file(200, index)
    else
      conn
      |> put_resp_content_type("text/html")
      |> send_resp(503, spa_missing_html())
    end
  end

  defp spa_missing_html do
    """
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Frontend not built</title></head>
    <body style="font-family:system-ui,sans-serif;max-width:42rem;margin:3rem auto;padding:0 1rem;line-height:1.5;color:#222;">
    <h1>UI bundle missing</h1>
    <p>For development, run the Vite dev server and open <strong>http://localhost:5173</strong>:</p>
    <pre style="background:#f4f4f5;padding:1rem;border-radius:8px;">cd frontend && npm install && npm run dev</pre>
    <p>To serve this URL from Phoenix instead, build assets into <code>priv/static</code>:</p>
    <pre style="background:#f4f4f5;padding:1rem;border-radius:8px;">cd frontend && npm install && npm run build</pre>
    </body></html>
    """
  end
end
