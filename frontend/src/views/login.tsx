import { type Component, createSignal, Show } from "solid-js";
import { LoginErrorType } from "../api/constants";

import auth from "../stores/auth";
import { login } from "../api/login";
import { changePassword } from "../api/change-password";
import { useNavigate } from "@solidjs/router";

const LoginView: Component = () => {
  const navigate = useNavigate();

  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [shouldChangePassword, setShouldChangePassword] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleLogin = async (event: SubmitEvent) => {
    event.preventDefault();
    setError("");

    const response = await login(username(), password());
    
    if (!response.success) {
      setError(response.details.message);
      auth.setToken(response.details.token ?? "")

      switch (response.details.type) {
        case LoginErrorType.USER_NOT_EXISTS:
        case LoginErrorType.PASSWORD_WRONG:
          break;
        case LoginErrorType.CHANGE_PASSWORD:
        case LoginErrorType.CHANGE_PASSWORD_EMPTY:
          setShouldChangePassword(true);
          break;
      }

      return;
    }
  
    auth.setToken(response.token);
    await auth.refresh();
    navigate("/dashboard")
  };

  const handleChangePassword = async (event: SubmitEvent) => {
    event.preventDefault();
    setError("");

    const response = await changePassword(password(), newPassword(), auth.token);

    if (!response.success) {
      setError(response.details.message);
      return;
    }

    await auth.refresh();
    navigate("/dashboard");
  }
  
  return (
    <div>
      <Show when={error()}>
        <p>{error()}</p>
      </Show>

      <Show when={!shouldChangePassword()}>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            onInput={(e) => setUsername(e.currentTarget.value)}
            value={username()}
            required
          />

          <input
            type="password"
            placeholder="Password"
            onInput={(e) => setPassword(e.currentTarget.value)}
            value={password()}
          />
          
          <button type="submit">
            Login
          </button>
        </form>
      </Show>

      <Show when={shouldChangePassword()}>
        <form onSubmit={handleChangePassword}>
          <input
            type="password"
            placeholder="New Password"
            onInput={(e) => setNewPassword(e.currentTarget.value)}
            value={newPassword()}
          />
          
          <button type="submit">
            Change Password
          </button>
        </form>
      </Show>
    </div>
  );
};

export default LoginView;
