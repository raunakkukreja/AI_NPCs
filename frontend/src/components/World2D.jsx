// frontend/src/components/World2D.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./../styles.css";

/* constants & helpers */
const WORLD_W = 2000;
const WORLD_H = 1200;

const AREAS = [
  { id: 'flea_market', x: 340, y: 460, w: 240, h: 140, label: 'Flea Market' },
  { id: 'royal_court', x: 1050, y: 150, w: 240, h: 80, label: 'Royal Court' },
  { id: 'ruin', x: 160, y: 280, w: 140, h: 120, label: 'Old Ruin' },
  { id: 'fountain', x: 520, y: 560, w: 120, h: 120, label: 'Central Fountain' },
  { id: 'helios_shop', x: 200, y: 300, w: 80, h: 60, label: "Helios' Shop" }
];

const INITIAL_CHARACTERS = [
  { id: "player", name: "Nico", type: "player", pos: [300, 500] },
  { id: "moody_old_man", name: "Dorian", type: "npc", pos: [500, 480], color: "#FF8C42",
    path: [[500,480],[520,430],[470,420],[500,480]], speed: 20 },
  { id: "helios", name: "Helios", type: "npc", pos: [200, 300], color: "#7CFC00",
    path: [[200,300],[260,300],[260,350],[200,350]], speed: 28 },
  { id: "merchant", name: "Merek", type: "npc", pos: [800, 520], color: "#1E90FF",
    path: [[800,520],[820,560],[780,560],[800,520]], speed: 16 },
  { id: "guard", name: "Erebus", type: "npc", pos: [1100, 200], color: "#FFD700",
    path: [[1100,200],[1100,300],[1200,300],[1200,200]], speed: 30 }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpPos(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
function dist(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]); }

