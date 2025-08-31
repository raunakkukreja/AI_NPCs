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
      fetch(`/npcs/${subject.id}.json`)
        .then((r) => {
          if (!r.ok) throw new Error("Not found");
          return r.json();
        })
        .then((j) => setProfile(j))
        .catch(() => setProfile({ id: subject.id, name: subject.id, role: "Unknown", personality: "—", goals: [], knowledge: [], greeting_seed: "" }))
        .finally(() => setLoading(false));
    } else if (subject.type === "area") {
      const areaHints = {
        royal_court: { id: 'royal_court', name: 'Royal Court', role: 'Restricted Area', personality: '', goals: [], knowledge: [], greeting_seed: 'Access is denied for now. Enter to know more.' },
        flea_market: { id: 'flea_market', name: 'Flea Market', role: 'Marketplace', greeting_seed: 'A bustling market — merchants and rumors.' },
        ruin: { id: 'ruin', name: 'Old Ruin', role: 'Ruins', greeting_seed: 'A quiet ruin. People say Helios visits here.' },
        fountain: { id: 'fountain', name: 'Central Fountain', role: 'Landmark', greeting_seed: 'A sparkling fountain — perfect for listening to gossip.' },
        helios_shop: { id: 'helios_shop', name: "Helios' Shop", role: 'Shop', greeting_seed: 'Helios sometimes sits here, trading information for favors.' }
      };
      setProfile(areaHints[subject.id] || { id: subject.id, name: subject.id, greeting_seed: '' });
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
          {profile.personality && <p><strong>Personality:</strong> {profile.personality}</p>}
          {profile.greeting_seed && <blockquote style={{color:'#ddd'}}>{profile.greeting_seed}</blockquote>}
          {profile.goals && profile.goals.length>0 && (
            <>
              <h4>Goals</h4>
              <ul>{profile.goals.map((g,i)=><li key={i}>{g}</li>)}</ul>
            </>
          )}
          {profile.knowledge && profile.knowledge.length>0 && (
            <>
              <h4>Knowledge</h4>
              <ul>{profile.knowledge.map((k,i)=><li key={i}>{k}</li>)}</ul>
            </>
          )}
        </>
      ) : (
        <p>No info</p>
      )}
    </div>
  );
}

