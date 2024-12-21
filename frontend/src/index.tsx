/* @refresh reload */
import "uno.css";
import { render } from 'solid-js/web'
import { createEffect } from 'solid-js'
import { Router, Route, useNavigate } from "@solidjs/router";
import auth from './stores/auth';

import LoginView from './views/login';
import DashboardHomeView from './views/dashboard/home';
import DashboardResidentialsView from './views/dashboard/residentials';
import DashboardCommercialsView from './views/dashboard/commercials';
import DashboardSettingsView from './views/dashboard/settings';

const Splash = () => {
  const navigate = useNavigate();

  createEffect(async () => {
    await auth.refresh();

    if (auth.user) navigate('/dashboard');
    else navigate('/login');
  })

  return <div>Loading...</div>
}

const App = () => {
  return (
    <Router>
      <Route path="/" component={Splash} />
      <Route path="/login" component={LoginView} />
      <Route path="/dashboard" component={DashboardHomeView} />
      <Route path="/dashboard/residentials" component={DashboardResidentialsView} />
      <Route path="/dashboard/commercials" component={DashboardCommercialsView} />
      <Route path="/dashboard/settings" component={DashboardSettingsView} />
    </Router>
  )
};

const root = document.getElementById('root')
render(() => <App />, root!)
