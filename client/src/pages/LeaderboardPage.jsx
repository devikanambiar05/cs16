import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getVolunteerLevel } from '../utils/gamificationHelper';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // 👇 1. Added timeframe state to track toggle selection ('alltime' or 'weekly')
  const [timeframe, setTimeframe] = useState('alltime'); 

  // 👇 2. Re-trigger fetch whenever the timeframe tab changes
  useEffect(() => {
    setLoading(true);
    getLeaderboard({ limit: 20, timeframe })
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to load leaderboard:', err))
      .finally(() => setLoading(false));
  }, [timeframe]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leaderboard</h1>
          <p className="text-slate-600">Top contributors ranked by reputation</p>
        </div>
        
        {/* 👇 3. Toggle Control Buttons Box Added */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl select-none w-fit self-start sm:self-center">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframe === 'weekly'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Weekly Rank
          </button>
          <button
            onClick={() => setTimeframe('alltime')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframe === 'alltime'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Time
          </button>
        </div>

        {!user && (
          <Link to="/login" className="btn-primary text-sm shrink-0">
            Sign in to compete
          </Link>
        )}
      </div>

      {/* Render States */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-lg font-medium text-slate-600">No active rankings</p>
          <p className="text-sm mt-1">
            {timeframe === 'weekly' 
              ? 'No contributions made yet within the current week.' 
              : 'Be the first to earn reputation!'}
          </p>
          <Link to="/community" className="btn-primary mt-4 inline-block">Browse Community</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u, i) => (
            <div key={u._id} className="card flex items-center gap-4">
              {/* Rank Badge */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                i === 0 ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' :
                i === 1 ? 'bg-slate-100 text-slate-600 border-2 border-slate-300' :
                i === 2 ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' :
                'bg-slate-50 text-slate-400 border border-slate-200'
              }`}>
                {i + 1}
              </div>

              {/* User Identity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900 truncate">{u.name}</span>
                  {getVolunteerLevel(u) && (
                    <span className={`px-2 py-px rounded-full text-[9px] font-bold border uppercase tracking-wider select-none shrink-0 ${getVolunteerLevel(u).badgeClass}`} title={`${getVolunteerLevel(u).name} (Level ${getVolunteerLevel(u).level})`}>
                      {getVolunteerLevel(u).icon} Lvl {getVolunteerLevel(u).level}
                    </span>
                  )}
                  {u.role === 'admin' && (
                    <span className="badge badge-red text-xs shrink-0">Admin</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>❓ {u.questionsAsked || 0} asked</span>
                  <span>💬 {u.answersGiven || 0} answered</span>
                </div>
              </div>

              {/* Score Display Box */}
              <div className="text-right shrink-0">
                <span className="text-xl font-bold text-primary-600">{u.reputation || 0}</span>
                <span className="text-xs text-slate-400 block">rep</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rules Footer Indicator */}
      <div className="mt-8 bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800 mb-1">How to earn reputation:</p>
        <ul className="space-y-1">
          <li>💡 Submit an answer that gets accepted — <strong>+10</strong></li>
          <li>📋 Your answer gets converted to a public FAQ — <strong>+10</strong></li>
          <li>👍 Your answer gets upvoted — <strong>+5</strong></li>
          <li>👍 Your question gets upvoted — <strong>+2</strong></li>
        </ul>
      </div>
    </div>
  );
}