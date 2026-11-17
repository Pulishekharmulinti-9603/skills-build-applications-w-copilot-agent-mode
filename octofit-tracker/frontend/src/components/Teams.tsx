import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [state, setState] = useState<{ status: 'loading' | 'success' | 'error'; teams: Team[]; error?: string }>({ status: 'loading', teams: [] });

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(data => setState({ status: 'success', teams: data.teams }))
      .catch(error => setState({ status: 'error', teams: [], error: error.message }));
  }, []);

  if (state.status === 'loading') return <CapabilityCard title="Teams" description="Manage teams and members." status="Loading teams..." />;
  if (state.status === 'error') return <CapabilityCard title="Teams" description="Manage teams and members." status={`Error: ${state.error}`} isError />;
  if (state.teams.length === 0) return <CapabilityCard title="Teams" description="Manage teams and members." status="No teams yet" />;

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Teams</h2><p>Manage teams and members.</p><div>{state.teams.map(team => <div key={team.name} className="mb-3"><h3 className="h6">{team.name}</h3><p>{team.members.length} members</p></div>)}</div></div></section>;
}