export default function World2D({ onTalkRequest }) {
  const containerRef = useRef(null);
  const [entities, setEntities] = useState(() => INITIAL_CHARACTERS);
  const [playerIdx] = useState(0);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const playerSpeed = 220;
  const keys = useRef({});
  const lastTimeRef = useRef(performance.now());
  const [nearest, setNearest] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [mapSize] = useState({ w: 180, h: 110 });

  const updateEntityPos = useCallback((id, pos) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, pos } : e));
  }, []);

  useEffect(() => {
    let raf = null;
    function tick(now) {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      setEntities(prev => {
        const next = prev.map(ent => {
          if (ent.type !== 'npc' || !ent.path || ent.path.length < 2) return ent;
          const meta = ent._meta || { idx: 0, t: 0 };
          const p0 = ent.path[meta.idx];
          const p1 = ent.path[(meta.idx+1) % ent.path.length];
          const segDist = dist(p0,p1);
          const speed = ent.speed || 20;
          let advance = (speed * dt);
          let t = meta.t + (advance / Math.max(1,segDist));
          let idx = meta.idx;
          while (t >= 1.0) {
            t -= 1.0;
            idx = (idx + 1) % ent.path.length;
          }
          const newPos = lerpPos(ent.path[idx], ent.path[(idx+1)%ent.path.length], t);
          return { ...ent, pos: newPos, _meta: { idx, t } };
        });
        return next;
      });

      setEntities(prev => {
        const next = prev.map((ent, i) => {
          if (i !== playerIdx) return ent;
          const pos = ent.pos.slice();
          let dx = 0, dy = 0;
          if (keys.current['KeyW'] || keys.current['ArrowUp']) dy -= 1;
          if (keys.current['KeyS'] || keys.current['ArrowDown']) dy += 1;
          if (keys.current['KeyA'] || keys.current['ArrowLeft']) dx -= 1;
          if (keys.current['KeyD'] || keys.current['ArrowRight']) dx += 1;
          if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx,dy) || 1;
            const move = (playerSpeed * dt);
            pos[0] += (dx/len) * move;
            pos[1] += (dy/len) * move;
          }
          // clamp inside world bounds
          pos[0] = Math.min(Math.max(10, pos[0]), WORLD_W - 10);
          pos[1] = Math.min(Math.max(10, pos[1]), WORLD_H - 10);
          return { ...ent, pos };
        });
        return next;
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerIdx, updateEntityPos, playerSpeed]);

  useEffect(() => {
    function onKeyDown(e) {
      keys.current[e.code] = true;
      if (e.code === "KeyX") {
        const p = entities[playerIdx].pos;
        let nearestEnt = null, best = Infinity;
        entities.forEach(ent => {
          if (ent.type !== 'npc') return;
          const d = dist(ent.pos, p);
          if (d < best) { best = d; nearestEnt = ent; }
        });
        if (nearestEnt && best <= 90) {
          onTalkRequest && onTalkRequest(nearestEnt.id);
          return;
        }
        // if no NPC, check nearest area
        const nearestArea = AREAS.find(ar => {
          const center = [ar.x + ar.w/2, ar.y + ar.h/2];
          return dist(center, p) <= 120;
        });
        if (nearestArea) {
          onTalkRequest && onTalkRequest({ type:'area', id: nearestArea.id });
          return;
        }
        setHintVisible(true);
        setTimeout(()=>setHintVisible(false), 900);
      }
    }
    function onKeyUp(e) { keys.current[e.code] = false; }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return ()=>{ window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [entities, playerIdx, onTalkRequest]);

  useEffect(() => {
    const id = setInterval(()=> {
      const player = entities[playerIdx];
      if (!player) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const panel = document.querySelector(".ui-panel");
      const panelWidth = panel ? panel.getBoundingClientRect().width : 0;
      const availableWidth = Math.max(200, rect.width - panelWidth);
      const halfW = availableWidth / 2;
      const halfH = rect.height / 2;
      const maxX = Math.max(0, WORLD_W - availableWidth);
      const maxY = Math.max(0, WORLD_H - rect.height);
      const camX = Math.min(Math.max(0, player.pos[0] - halfW), maxX);
      const camY = Math.min(Math.max(0, player.pos[1] - halfH), maxY);
      setCamera({ x: camX, y: camY });
    }, 60);
    return ()=>clearInterval(id);
  }, [entities, playerIdx]);

  useEffect(()=> {
    const p = entities[playerIdx]?.pos;
    if (!p) return;
    let best = null, bestD = Infinity;
    entities.forEach(ent => {
      if (ent.type !== 'npc') return;
      const d = dist(ent.pos, p);
      if (d < bestD) { bestD = d; best = ent; }
    });
    if (best) {
      const container = containerRef.current;
      const screenX = best.pos[0] - camera.x;
      const screenY = best.pos[1] - camera.y;
      setNearest({ id: best.id, dist: bestD, screen: [screenX, screenY] });
    } else setNearest(null);
  }, [entities, camera, playerIdx]);

  const worldToScreen = (pos) => [ pos[0] - camera.x, pos[1] - camera.y ];

  const onNpcClick = (id) => {
    const ent = entities.find(e=>e.id===id);
    const p = entities[playerIdx].pos;
    if (ent && dist(ent.pos, p) <= 90) {
      onTalkRequest && onTalkRequest(id);
    } else {
      const nearestArea = AREAS.find(ar => {
        const center = [ar.x + ar.w/2, ar.y + ar.h/2];
        return dist(center, p) <= 120;
      });
      if (nearestArea) {
        onTalkRequest && onTalkRequest({ type:'area', id: nearestArea.id });
        return;
      }
      setHintVisible(true);
      setTimeout(()=>setHintVisible(false), 800);
    }
  };

  return (
    <div className="world2d-root" style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <div ref={containerRef} className="world2d-viewport">
        <div className="world2d-inner" style={{
          width: WORLD_W, height: WORLD_H,
          transform: `translate(${-camera.x}px, ${-camera.y}px)`,
          position: 'absolute', left:0, top:0
        }}>

          {/* Render area rectangles */}
          {AREAS.map(a => (
            <div key={a.id}
                 style={{
                   position: 'absolute',
                   left: a.x,
                   top: a.y,
                   width: a.w,
                   height: a.h,
                   borderRadius: 6,
                   background: 'rgba(255,255,255,0.02)',
                   border: '1px dashed rgba(255,255,255,0.03)',
                   zIndex: 10
                 }}>
              <div style={{position:'absolute', left:6, top:6, color:'#ddd', fontSize:12}}>{a.label}</div>
            </div>
          ))}

          {/* NPCs + Player */}
          {entities.map(ent => {
            const screen = worldToScreen(ent.pos);
            const isPlayer = ent.type === 'player';
            const glow = !isPlayer && nearest && nearest.id === ent.id && nearest.dist <= 90;
            const size = isPlayer ? 36 : 34;
            const initials = ent.name ? ent.name.split(" ").map(s=>s[0]).slice(0,2).join("") : ent.id.slice(0,2);
            return (
              <div
                key={ent.id}
                onClick={() => !isPlayer && onNpcClick(ent.id)}
                title={ent.name}
                className={`world-entity ${isPlayer ? 'player-entity' : 'npc-entity'}`}
                style={{
                  left: screen[0] - size/2,
                  top: screen[1] - size/2,
                  width: size, height: size,
                  background: ent.color || (isPlayer ? "#9ae6b4" : "#ccc"),
                  boxShadow: glow ? "0 0 18px 6px rgba(255,215,0,0.25)" : "none",
                  border: isPlayer ? "2px solid #0f1724" : "1px solid rgba(0,0,0,0.2)"
                }}
              >
                <div style={{fontSize:12, fontWeight:700}}>{initials}</div>
              </div>
            );
          })}
        </div>
      </div>

      {nearest && nearest.dist <= 90 && (
        <div className="world-hint" style={{ left: (nearest.screen[0]) + 'px', top: (nearest.screen[1]-50)+'px' }}>
          Press <strong>X</strong> to interact
        </div>
      )}
      {hintVisible && <div className="world-hint-temp">Move closer to interact</div>}

      <div className="minimap" style={{ width: mapSize.w, height: mapSize.h }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>
          <rect x="0" y="0" width={WORLD_W} height={WORLD_H} fill="#071022" opacity="0.4" />
          <circle cx="1100" cy="200" r="18" fill="#7c3aed" opacity="0.8" />
          {entities.map(ent => {
            const color = ent.type === 'player' ? "#00ff9d" : (ent.color || "#cccccc");
            return <circle key={ent.id} cx={ent.pos[0]} cy={ent.pos[1]} r={6} fill={color} />;
          })}
        </svg>
      </div>
    </div>
  );
}
