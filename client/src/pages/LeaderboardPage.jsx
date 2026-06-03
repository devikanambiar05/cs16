import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getVolunteerLevel } from '../utils/gamificationHelper';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getLeaderboard({ params: { limit: 100 } })
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to load leaderboard:', err))
      .finally(() => setLoading(false));
  }, []);

  // Real-time client-side filter — preserves original rank numbers
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.name?.toLowerCase().includes(q));
  }, [users, searchQuery]);

  const isFiltering = searchQuery.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leaderboard</h1>
          <p className="text-slate-600">Top contributors ranked by reputation</p>
        </div>
        {!user && (
          <Link to="/login" className="btn-primary text-sm">
            Sign in to compete
          </Link>
        )}
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name..."
          className="input pl-9 pr-9 py-2 text-sm w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : filteredUsers.length === 0 ? (
        isFiltering ? (
          <div className="text-center py-16 text-slate-400">
            <div className="flex justify-center mb-3">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-600">No results for "{searchQuery}"</p>
            <p className="text-sm mt-1 text-slate-400">Try a different name</p>
            <button onClick={() => setSearchQuery('')} className="mt-4 text-sm text-primary-600 hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <div className="flex justify-center mb-3">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-600">No users yet</p>
            <p className="text-sm mt-1">Be the first to earn reputation!</p>
            <Link to="/community" className="btn-primary mt-4 inline-block">Browse Community</Link>
          </div>
        )
      ) : (
        <>
          {isFiltering && (
            <p className="text-xs text-slate-400 mb-3">
              {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              // Preserve the original global rank from the full sorted list
              const globalRank = users.findIndex(x => x._id === u._id);
              return (
                <div key={u._id} className="card flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    globalRank === 0 ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' :
                    globalRank === 1 ? 'bg-slate-100 text-slate-600 border-2 border-slate-300' :
                    globalRank === 2 ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' :
                    'bg-slate-50 text-slate-400 border border-slate-200'
                  }`}>
                    {globalRank + 1}
                  </div>

                  {/* User info */}
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
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {u.questionsAsked || 0} asked
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {u.answersGiven || 0} answered
                      </span>
                    </div>
                  </div>

                  {/* Reputation */}
                  <div className="text-right shrink-0">
                    <span className="text-xl font-bold text-primary-600">{u.reputation || 0}</span>
                    <span className="text-xs text-slate-400 block">rep</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-8 bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800 mb-2">How to earn reputation:</p>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Submit an answer that gets accepted — <strong>+10</strong>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Your answer gets converted to a public FAQ — <strong>+10</strong>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h2c.55 0 1-.45 1-1v-7c0-.55-.45-1-1-1H2v9zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05-.03.15z"/></svg>
            Your answer gets upvoted — <strong>+5</strong>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h2c.55 0 1-.45 1-1v-7c0-.55-.45-1-1-1H2v9zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05-.03.15z"/></svg>
            Your question gets upvoted — <strong>+2</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}
