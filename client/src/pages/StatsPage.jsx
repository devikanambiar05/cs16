import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQueryStats, fetchUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';

const TimerIcon = () => (
  <svg className="w-5 h-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);

const TrophyIcon = () => (
  <svg className="w-5 h-5 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V17M10 21H14M12 15C15 15 17 13 17 10V5H7V10C7 13 9 15 12 15ZM17 7H19.5C20.5 7 21 8 21 9V10C21 11 20 12 19 12H17ZM7 7H4.5C3.5 7 3 8 3 9V10C3 11 4 12 5 12H7" />
  </svg>
);

const StatsIcon = () => (
  <svg className="w-5 h-5 text-primary-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export default function StatsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState({ total: 0, open: 0, breached: 0, claimed: 0, answered: 0 });
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !user.isVolunteer) {
      toast.warning('You must volunteer to access the Volunteer Analytics Dashboard.');
      navigate('/community');
      return;
    }

    const loadStats = async () => {
      try {
        setLoading(true);
        const [statsRes, profileRes] = await Promise.all([
          getQueryStats(),
          fetchUserProfile()
        ]);
        setStats(statsRes.data);
        setUserStats(profileRes.data);
      } catch (err) {
        toast.error('Failed to load board statistics');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 dark:border-slate-800 rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 select-none">
      {/* Premium Stats Header */}
      <div className="bg-white dark:bg-[#22211e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-8 shadow-sm transition-all duration-300 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
              Volunteer Analytics Dashboard
            </h1>
            <p className="text-slate-650 dark:text-slate-400 max-w-xl text-sm leading-relaxed">
              Track SLA compliance matrices, active community claims, and your personal gamified performance benchmarks as a registered Grantha responder.
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start md:self-center">
            <span>🛡️</span> Active Volunteer Responder
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Side: General board stats (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-[#22211e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-serif font-bold text-slate-900 dark:text-slate-200 text-lg mb-5 flex items-center gap-1">
              <StatsIcon /> Community Board SLA Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-4 border border-slate-100 dark:border-slate-805">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Open Queries</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">{stats.open}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Awaiting expert resolution claims</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-4 border border-slate-100 dark:border-slate-805">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Claims</span>
                <span className="text-3xl font-bold text-amber-600 dark:text-amber-450 mt-1 block">{stats.claimed}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Queries currently locked in 24h SLA</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-4 border border-slate-100 dark:border-slate-805">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">SLA Breached</span>
                <span className="text-3xl font-bold text-red-650 dark:text-red-400 mt-1 block">{stats.breached}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Overdue claims without submissions</span>
              </div>

              <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-4 border border-slate-100 dark:border-slate-805">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Resolved</span>
                <span className="text-3xl font-bold text-emerald-650 dark:text-emerald-450 mt-1 block">{stats.answered}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Queries successfully answered and closed</span>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-white dark:bg-[#22211e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-serif font-bold text-slate-900 dark:text-slate-200 text-lg mb-4 flex items-center gap-1">
              📜 Active Responder Commitments
            </h3>
            <div className="space-y-4 text-xs md:text-sm text-slate-650 dark:text-slate-400 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-750 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="font-semibold text-slate-850 dark:text-slate-200 mb-0.5">Respect the 24-Hour Timer</h4>
                  <p className="text-xs text-slate-500">Once you claim a community query, you are guaranteed exclusive answering rights for 24 hours. Unanswered queries are released back to the pool, adding a skip penalty to your metrics.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-750 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="font-semibold text-slate-850 dark:text-slate-200 mb-0.5">Anti-Collusion Protocols</h4>
                  <p className="text-xs text-slate-500">Grantha implements strict anti-collusion limits. Users are capped at a maximum of 2 upvotes for the same contributor within any 24-hour window to protect leaderboard integrity.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-750 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="font-semibold text-slate-850 dark:text-slate-200 mb-0.5">Double Reputation Events</h4>
                  <p className="text-xs text-slate-500">Answering highly overdue queries or escalated queries yields double the default reputation points (+40 on acceptance) to incentivize volunteer efforts on rare questions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: User-specific stats (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#22211e] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-serif font-bold text-slate-900 dark:text-slate-200 text-lg mb-4 flex items-center gap-1">
              <TrophyIcon /> Your Contribution Profile
            </h3>
            
            {userStats && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Reputation Score</span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{userStats.reputation} Rep</span>
                </div>

                <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Answers Contributed</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{userStats.answersGiven || 0} Given</span>
                </div>

                <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-3 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Queries Raised</span>
                  <span className="text-sm font-bold text-slate-850 dark:text-slate-350">{userStats.questionsAsked || 0} Raised</span>
                </div>

                <div className="bg-slate-50 dark:bg-[#191816] rounded-xl p-4 border border-slate-100 dark:border-slate-800/50 text-center">
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Volunteer Badge</span>
                  <span className="inline-block px-3 py-1 bg-amber-500 text-white dark:bg-amber-600 rounded-full text-xs font-bold shadow-sm">
                    🎓 SLA Responder
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-500/20 rounded-2xl p-5 shadow-sm flex items-start gap-3">
            <TimerIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="block text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Volunteering Alert</span>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-450/80 leading-relaxed">
                Ensure you are matching query tags with your expertise areas. Consistently high accepted ratios unlock advanced editor tools and vetting privileges (+100 reputation threshold).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
