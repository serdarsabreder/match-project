import { useEffect, useState } from 'react';
import WelcomePage from './pages/WelcomePage';
import RegistrationPage from './pages/RegistrationPage';
import FieldsPage from './pages/FieldsPage';
import OwnerFormPage from './pages/OwnerFormPage';

export type View = 'welcome' | 'register' | 'fields' | 'owner';

/** User object returned by /api/register, kept in memory for the session. */
export interface SessionUser {
  user_id: number;
  role: 'player' | 'field owner';
  city?: string;
}

interface AppState {
  view: View;
  user: SessionUser | null;
}

export default function App() {
  const [state, setState] = useState<AppState>({ view: 'welcome', user: null });

  // Navigate to the screen matching the registered user's role.
  useEffect(() => {
    if (state.user) {
      setState((s) => ({
        ...s,
        view: state.user!.role === 'player' ? 'fields' : 'owner',
      }));
    }
  }, [state.user]);

  return (
    <main className="app">
      {state.view === 'welcome' && (
        <WelcomePage onGetStarted={() => setState((s) => ({ ...s, view: 'register' }))} />
      )}

      {state.view === 'register' && (
        <RegistrationPage
          onRegistered={(user) => setState((s) => ({ ...s, user }))}
          onBack={() => setState((s) => ({ ...s, view: 'welcome' }))}
        />
      )}

      {state.view === 'fields' && state.user && <FieldsPage user={state.user} />}

      {state.view === 'owner' && state.user && <OwnerFormPage ownerId={state.user.user_id} />}
    </main>
  );
}