import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  const [state, setState] = useState<{ status: 'loading' | 'success' | 'error'; suggestions: Suggestion[]; error?: string }>({ status: 'loading', suggestions: [] });

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then(data => setState({ status: 'success', suggestions: data.suggestions }))
      .catch(error => setState({ status: 'error', suggestions: [], error: error.message }));
  }, []);

  if (state.status === 'loading') return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." status="Loading suggestions..." />;
  if (state.status === 'error') return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." status={`Error: ${state.error}`} isError />;
  if (state.suggestions.length === 0) return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." status="No workout suggestions yet" />;

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p><div>{state.suggestions.map((suggestion, i) => <div key={i} className="mb-3"><h3 className="h6">{suggestion.title}</h3><p>{suggestion.reason}</p></div>)}</div></div></section>;
}

