import { UserRole, UserPayload } from "../../api/constants";
import Navbar from "../../components/NavBar";
import auth from "../../stores/auth";

import { useNavigate } from "@solidjs/router";
import { createEffect, createSignal, For, Show } from "solid-js";
import { commercials } from "../../api/commercials";

const DashboardCommercialsView = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = createSignal(true);
  const [clients, setClients] = createSignal<Array<UserPayload>>([]);
  
  createEffect(async () => {
    setLoading(true);

    if (!auth.user) {
      navigate("/login");
      return;
    }

    if (auth.user.role !== UserRole.ADMIN && auth.user.role !== UserRole.COMMERCIALS) {
      navigate("/dashboard");
      return;
    }

    try {
      const clients = await commercials(auth.token);
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
      <h1>Commercials</h1>

      <section>
        <Show when={!loading()} fallback={<div>Loading...</div>}>
          <For each={clients()} fallback={<div>No clients found</div>}>
            {(client) => (
              <p>{client.name}</p>
            )}
          </For>
        </Show>
      </section>
    </div>
  )
}

export default DashboardCommercialsView;
