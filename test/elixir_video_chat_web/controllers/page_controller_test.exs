defmodule ElixirVideoChatWeb.PageControllerTest do
  use ElixirVideoChatWeb.ConnCase

  test "GET /api/webrtc-config returns ice servers", %{conn: conn} do
    conn = get(conn, "/api/webrtc-config")
    body = json_response(conn, 200)
    assert is_list(body["iceServers"])
    assert map_size(hd(body["iceServers"])) >= 1
  end

  test "GET / serves SPA or missing-build message", %{conn: conn} do
    conn = get(conn, "/")
    index = Application.app_dir(:elixir_video_chat, "priv/static/index.html")

    if File.exists?(index) do
      assert conn.status == 200
      assert conn.resp_body =~ ~s(id="root")
    else
      assert conn.status == 503
      assert conn.resp_body =~ "Vite"
    end
  end
end
