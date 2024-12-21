import Navbar from "../../components/NavBar";
import auth from "../../stores/auth";
import { UserRole } from "../../api/constants";
import { Show } from "solid-js";

const DashboardHomeView = () => {
  return (
    <div>
      <Navbar />
      <h1>What would you like to do ?</h1>
      
      <section class="flex flex-col gap-4">
        <Show when={auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.COMMERCIALS}>
          <a href="/dashboard/commercials">Commercials Clients</a>
        </Show>

        <Show when={auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.RESIDENTIALS}>
          <a href="/dashboard/residentials">Residentials Clients</a>
        </Show>

        <a href="/dashboard/settings">Settings</a>
      </section>
    </div>
  )
}

export default DashboardHomeView;
