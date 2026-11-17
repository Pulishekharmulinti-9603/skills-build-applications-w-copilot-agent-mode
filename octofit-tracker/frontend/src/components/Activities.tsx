import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [state, setState] = useState<{ status: 'loading' | 'success' | 'error'; activities: Activity[]; error?: string }>({ status: 'loading', activities: [] });

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(data => setState({ status: 'success', activities: data.activities }))
      .catch(error => setState({ status: 'error', activities: [], error: error.message }));
  }, []);

  if (state.status === 'loading') return <CapabilityCard title="Activities" description="Track student activity minutes and points." status="Loading activities..." />;
  if (state.status === 'error') return <CapabilityCard title="Activities" description="Track student activity minutes and points." status={`Error: ${state.error}`} isError />;
  if (state.activities.length === 0) return <CapabilityCard title="Activities" description="Track student activity minutes and points." status="No activities yet" />;

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Activities</h2><p>Track student activity minutes and points.</p><table className="table"><thead><tr><th>Type</th><th>Minutes</th><th>Points</th></tr></thead><tbody>{state.activities.map((activity, i) => <tr key={i}><td>{activity.type}</td><td>{activity.minutes}</td><td>{activity.points}</td></tr>)}</tbody></table></div></section>;
}

