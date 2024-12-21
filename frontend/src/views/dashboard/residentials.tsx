import { UserRole, UserPayload } from "../../api/constants";
import Navbar from "../../components/NavBar";
import auth from "../../stores/auth";

import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import { residentials } from "../../api/residentials";

const DashboardResidentialsView = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = createSignal(true);
  const [clients, setClients] = createSignal<Array<UserPayload>>([]);

  createEffect(async () => {
    setLoading(true);

    if (!auth.user) {
      navigate("/login");
      return;
    }

    if (auth.user.role !== UserRole.ADMIN && auth.user.role !== UserRole.RESIDENTIALS) {
      navigate("/dashboard");
      return;
    }

    try {
      const clients = await residentials(auth.token);
      setClients(clients);
      setLoading(false);
    }
    catch {
      navigate("/dashboard");
    }
  });
  

  return (
    <div>
      <Navbar />
      <h1>Residentials</h1>

      <Show when={!loading()} fallback={<div>Loading...</div>}>
        <For each={clients()} fallback={<div>No clients found</div>}>
          {(client) => (
            <p>{client.name}</p>
          )}
        </For>
      </Show>
    </div>
  )
}

export default DashboardResidentialsView;
