const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Airtable config
const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const REVIEW_TABLE_ID = process.env.AIRTABLE_REVIEWS_TABLE;
const USER_TABLE_ID = process.env.AIRTABLE_USERS_TABLE;

app.use(cors());

// GET /api/reviews — all reviews sorted by most recent
app.get('/api/reviews', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${REVIEW_TABLE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: {
          maxRecords: 100,
          sort: [{ field: 'Date_Added', direction: 'desc' }],
        },
      }
    );

    res.json(response.data.records);
  } catch (error) {
    console.error('Fetch reviews failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// GET /api/top-reviewers?period=weekly|monthly
app.get('/api/top-reviewers', async (req, res) => {
  const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
  const now = new Date();
  const cutoff = new Date(
    period === 'monthly'
      ? now.setDate(now.getDate() - 30)
      : now.setDate(now.getDate() - 7)
  );

  try {
    // Fetch all user profiles first
    const userRes = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${USER_TABLE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: { maxRecords: 100 },
      }
    );

    // Create a lookup map of users by Airtable record ID
    const usersById = {};
    for (const user of userRes.data.records) {
      const id = user.id;
      const name = user.fields?.Name || 'Unknown';
      const username = user.fields?.Username || 'unknown';
      usersById[id] = { name, username };
    }

    // Fetch reviews
    const reviewRes = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${REVIEW_TABLE_ID}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: {
          maxRecords: 100,
          sort: [{ field: 'Date_Added', direction: 'desc' }],
        },
      }
    );

    // Filter recent reviews
    const recent = reviewRes.data.records.filter((rec) => {
      const date = rec.fields?.Date_Added;
      return date && !isNaN(new Date(date)) && new Date(date) >= cutoff;
    });

    // Count per user
    const countMap = {};
    for (const rec of recent) {
      const creatorIds = rec.fields?.['ID (from Creator)'];
      const userId = Array.isArray(creatorIds) ? creatorIds[0] : creatorIds;

      if (!userId || !usersById[userId]) continue;

      const { name, username } = usersById[userId];

      if (!countMap[userId]) {
        countMap[userId] = {
          id: userId,
          name,
          username,
          count: 1,
        };
      } else {
        countMap[userId].count++;
      }
    }

    const topUsers = Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // optional, remove if you want all reviewers

    res.json(topUsers);
  } catch (error) {
    console.error('Top reviewers fetch failed:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to calculate leaderboard.' });
  }
});
