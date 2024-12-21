import { Show } from "solid-js";
import auth from "../stores/auth";
import { UserRole } from "../api/constants";
import { useNavigate } from "@solidjs/router";

const Navbar = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <header class="flex items-center justify-between">
      <nav class="flex items-center gap-2">
        <a href="/dashboard">Home</a>

        <Show when={auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.COMMERCIALS}>
          <a href="/dashboard/commercials">Commercials Clients</a>
        </Show>

        <Show when={auth.user?.role === UserRole.ADMIN || auth.user?.role === UserRole.RESIDENTIALS}>
          <a href="/dashboard/residentials">Residentials Clients</a>
        </Show>

        <a href="/dashboard/logs">Logs</a>
        <a href="/dashboard/settings">Settings</a>
      </nav>

      <div class="flex items-center gap-2">
        <p>
          Hello, <span class="font-bold">{auth.user?.name}</span>
        </p>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

    </header>
  )
};

export default Navbar;
