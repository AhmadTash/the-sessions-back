const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const auth = require('../middleware/auth');

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|blackberry|opera mini|windows phone/i.test(userAgent)) {
    deviceType = 'mobile';
  }
  
  // Browser
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Helper to get IP info (basic implementation)
const getIpInfo = (ip) => {
  // In a real implementation, you might use a service like ipapi.co or maxmind
  // For now, we'll return basic info
  return {
    country: 'Unknown',
    city: 'Unknown'
  };
};

// Track a page visit
router.post('/track', async (req, res) => {
  try {
    const {
      path,
      referrer,
      language,
      screenResolution,
      sessionId,
      userId
    } = req.body;
    
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Parse user agent
    const { deviceType, browser, os } = parseUserAgent(userAgent);
    
    // Get IP info (you can integrate with ipapi.co or similar for real geolocation)
    const ipInfo = getIpInfo(ip);
    
    // Create analytics entry
    const analyticsEntry = new Analytics({
      path,
      userAgent,
      deviceType,
      browser,
      os,
      ip,
      country: ipInfo.country,
      city: ipInfo.city,
      referrer,
      language,
      screenResolution,
      sessionId,
      userId: userId || null
    });
    
    await analyticsEntry.save();
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Don't fail the request if analytics fails
    res.status(200).json({ success: false });
  }
});

// Get analytics data (protected route - only for admins)
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // Build query
    const query = {};
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Get various statistics
    const [
      totalVisits,
      uniqueSessions,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      topPages,
      recentVisits
    ] = await Promise.all([
      // Total visits
      Analytics.countDocuments(query),
      
      // Unique sessions
      Analytics.distinct('sessionId', query).then(sessions => sessions.length),
      
      // Device breakdown
      Analytics.aggregate([
        { $match: query },
        { $group: { _id: '$deviceType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Browser breakdown
      Analytics.aggregate([
        { $match: query },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Country breakdown
      Analytics.aggregate([
        { $match: query },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Top pages
      Analytics.aggregate([
        { $match: query },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Recent visits
      Analytics.find(query)
        .sort({ timestamp: -1 })
        .limit(50)
        .select('path timestamp deviceType browser os country city')
    ]);
    
    res.json({
      totalVisits,
      uniqueSessions,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
      topPages,
      recentVisits
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get visit trends over time
router.get('/trends', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const trends = await Analytics.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

module.exports = router;
