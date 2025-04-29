const fs = require('fs');
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const redis = require('redis');

const Goal = require('./models/goal');

const app = express();

// Configuration Redis
const client = redis.createClient({
  socket: {
    host: 'rediservice',  // Le nom du service Redis si tu es dans Kubernetes, sinon 'localhost'
    port: 6379,
  }
});

client.on('error', (err) => console.error('Redis Client Error', err));

// Connexion Redis
async function connectRedis() {
  await client.connect();
}
connectRedis();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// GET /goals
app.get('/goals', async (req, res) => {
  console.log('TRYING TO FETCH GOALS!');
  try {
    // Essayer d'abord de récupérer depuis Redis
    const cachedGoals = await client.get('goals');

    if (cachedGoals) {
      console.log('FETCHED GOALS FROM REDIS');
      return res.status(200).json({ goals: JSON.parse(cachedGoals) });
    }

    // Sinon récupérer depuis MongoDB
    const goals = await Goal.find();
    const goalsData = goals.map((goal) => ({
      id: goal.id,
      text: goal.text,
    }));

    // Stocker dans Redis pour 1h (3600 secondes)
    await client.setEx('goals', 3600, JSON.stringify(goalsData));

    console.log('FETCHED GOALS FROM MONGODB');
    res.status(200).json({ goals: goalsData });
  } catch (err) {
    console.error('ERROR FETCHING GOALS');
    console.error(err.message);
    res.status(500).json({ message: 'Failed to load goals.' });
  }
});

// POST /goals
app.post('/goals', async (req, res) => {
  console.log('TRYING TO STORE GOAL');
  const goalText = req.body.text;

  if (!goalText || goalText.trim().length === 0) {
    console.log('INVALID INPUT - NO TEXT');
    return res.status(422).json({ message: 'Invalid goal text.' });
  }

  const goal = new Goal({
    text: goalText,
  });

  try {
    await goal.save();

    // Invalider le cache après création
    await client.del('goals');

    res.status(201).json({ message: 'Goal saved', goal: { id: goal.id, text: goalText } });
    console.log('STORED NEW GOAL');
  } catch (err) {
    console.error('ERROR SAVING GOAL');
    console.error(err.message);
    res.status(500).json({ message: 'Failed to save goal.' });
  }
});

// DELETE /goals/:id
app.delete('/goals/:id', async (req, res) => {
  console.log('TRYING TO DELETE GOAL');
  try {
    await Goal.deleteOne({ _id: req.params.id });

    // Invalider le cache après suppression
    await client.del('goals');

    res.status(200).json({ message: 'Deleted goal!' });
    console.log('DELETED GOAL');
  } catch (err) {
    console.error('ERROR DELETING GOAL');
    console.error(err.message);
    res.status(500).json({ message: 'Failed to delete goal.' });
  }
});

// Connexion MongoDB
mongoose.connect(
  `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_NAME}?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB');
      console.error(err);
    } else {
      console.log('CONNECTED TO MONGODB!!');
      app.listen(80);
    }
  }
);
