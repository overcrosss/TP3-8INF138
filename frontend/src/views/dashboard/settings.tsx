import Navbar from "../../components/NavBar";
import { Show, For, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { changePassword } from "../../api/change-password";
import auth from "../../stores/auth";
import { useNavigate } from "@solidjs/router";
import { UserRole } from "../../api/constants";
import { getServerConfiguration, updateServerConfiguration } from "../../api/server-configuration";
import { blockedUsers, unblockUser } from "../../api/admin";
import { type ServerConfiguration, type UserPayload } from "../../api/constants";

const DashboardSettingsView = () => {
  const navigate = useNavigate();

  const [passwordState, setPasswordState] = createStore({
    currentPassword: "",
    newPassword: "",
    error: "",
    loading: false
  });

  const [serverConfig, setServerConfig] = createStore({
    loading: true
  } as ServerConfiguration & { loading: boolean });

  const [blockedUsersState, setBlockedUsersState] = createStore({
    loading: true,
    users: [] as Array<UserPayload>
  });

  createEffect(async () => {
    if (!auth.user) {
      navigate("/login");
      return;
    }

    if (auth.user.role === UserRole.ADMIN) {
      const users = await blockedUsers(auth.token);
      setBlockedUsersState({ users, loading: false });

      const serverConfig = await getServerConfiguration(auth.token);
      setServerConfig({ ...serverConfig, loading: false });
    }
  })

  const handleChangePassword = async (event: SubmitEvent) => {
    event.preventDefault();

    setPasswordState({
      loading: true,
      error: ""
    });

    const response = await changePassword(passwordState.currentPassword, passwordState.newPassword, auth.token)
    setPasswordState("loading", false);
    
    if (!response.success) {
      setPasswordState("error", response.details.message);
    }
  };

  const handleUpdateServerConfiguration = async (event: SubmitEvent) => {
    event.preventDefault();

    setServerConfig("loading", true);
    await updateServerConfiguration(auth.token, {
      max_auth_attempts: serverConfig.max_auth_attempts,
      wait_when_failed_ms: serverConfig.wait_when_failed_ms,
      password_min_length: serverConfig.password_min_length,
      password_one_uppercase_and_one_lowercase: serverConfig.password_one_uppercase_and_one_lowercase,
      password_one_special_character_and_one_number: serverConfig.password_one_special_character_and_one_number,
    });
    setServerConfig("loading", false);
  };

  const unblockUserFromTable = async (username: string) => {
    setBlockedUsersState("loading", true);

    const newUserPassword = await unblockUser(auth.token, username);
    setBlockedUsersState({
      users: blockedUsersState.users.filter(user => user.name !== username),
      loading: false
    });

    prompt(`User ${username} has been unblocked, there is their new password`, newUserPassword);
  }

  return (
    <div>
      <Navbar />
      <h1>Settings</h1>

      <section>
        <h2>Password</h2>
        
        <Show when={passwordState.error}>
          <p>{passwordState.error}</p>
        </Show>

        <form onSubmit={handleChangePassword}>
          <input type="password" placeholder="Current password"
            value={passwordState.currentPassword}
            onInput={(e) => setPasswordState("currentPassword", e.currentTarget.value)}
          />
          <input type="password" placeholder="New password"
            value={passwordState.newPassword}
            onInput={(e) => setPasswordState("newPassword", e.currentTarget.value)}
          />

          <button type="submit" disabled={passwordState.loading}>
            Change Password
          </button>
        </form>
      </section>

      <Show when={auth.user?.role === UserRole.ADMIN}>
        <section>
          <h2>Blocked users</h2>
          <p class="italic opacity-75">Only visible to admins</p>

          <Show when={!blockedUsersState.loading} fallback={<p>Loading...</p>}>
            <For each={blockedUsersState.users} fallback={<p>No blocked users</p>}>
              {user => (
                <div class="flex items-center gap-2">
                  <p>{user.name}</p>
                  <button
                    disabled={blockedUsersState.loading}
                    onClick={() => unblockUserFromTable(user.name)}
                  >
                    Unblock
                  </button>
                </div>
              )}
            </For>
          </Show>
        </section>
        <section>
          <h2>Server Configuration</h2>
          <p class="italic opacity-75">Only visible to admins</p>
          
          <Show when={!serverConfig.loading} fallback={<p>Loading...</p>}>
            <form
              onSubmit={handleUpdateServerConfiguration}
              class="flex flex-col gap-2"
            >
              <label>
                Max authentication attemps
                <input
                  class="ml-2"
                  type="number"
                  placeholder="Max authentication attemps"
                  value={serverConfig.max_auth_attempts}
                  onInput={(e) => setServerConfig("max_auth_attempts", parseInt(e.currentTarget.value))}
                  required
                />
              </label>
              <label>
                Delay in MS when wrong password
                <input
                  class="ml-2"
                  type="number"
                  placeholder="Delay in MS when wrong password"
                  value={serverConfig.wait_when_failed_ms}
                  onInput={(e) => setServerConfig("wait_when_failed_ms", parseInt(e.currentTarget.value))}
                  required
                />
              </label>
              <label>
                Delay in MS when wrong password
                <input
                  class="ml-2"
                  type="number"
                  placeholder="Password minimum length"
                  value={serverConfig.password_min_length}
                  onInput={(e) => setServerConfig("password_min_length", parseInt(e.currentTarget.value))}
                  required
                />
              </label>
              <label class="flex items-center">
                Should password contain at least one uppercase and one lowercase letter ?
                <input
                  class="ml-2"
                  type="checkbox"
                  checked={serverConfig.password_one_uppercase_and_one_lowercase}
                  onChange={(e) => setServerConfig("password_one_uppercase_and_one_lowercase", e.currentTarget.checked)}
                  required
                />
              </label>
              <label class="flex items-center">
                Should password contain at least one special character and one number ?
                <input
                  class="ml-2"
                  type="checkbox"
                  checked={serverConfig.password_one_special_character_and_one_number}
                  onChange={(e) => setServerConfig("password_one_special_character_and_one_number", e.currentTarget.checked)}
                  required
                />
              </label>

              <button
                type="submit"
                class="w-fit mt-4"
                disabled={serverConfig.loading}
              >
                Update
              </button>
            </form>
          </Show>
        </section>
      </Show>
    </div>
  )
}

export default DashboardSettingsView;
