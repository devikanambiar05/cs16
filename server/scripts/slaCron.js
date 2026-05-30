/**
 * SLA Cron Job — enforce 24hr deadline on community queries
 *
 * Run every 30 minutes: node scripts/slaCron.js
 * Or add to system cron / Windows Task Scheduler
 *
 * Logic:
 *  1. Claimed queries past 24hr with no answer → release claim, reset SLA
 *  2. Unclaimed queries past 24hr → auto-assign to most active user in that tag domain
 *  3. Unclaimed, unassigned after 2nd escalation (48hr total) → escalate to admin
 */

require('dotenv').config();
const Query = require('../models/Query');
const User = require('../models/User');
const mongoose = require('mongoose');

const SLA_24HR = 24 * 60 * 60 * 1000;

async function runSlaCron() {
  console.log(`\n[${new Date().toISOString()}] 🔄 SLA Cron starting...`);
  let actionCount = 0;

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/samagama');
    const now = new Date();

    // ── 1. Claimed queries past SLA with no accepted answer ──────────────────
    // Release claim and give community another chance
    const staleClaimed = await Query.find({
      status: 'claimed',
      expiresAt: { $lt: now }
    });

    for (const query of staleClaimed) {
      const hasAcceptedAnswer = await mongoose.model('Answer').exists({
        queryId: query._id,
        isAccepted: true
      });

      if (!hasAcceptedAnswer) {
        console.log(`  ⚠️  Releasing stale claim: "${query.title}" (was with ${query.assignedTo})`);
        query.assignedTo = null;
        query.claimedAt = null;
        query.status = 'open';
        query.expiresAt = new Date(Date.now() + SLA_24HR);
        query.escalationCount += 1;
        query.escalatedAt = query.escalatedAt || new Date();
        await query.save();
        actionCount++;
      }
    }

    // ── 2. Unclaimed queries past SLA — auto-assign to active user ───────────
    const expiredOpen = await Query.find({
      status: 'open',
      assignedTo: null,
      expiresAt: { $lt: now }
    });

    for (const query of expiredOpen) {
      // Pick the most active user who has answered in that tag domain
      const tag = query.tags && query.tags[0];

      let assignee = null;
      if (tag) {
        // Find active users who have answered questions with matching tags
        const tagAnswers = await mongoose.model('Answer').aggregate([
          { $match: { queryId: { $ne: null } } },
          { $lookup: { from: 'queries', localField: 'queryId', foreignField: '_id', as: 'query' } },
          { $unwind: '$query' },
          { $match: { 'query.tags': tag } },
          { $group: { _id: '$userId', answerCount: { $sum: 1 } } },
          { $sort: { answerCount: -1 } },
          { $limit: 5 }
        ]);

        if (tagAnswers.length > 0) {
          // Pick the top answerer for this tag who's not the query creator
          const candidates = await User.find({
            _id: { $in: tagAnswers.map(a => a._id), $ne: query.createdBy },
            status: 'active'
          }).sort({ reputation: -1 }).limit(1);

          if (candidates.length > 0) assignee = candidates[0]._id;
        }
      }

      // Fallback: pick the most overall-active user
      if (!assignee) {
        const activeUsers = await User.find({
          _id: { $ne: query.createdBy },
          status: 'active',
          role: 'user'
        }).sort({ reputation: -1, answersGiven: -1 }).limit(1);

        if (activeUsers.length > 0) assignee = activeUsers[0]._id;
      }

      if (assignee) {
        console.log(`  🔄 Auto-assigning expired query: "${query.title}" → user ${assignee}`);
        query.assignedTo = assignee;
        query.claimedAt = new Date();
        query.status = 'claimed';
        query.expiresAt = new Date(Date.now() + SLA_24HR);
        query.escalationCount += 1;
        query.escalatedAt = query.escalatedAt || new Date();
        await query.save();
        actionCount++;
      } else {
        // No eligible user found — escalate to admin attention
        console.log(`  🚨 SLA breached, no assignee: "${query.title}"`);
        query.escalationCount += 1;
        query.escalatedAt = query.escalatedAt || new Date();
        await query.save();
        actionCount++;
      }
    }

    // ── 3. Unclaimed open queries older than 12 hours — notify experts ───────
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const staleUnclaimed = await Query.find({
      status: 'open',
      assignedTo: null,
      expertsNotified: { $ne: true },
      createdAt: { $lt: twelveHoursAgo }
    });

    for (const query of staleUnclaimed) {
      console.log(`  📣 Escalating unclaimed query (12h+): "${query.title}" to topic experts`);
      
      const { notifyTieredContributors } = require('../services/notificationService');
      await notifyTieredContributors(query, true);
      
      query.expertsNotified = true;
      query.escalationCount += 1;
      query.escalatedAt = query.escalatedAt || new Date();
      await query.save();
      actionCount++;
    }

    console.log(`[${new Date().toISOString()}] ✅ SLA Cron complete — ${actionCount} query(s) processed`);

  } catch (error) {
    console.error('SLA Cron error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run directly
runSlaCron();