// frontend/src/components/MapView.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./../styles.css";

const INITIAL_CHARACTERS = [
  { id: "player", name: "Nico", type: "player", pos: [400, 300] }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpPos(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
function dist(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]); }

export default function MapView({ onTalkRequest }) {
  const containerRef = useRef(null);
  const [entities, setEntities] = useState(() => INITIAL_CHARACTERS);
  const [playerIdx] = useState(0);
  const playerSpeed = 220;
  const keys = useRef({});
  const lastTimeRef = useRef(performance.now());
  const [mapCoordinates, setMapCoordinates] = useState([]);

  useEffect(() => {
    fetch('map_coordinates.json')
      .then(res => res.json())
      .then(data => setMapCoordinates(data))
      .catch(err => console.error('Failed to load map coordinates:', err));
  }, []);

  const updateEntityPos = useCallback((id, pos) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, pos } : e));
  }, []);

  useEffect(() => {
    let raf = null;
    function tick(now) {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      
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
          pos[0] = Math.min(Math.max(10, pos[0]), 800 - 10);
          pos[1] = Math.min(Math.max(10, pos[1]), 600 - 10);
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
    }
    function onKeyUp(e) { keys.current[e.code] = false; }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return ()=>{ window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <img
        src="map.jpg"
        alt="Map"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          zIndex: 0
        }}
      />

      <svg style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        {mapCoordinates.layers?.[0]?.objects?.filter(obj => obj.polygon).map((area, i) => {
          const points = area.polygon.map(p => `${(area.x + p.x) * 0.3},${(area.y + p.y) * 0.3}`).join(' ');
          return (
            <g key={i}>
              <polygon
                points={points}
                fill="rgba(0,255,0,0.15)"
                stroke="rgba(0,255,0,0.5)"
                strokeWidth="1"
              />
              <text
                x={(area.x + 10) * 0.3}
                y={(area.y - 5) * 0.3}
                fill="white"
                fontSize="10"
                fontWeight="bold"
              >
                {area.name}
              </text>
            </g>
          );
        })}
        {mapCoordinates.layers?.[0]?.objects?.filter(obj => obj.point).map((point, i) => (
          <circle
            key={`point-${i}`}
            cx={point.x * 0.3}
            cy={point.y * 0.3}
            r="3"
            fill="rgba(255,255,0,0.8)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {entities.map(ent => {
        const size = 36;
        const initials = ent.name ? ent.name.split(" ").map(s=>s[0]).slice(0,2).join("") : ent.id.slice(0,2);
        return (
          <div
            key={ent.id}
            title={ent.name}
            style={{
              left: ent.pos[0] - size/2,
              top: ent.pos[1] - size/2,
              width: size, height: size,
              background: "#9ae6b4",
              border: "2px solid #0f1724",
              position: "absolute",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 40
            }}
          >
            <div style={{fontSize:12, fontWeight:700, color: "#061014"}}>{initials}</div>
          </div>
        );
      })}
    </div>
  );
}