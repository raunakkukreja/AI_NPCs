const fs = require('fs');
const path = require('path');
const habitsPath = path.join(__dirname, '../data/player_habits.json');

function readHabits() {
  return JSON.parse(fs.readFileSync(habitsPath));
}

function writeHabits(habits) {
  fs.writeFileSync(habitsPath, JSON.stringify(habits, null, 2));
}

exports.getHabits = (req, res) => {
  res.json(readHabits());
};

exports.addSteps = (req, res) => {
  const { steps } = req.body;
  const habits = readHabits();
  habits.steps += steps;
  writeHabits(habits);
  res.json(habits);
};

exports.interactNPC = (req, res) => {
  const { npc } = req.body;
  const habits = readHabits();
  if (!habits.npcs_interacted.includes(npc)) habits.npcs_interacted.push(npc);
  writeHabits(habits);
  res.json(habits);
};

exports.interactArea = (req, res) => {
  const { area } = req.body;
  const habits = readHabits();
  if (!habits.areas_interacted.includes(area)) habits.areas_interacted.push(area);
  writeHabits(habits);
  res.json(habits);
};