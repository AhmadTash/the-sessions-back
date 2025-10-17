const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    // Visit Information
    path: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // User Agent & Device Info
    userAgent: String,
    deviceType: String, // 'mobile', 'tablet', 'desktop'
    browser: String,
    os: String,

    // Location Info (from IP)
    ip: String,
    country: String,
    city: String,

    // Page Info
    referrer: String,
    language: String,
    screenResolution: String,

    // Session Info
    sessionId: String, // To track unique sessions
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
analyticsSchema.index({ timestamp: -1 });
analyticsSchema.index({ path: 1 });
analyticsSchema.index({ country: 1 });
analyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
