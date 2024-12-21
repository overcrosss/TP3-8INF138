import { LogAction, type Log } from "../../api/constants";
import Navbar from "../../components/NavBar";
import auth from "../../stores/auth";

import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import { getLogs } from "../../api/logs";

const DashboardLogsView = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = createSignal(true);
  const [logs, setLogs] = createSignal<Array<Log>>([]);

  createEffect(async () => {
    setLoading(true);

    if (!auth.user) {
      navigate("/login");
      return;
    }

    try {
      const logs = await getLogs(auth.token);
      setLogs(logs);
      setLoading(false);
    }
    catch {
      navigate("/dashboard");
    }
  });
  
  const translateLogAction = (action: LogAction) => {
    switch (action) {
      case LogAction.ACCOUNT_BLOCKED:
        return "Account Blocked";
      case LogAction.ACCOUNT_UNBLOCKED:
        return "Account Unblocked";
      case LogAction.CHANGE_PASSWORD:
        return "Password Changed";
      case LogAction.LOGIN_FAIL:
        return "Login Failed";
      case LogAction.LOGIN_SUCCESS:
        return "Login Succeded";
    }
  }

  return (
    <div>
      <Navbar />
      <h1>Logs</h1>

      <section class="flex flex-col gap-6">
        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <For each={logs()} fallback={<div>No logs found</div>}>
            {(log) => (
              <div class="flex flex-col">
                <p class="text-lg m-0">{translateLogAction(log.action)}</p>
                <p class="italic m-0">{new Date(log.done_at).toLocaleString("fr-FR")}</p>
              </div>
            )}
          </For>
        </Show>
      </section>
    </div>
  )
}

export default DashboardLogsView;
