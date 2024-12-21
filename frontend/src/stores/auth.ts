import { createRoot } from "solid-js";
import { createStore } from "solid-js/store";
import { makePersisted } from "@solid-primitives/storage";
import { type UserPayload } from "../api/constants";
import { user } from "../api/user";

export default createRoot(() => {
  const [state, setState] = makePersisted(createStore({
    token: "",
    user: null as UserPayload | null
  }));

  const refresh = async () => {
    const response = await user(state.token);
    if (response.success) {
      setState("user", response.user);
    }
    else {
      logout();
    }
  }

  const logout = () => {
    // reset everything !
    setState({
      token: "",
      user: null
    });
  }

  refresh();

  return {
    logout,
    refresh,
    setToken (token: string) {
      setState("token", token);
    },
    get user () {
      return state.user;
    },
    get token () {
      return state.token;
    }
  }
})