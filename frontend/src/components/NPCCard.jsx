// frontend/src/components/NPCCard.jsx
import React, { useEffect, useState } from "react";

export default function NPCCard({ subject }) {
  // subject can be: null | { type: 'npc', id: 'helios' } | { type: 'area', id: 'market' }
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subject) { setProfile(null); return; }
    if (subject.type === "npc" && subject.id) {
      setLoading(true);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      fetch(`/api/npc/${subject.id}/profile`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'max-age=300' }
      })
        .then((r) => {
          clearTimeout(timeoutId);
          if (!r.ok) throw new Error("Not found");
          return r.json();
        })
        .then((j) => setProfile(j))
        .catch(() => setProfile({ id: subject.id, name: subject.id, role: "Unknown", personality: "—", goals: [], knowledge: [], greeting_seed: "" }))
        .finally(() => setLoading(false));
    } else if (subject.type === "area" || subject.type === "building") {
      const areaHints = {
        royal_court: { id: 'royal_court', name: 'The Royal Court', role: 'Government Building', description: 'A bastion of order and law, the grand Royal Court stands as a symbol of the city\'s enduring power. Its ornate tiled plaza is patrolled by loyal guards, and its marble halls dispense the crown\'s justice. Yet, whispers in the market and the weary expressions of the guards themselves suggest that its principles may be more flexible than the stone from which it is built.' },
        fountain: { id: 'fountain', name: 'The Fountain of Elders', role: 'Landmark', description: 'The true center of the market square. All paths lead to this sculpted fountain, where water has flowed for generations. It is a natural meeting point for merchants, travelers, and locals alike—a place to rest one\'s feet, to see and be seen, and to listen to the undercurrent of gossip that flows as steadily as the water itself.' },
        old_ruin_1: { id: 'old_ruin_1', name: 'The Old Ruin', role: 'Historical Site', description: 'Standing as a grim monument on the edge of the market, these crumbling stones are all that remain of the old senate building, destroyed in the devastating "Senators\' Affair" that led to a bloody revolt years ago. The city tries to forget the tragedy, leaving the ruins overgrown and silent—a place of hushed secrets and a stark warning against challenging the court.' },
        old_ruin_2: { id: 'old_ruin_2', name: 'The Old Ruin', role: 'Historical Site', description: 'Standing as a grim monument on the edge of the market, these crumbling stones are all that remain of the old senate building, destroyed in the devastating "Senators\' Affair" that led to a bloody revolt years ago. The city tries to forget the tragedy, leaving the ruins overgrown and silent—a place of hushed secrets and a stark warning against challenging the court.' },
        desmos_inn: { id: 'desmos_inn', name: 'The Desmos Inn', role: 'Tavern', description: 'What was once a humble eatery owned by a foster family has been transformed by Robert Desmos into the city\'s most popular tavern. The Inn is more than a place for drink; it is the city\'s living memory. Every patron leaves a story behind, and Robert, the quiet keeper of these tales, forgets nothing.' },
        garden: { id: 'garden', name: 'The Garden', role: 'Park', description: 'A peaceful garden where locals come to rest and reflect.' },
        moachivitis_market: { id: 'moachivitis_market', name: 'The Moachivitis Market', role: 'Marketplace', description: 'The vibrant heart and soul of the city, built upon the agricultural wealth of the Moachivitis family. The air is thick with the scent of spices and the sound of a hundred conversations. Stalls overflow with goods from every corner of the land, and it is said that anything—or anyone—can be found here if one knows who to ask.' }
      };
      // Use description from subject if available, otherwise use area hints
      if (subject.description) {
        setProfile({ id: subject.id, name: subject.label || subject.id, role: 'Location', description: subject.description });
      } else {
        setProfile(areaHints[subject.id] || { id: subject.id, name: subject.id, description: '' });
      }
    } else {
      setProfile(null);
    }
  }, [subject]);

  if (!subject) {
    return (
      <div className="ui-panel">
        <h2>Living Worlds — Prototype</h2>
        <p>Move & interact with NPCs. Press X to interact.</p>
      </div>
    );
  }

  return (
    <div className="ui-panel">
      {loading ? <p>Loading...</p> : null}
      {profile ? (
        <>
          <h2>{profile.name || profile.id}</h2>
          <p><em>{profile.role}</em></p>
          {profile.description && <div style={{marginBottom:'16px', lineHeight:'1.4', color:'#e2e8f0'}}>{profile.description}</div>}
        </>
      ) : (
        <p>No info</p>
      )}
    </div>
  );
}

