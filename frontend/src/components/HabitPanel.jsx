import React, { useEffect, useState } from 'react';
import { getHabits } from '../api';

export default function HabitPanel() {
  const [habits, setHabits] = useState({ steps: 0, npcs_interacted: [], areas_interacted: [] });

  useEffect(() => {
    getHabits().then(setHabits);
  }, []);

  useEffect(() => {
    if (habits.steps >= 200) alert('Task completed: Steps!');
    if (habits.npcs_interacted.length >= 2) alert('Task completed: NPCs!');
    if (habits.areas_interacted.length >= 2) alert('Task completed: Areas!');
  }, [habits]);

  return (
    <div style={{
    background: '#fff',
    color: '#971a1aff',
    zIndex: 99999,
    position: 'absolute',
    top: 20,
    left: 20,
    padding: '20px',
    border: '2px solid red'
  }}>
      <div>TEST PANEL</div>
      <div>Steps: {habits.steps}/200</div>
      <div>NPCs Interacted: {habits.npcs_interacted.length}/2</div>
      <div>Areas Interacted: {habits.areas_interacted.length}/2</div>
    </div>
  );
}