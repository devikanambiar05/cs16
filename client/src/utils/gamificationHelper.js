/**
 * Gamification Helper Utilities for Grantha
 * Calculates user levels, unlocks badges, and maps styling tokens
 */

/**
 * Computes the active volunteer level of a user
 * @param {Object} user - The user object containing reputation, acceptedAnswersCount, isVolunteer
 * @returns {Object|null} - Level details or null if not a volunteer
 */
export function getVolunteerLevel(user) {
  if (!user || !user.isVolunteer) return null;
  
  const rep = user.reputation || 0;
  const accepted = user.acceptedAnswersCount || 0;
  
  if (rep >= 800 && accepted >= 25) {
    return {
      level: 4,
      name: 'Grantha Master',
      icon: '🌳',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200/50 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-900/40',
      nextThreshold: null
    };
  } else if (rep >= 300 && accepted >= 10) {
    return {
      level: 3,
      name: 'Elite Scholar',
      icon: '🧠',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200/50 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/40',
      nextThreshold: { reputation: 800, accepted: 25, label: 'Grantha Master' }
    };
  } else if (rep >= 100 && accepted >= 3) {
    return {
      level: 2,
      name: 'Expert Responder',
      icon: '🛡️',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200/50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/40',
      nextThreshold: { reputation: 300, accepted: 10, label: 'Elite Scholar' }
    };
  } else {
    return {
      level: 1,
      name: 'Volunteer',
      icon: '🎓',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200/50 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/40',
      nextThreshold: { reputation: 100, accepted: 3, label: 'Expert Responder' }
    };
  }
}

/**
 * Computes all achievement badges unlocked by a user
 * @param {Object} user - The user object
 * @returns {Array<Object>} - List of unlocked badge objects
 */
export function getUserBadges(user) {
  if (!user) return [];
  
  const badges = [];
  const rep = user.reputation || 0;
  const accepted = user.acceptedAnswersCount || 0;
  const answers = user.answersGiven || 0;
  const isVolunteer = user.isVolunteer || false;
  
  // 1. Fast Responder ⚡
  // Unlocked if a volunteer has submitted at least 3 answers (indicates high activity in claiming/resolving)
  if (isVolunteer && answers >= 3) {
    badges.push({
      id: 'fast_responder',
      name: 'Fast Responder',
      icon: '⚡',
      desc: 'Contributed 3+ answers in the community board under claim-and-answer rules.',
      colorClass: 'bg-yellow-50 text-yellow-700 border-yellow-250 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/30'
    });
  }
  
  // 2. First Citizen 🥇
  // Unlocked upon receiving the very first accepted answer
  if (accepted >= 1) {
    badges.push({
      id: 'first_citizen',
      name: 'First Citizen',
      icon: '🥇',
      desc: 'Had their first peer answer accepted as the definitive solution by a query owner.',
      colorClass: 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/40 dark:text-amber-450 dark:border-amber-900/30'
    });
  }
  
  // 3. Peer Mentor 🤝
  // Unlocked when the user achieves 5+ accepted answers
  if (accepted >= 5) {
    badges.push({
      id: 'peer_mentor',
      name: 'Peer Mentor',
      icon: '🤝',
      desc: 'Contributed 5+ accepted answers to help multiple peers resolve their blocks.',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30'
    });
  }
  
  // 4. Response Champion 🏆
  // Unlocked for elite volunteers with high reputation and high accepted answers
  if (isVolunteer && rep >= 200 && accepted >= 5) {
    badges.push({
      id: 'response_champion',
      name: 'Response Champion',
      icon: '🏆',
      desc: 'Maintained excellent response speed with high reputation and multiple accepted answers.',
      colorClass: 'bg-purple-50 text-purple-700 border-purple-250 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/30'
    });
  }
  
  // 5. Popular Voice 🔥
  // Unlocked upon crossing 150 reputation points
  if (rep >= 150) {
    badges.push({
      id: 'popular_voice',
      name: 'Popular Voice',
      icon: '🔥',
      desc: 'Earned 150+ reputation points from cumulative community upvotes.',
      colorClass: 'bg-red-50 text-red-700 border-red-250 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30'
    });
  }
  
  return badges;
}
