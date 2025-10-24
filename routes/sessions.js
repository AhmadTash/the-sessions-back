const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const auth = require("../middleware/auth");
const { getIO } = require("../socket");

// Get all sessions (from both users)
router.get("/", auth, async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 }); // Newest first
    res.json(sessions);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get sessions for current user only
router.get("/my-sessions", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.userId })
      .populate("user", "username profilePic")
      .sort({ createdAt: -1 }); // Newest first, same as '/'
    res.json(sessions);
  } catch (error) {
    console.error("Get my sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new session
router.post("/", auth, async (req, res) => {
  try {
    const { date, time, rating, description } = req.body;

    // Validate input
    if (!date || !time || !rating || !description) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const session = new Session({
      user: req.userId,
      date,
      time,
      rating,
      description,
    });

    await session.save();
    await session.populate("user", "username profilePic");

    // Emit new session event to all connected clients
    getIO().emit("newSession", session);

    res.status(201).json(session);
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a session
router.put("/:id", auth, async (req, res) => {
  try {
    const { date, time, rating, description } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user owns this session
    if (session.user.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this session" });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Update fields
    if (date) session.date = date;
    if (time) session.time = time;
    if (rating) session.rating = rating;
    if (description) session.description = description;

    await session.save();
    await session.populate("user", "username profilePic");

    // Emit session updated event to all connected clients
    getIO().emit("sessionUpdated", session);

    res.json(session);
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a session
router.delete("/:id", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user owns this session
    if (session.user.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this session" });
    }

    await Session.findByIdAndDelete(req.params.id);

    // Emit session deleted event to all connected clients
    getIO().emit("sessionDeleted", { id: req.params.id });

    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
