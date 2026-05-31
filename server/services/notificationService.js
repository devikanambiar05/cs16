const User = require('../models/User');
const Answer = require('../models/Answer');
const Query = require('../models/Query');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

const getCategoryContributors = async (query, isExpert = false) => {
  const tag = query.tags && query.tags[0];
  
  let candidates = [];
  if (tag) {
    // Find active users who have answered questions with matching tags
    const tagAnswers = await Answer.aggregate([
      { $match: { queryId: { $ne: null } } },
      { $lookup: { from: 'queries', localField: 'queryId', foreignField: '_id', as: 'query' } },
      { $unwind: '$query' },
      { $match: { 'query.tags': tag } },
      { $group: { _id: '$userId', answerCount: { $sum: 1 } } },
      { $sort: { answerCount: -1 } },
      { $limit: 10 }
    ]);
    
    if (tagAnswers.length > 0) {
      const userIds = tagAnswers.map(a => a._id);
      const queryFilter = {
        _id: { $in: userIds, $ne: query.createdBy },
        status: 'active',
        role: 'user'
      };
      
      if (isExpert) {
        queryFilter.reputation = { $gte: 100 };
      } else {
        queryFilter.reputation = { $lt: 100 };
      }
      
      candidates = await User.find(queryFilter)
        .sort({ reputation: isExpert ? -1 : 1 })
        .limit(3);
    }
  }
  
  // Fallback: pick general active users matching the reputation tier
  if (candidates.length < 3) {
    const skipIds = [query.createdBy, ...candidates.map(c => c._id)];
    const queryFilter = {
      _id: { $nin: skipIds },
      status: 'active',
      role: 'user'
    };
    
    if (isExpert) {
      queryFilter.reputation = { $gte: 100 };
    } else {
      queryFilter.reputation = { $lt: 100 };
    }
    
    const extraCandidates = await User.find(queryFilter)
      .sort({ reputation: isExpert ? -1 : 1 })
      .limit(3 - candidates.length);
      
    candidates = [...candidates, ...extraCandidates];
  }
  
  return candidates;
};

const notifyTieredContributors = async (query, isExpert = false) => {
  try {
    const contributors = await getCategoryContributors(query, isExpert);
    if (contributors.length === 0) return;
    
    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const queryUrl = `${dashboardUrl}/community`;
    
    const subject = isExpert 
      ? `🚨 High-Value Escalated Query: "${query.title}"`
      : `🎯 New community query needs help: "${query.title}"`;
      
    const headerTitle = isExpert 
      ? `🚨 High-Value Escalated Query` 
      : `🎯 New Community Query`;
      
    const repMessage = isExpert 
      ? `This query is escalated and offers <strong>double reputation points</strong> (up to +40 rep on accept, +10 on vetting)!`
      : `Claim this query to answer and earn reputation points!`;

    for (const user of contributors) {
      if (!user.email || user.emailNotifications === false) continue;
      
      console.log(`[Tiered Routing] Sending email notification to ${isExpert ? 'Expert' : 'Growing'} Contributor: ${user.email}`);
      await sendEmail({
        to: user.email,
        subject,
        text: `Hi ${user.name},\n\nA new query in your matched tags needs attention: "${query.title}"\n\n${repMessage}\n\nView community board → ${queryUrl}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <div style="background: ${isExpert ? '#cc5a37' : '#4f46e5'}; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">${headerTitle}</h2>
            </div>
            <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Hi ${user.name},</p>
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">"${query.title}"</p>
              <p style="background: white; border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 8px; color: #374151; font-size: 14px; line-height: 1.6;">
                ${repMessage}
              </p>
              <a href="${queryUrl}" style="display: inline-block; margin-top: 20px; background: ${isExpert ? '#cc5a37' : '#4f46e5'}; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                Claim &amp; Answer Query →
              </a>
              <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                You're receiving this as a contributor in matching topic tags. You can toggle email notifications in your profile settings.
              </p>
            </div>
          </div>`
      });
    }
  } catch (err) {
    console.error('Failed to execute tiered notification:', err);
  }
};

const notifyAdminsOfEscalatedQuery = async (query) => {
  try {
    const admins = await User.find({ role: 'admin', status: 'active' });
    if (admins.length === 0) return;
    
    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const queryUrl = `${dashboardUrl}/community`;
    
    for (const admin of admins) {
      if (!admin.email) continue;
      
      console.log(`[Admin Escalation] Sending email notification to Admin: ${admin.email}`);
      await sendEmail({
        to: admin.email,
        subject: `🚨 Admin Alert: Query skipped 3 times!`,
        text: `Hi Admin,\n\nThe query "${query.title}" has been skipped 3 times by community members and has been escalated for administrative attention.\n\nView community board → ${queryUrl}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <div style="background: #ef4444; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">🚨 Direct Administrative Escalation</h2>
            </div>
            <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Hi Admin,</p>
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #111827;">"${query.title}"</p>
              <p style="background: white; border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 8px; color: #374151; font-size: 14px; line-height: 1.6;">
                This query has been **skipped 3 times** by community members and is now escalated directly for admin intervention.
              </p>
              <a href="${queryUrl}" style="display: inline-block; margin-top: 20px; background: #ef4444; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                Manage Queries Feed →
              </a>
              <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                You are receiving this admin email notification as an administrator of Granth.
              </p>
            </div>
          </div>`
      });
    }
  } catch (err) {
    console.error('Failed to notify admins of escalated query:', err);
  }
};

const notifyTaggedUsers = async (query, taggedUserIds) => {
  try {
    if (!taggedUserIds || taggedUserIds.length === 0) return;

    const users = await User.find({ _id: { $in: taggedUserIds }, status: 'active' });
    if (users.length === 0) return;

    const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const queryUrl = `${dashboardUrl}/community`;

    const tag = query.tags && query.tags[0];
    const categoryName = tag ? tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'General';

    for (const user of users) {
      // Create in-app notification
      await Notification.create({
        recipient: user._id,
        sender: query.createdBy,
        type: 'tag',
        title: 'Tagged in a Query',
        message: `You were tagged in a new query: "${query.title}" in the ${categoryName} category!`,
        link: '/community'
      }).catch(err => console.error('Failed to create in-app notification:', err));

      if (!user.email || user.emailNotifications === false) continue;

      console.log(`[Tagging Notification] Sending email notification to tagged contributor: ${user.email}`);
      await sendEmail({
        to: user.email,
        subject: `🔔 You were tagged in a new query: "${query.title}"`,
        text: `Hi ${user.name},\n\nYou have been tagged in a new query in the "${categoryName}" category because you are an active responder in this topic!\n\nQuery Title: "${query.title}"\n\nView community board → ${queryUrl}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <div style="background: #4f46e5; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">🔔 Tagged in Community Query</h2>
            </div>
            <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">Hi ${user.name},</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">You have been tagged in a new query under the <strong>${categoryName}</strong> category because you are one of our top active responders!</p>
              <p style="margin: 16px 0; font-size: 16px; font-weight: 600; color: #111827;">"${query.title}"</p>
              <a href="${queryUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500;">
                View Query →
              </a>
              <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
                You are receiving this notification because you were tagged by a user and have email notifications enabled.
              </p>
            </div>
          </div>`
      });
    }
  } catch (err) {
    console.error('Failed to notify tagged users:', err);
  }
};

module.exports = { notifyTieredContributors, notifyAdminsOfEscalatedQuery, notifyTaggedUsers };
