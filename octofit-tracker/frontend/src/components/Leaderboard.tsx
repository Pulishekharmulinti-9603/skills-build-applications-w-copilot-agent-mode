import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [state, setState] = useState<{ status: 'loading' | 'success' | 'error'; leaderboard: LeaderboardEntry[]; error?: string }>({ status: 'loading', leaderboard: [] });

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(data => setState({ status: 'success', leaderboard: data.leaderboard }))
      .catch(error => setState({ status: 'error', leaderboard: [], error: error.message }));
  }, []);

  if (state.status === 'loading') return <CapabilityCard title="Leaderboard" description="Compare team point totals." status="Loading rankings..." />;
  if (state.status === 'error') return <CapabilityCard title="Leaderboard" description="Compare team point totals." status={`Error: ${state.error}`} isError />;
  if (state.leaderboard.length === 0) return <CapabilityCard title="Leaderboard" description="Compare team point totals." status="No leaderboard rankings yet" />;

  return <section className="card h-100"><div className="card-body"><h2 className="h4">Leaderboard</h2><p>Compare team point totals.</p><table className="table"><thead><tr><th>Rank</th><th>Team</th><th>Points</th></tr></thead><tbody>{state.leaderboard.map(entry => <tr key={entry.rank}><td>{entry.rank}</td><td>{entry.teamName}</td><td>{entry.totalPoints}</td></tr>)}</tbody></table></div></section>;
}

