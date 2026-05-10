defmodule ElixirVideoChatWeb.ErrorJSON do
  @moduledoc false

  def error(%{status: status, message: message}) do
    %{errors: %{detail: message}, status: status}
  end
end
