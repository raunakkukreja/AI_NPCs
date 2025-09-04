// frontend/src/components/World2DMap.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./../styles.css";

/* constants & helpers */
const MAP_W = 2816; // actual map width
const MAP_H = 1536; // actual map height
const SCREEN_W = window.innerWidth;
const SCREEN_H = window.innerHeight;

const INITIAL_CHARACTERS = [
  { id: "player", name: "Nico", type: "player", pos: [MAP_W/2, MAP_H/2] },
  { id: "guard", name: "Palace Guard", type: "npc", pos: [1049, 529], 
    path: [[1049, 529], [1680, 525]], speed: 50, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "thief", name: "Thief", type: "npc", pos: [1050, 718],
    path: [[1050, 718], [1249, 720], [1531, 751], [1692, 631]], speed: 40, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "merchant", name: "Merchant", type: "npc", pos: [1486, 816],
    bounds: { minX: 1486, minY: 816, maxX: 2554, maxY: 1500 }, speed: 60, _meta: { target: null, changeTime: 0 } },
  { id: "old_man", name: "Old Man", type: "npc", pos: [288, 446],
    path: [[288, 446], [918, 506], [1103, 521]], speed: 25, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "guard2", name: "Royal Guard", type: "npc", pos: [1372, 502],
    path: [[1372, 502], [1374, 924]], speed: 50, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "bartender", name: "Bartender", type: "npc", pos: [2396, 258],
    path: [[2396, 258], [2666, 278], [2620, 272], [2642, 1074], [1474, 1204], [2646, 1318]], speed: 45, _meta: { idx: 0, t: 0, pauseUntil: 0 } }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpPos(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
function dist(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]); }

export default function World2DMap({ onTalkRequest, pausedNPCId }) {
  const containerRef = useRef(null);
  const [entities, setEntities] = useState(() => INITIAL_CHARACTERS);
  const [playerIdx] = useState(0);
  const playerSpeed = 220;
  const keys = useRef({});
  const lastTimeRef = useRef(performance.now());
  const [mapCoordinates, setMapCoordinates] = useState([]);
  const [cameraPos, setCameraPos] = useState([0, 0]);
  const [nearestPoint, setNearestPoint] = useState(null);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [nearestBuilding, setNearestBuilding] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawEnd, setDrawEnd] = useState(null);
  const [drawnRect, setDrawnRect] = useState(null);

  // Load map coordinates
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
          // Pause NPC if chatting
          if (ent.type === 'npc' && ent.id === pausedNPCId) {
            return ent;
          }
          
          if (ent.type === 'npc' && ent.path && ent.path.length >= 2) {
            const meta = ent._meta || { idx: 0, t: 0, pauseUntil: 0 };
            
            if (now < meta.pauseUntil) {
              return { ...ent, _meta: meta };
            }
            
            const p0 = ent.path[meta.idx];
            const p1 = ent.path[(meta.idx + 1) % ent.path.length];
            const segDist = dist(p0, p1);
            const speed = ent.speed || 50;
            let advance = (speed * dt);
            let t = meta.t + (advance / Math.max(1, segDist));
            let idx = meta.idx;
            let pauseUntil = meta.pauseUntil;
            
            while (t >= 1.0) {
              t -= 1.0;
              idx = (idx + 1) % ent.path.length;
              pauseUntil = now + 5000;
            }
            
            const newPos = lerpPos(ent.path[idx], ent.path[(idx + 1) % ent.path.length], t);
            return { ...ent, pos: newPos, _meta: { idx, t, pauseUntil } };
          }
          
          if (ent.type === 'npc' && ent.bounds) {
            const meta = ent._meta || { target: null, changeTime: 0 };
            const speed = ent.speed || 30;
            
            if (!meta.target || now > meta.changeTime) {
              const newTarget = [
                meta.target ? ent.pos[0] + (Math.random() - 0.5) * 400 : ent.pos[0],
                meta.target ? ent.pos[1] + (Math.random() - 0.5) * 400 : ent.pos[1]
              ];
              newTarget[0] = Math.max(ent.bounds.minX, Math.min(newTarget[0], ent.bounds.maxX));
              newTarget[1] = Math.max(ent.bounds.minY, Math.min(newTarget[1], ent.bounds.maxY));
              meta.target = newTarget;
              meta.changeTime = now + 2000 + Math.random() * 3000;
            }
            
            const targetDist = dist(ent.pos, meta.target);
            if (targetDist > 5) {
              const dx = (meta.target[0] - ent.pos[0]) / targetDist;
              const dy = (meta.target[1] - ent.pos[1]) / targetDist;
              const newPos = [
                ent.pos[0] + dx * speed * dt,
                ent.pos[1] + dy * speed * dt
              ];
              return { ...ent, pos: newPos, _meta: meta };
            }
            return { ...ent, _meta: meta };
          }
          
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
          pos[0] = Math.min(Math.max(10, pos[0]), MAP_W - 10);
          pos[1] = Math.min(Math.max(10, pos[1]), MAP_H - 10);
          return { ...ent, pos };
        });
        return next;
      });

      // Update camera and check nearest points
      setEntities(current => {
        const player = current[playerIdx];
        if (player) {
          const container = containerRef.current;
          const screenW = container ? container.offsetWidth : window.innerWidth;
          const screenH = container ? container.offsetHeight : window.innerHeight;
          const newCameraX = Math.max(0, Math.min(player.pos[0] - screenW/2, MAP_W - screenW));
          const newCameraY = Math.max(0, Math.min(player.pos[1] - screenH/2, MAP_H - screenH));
          setCameraPos([newCameraX, newCameraY]);
          
          // Find nearest point
          const points = mapCoordinates.layers?.[0]?.objects?.filter(obj => obj.point) || [];
          let nearest = null;
          let minDist = Infinity;
          
          points.forEach(point => {
            const distance = dist([player.pos[0], player.pos[1]], [point.x, point.y]);
            if (distance < 80 && distance < minDist) {
              minDist = distance;
              nearest = point;
            }
          });
          
          setNearestPoint(nearest);
          
          // Find nearest building marker
          const buildings = [
            { x: 1147, y: 700, label: 'Old Ruin 1' },
            { x: 1621, y: 700, label: 'Old Ruin 2' },
            { x: 958, y: 1036, label: 'Fountain' },
            { x: 970, y: 1106, label: 'Fountain' },
            { x: 1369, y: 437, label: 'Royal Court' },
            { x: 2424, y: 230, label: 'Bartender House' }
          ];
          let nearestBldg = null;
          let minBldgDist = Infinity;
          
          buildings.forEach(building => {
            const distance = dist([player.pos[0], player.pos[1]], [building.x, building.y]);
            if (distance < 80 && distance < minBldgDist) {
              minBldgDist = distance;
              nearestBldg = building;
            }
          });
          
          setNearestBuilding(nearestBldg);
        }
        return current;
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerIdx, updateEntityPos, playerSpeed, pausedNPCId]);

  useEffect(() => {
    function onKeyDown(e) {
      keys.current[e.code] = true;
    }
    function onKeyUp(e) { keys.current[e.code] = false; }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return ()=>{ window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  const handleDoubleClick = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + cameraPos[0];
    const y = e.clientY - rect.top + cameraPos[1];
    setClickedCoords({ x: Math.round(x), y: Math.round(y) });
    setTimeout(() => setClickedCoords(null), 3000);
  };
  
  const handleMouseDown = (e) => {
    if (e.shiftKey) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + cameraPos[0];
      const y = e.clientY - rect.top + cameraPos[1];
      setDrawing(true);
      setDrawStart([x, y]);
      setDrawEnd([x, y]);
      setDrawnRect(null);
    }
  };
  
  const handleMouseMove = (e) => {
    if (drawing) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + cameraPos[0];
      const y = e.clientY - rect.top + cameraPos[1];
      setDrawEnd([x, y]);
    }
  };
  
  const handleMouseUp = () => {
    if (drawing && drawStart && drawEnd) {
      const minX = Math.min(drawStart[0], drawEnd[0]);
      const maxX = Math.max(drawStart[0], drawEnd[0]);
      const minY = Math.min(drawStart[1], drawEnd[1]);
      const maxY = Math.max(drawStart[1], drawEnd[1]);
      setDrawnRect({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
      setTimeout(() => setDrawnRect(null), 5000);
    }
    setDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  };
  
  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === "KeyX") {
        const player = entities[playerIdx];
        if (!player) return;
        
        // Check NPCs first
        let nearestEnt = null, best = Infinity;
        entities.forEach(ent => {
          if (ent.type !== 'npc') return;
          const d = dist(ent.pos, player.pos);
          if (d < best) { best = d; nearestEnt = ent; }
        });
        if (nearestEnt && best <= 80) {
          onTalkRequest && onTalkRequest(nearestEnt.id);
          return;
        }
        
        // Check building markers
        const buildings = [
          { x: 1147, y: 700, label: 'Old Ruin 1', id: 'old_ruin_1' },
          { x: 1621, y: 700, label: 'Old Ruin 2', id: 'old_ruin_2' },
          { x: 958, y: 1036, label: 'Fountain', id: 'fountain_1' },
          { x: 970, y: 1106, label: 'Fountain', id: 'fountain_2' },
          { x: 1369, y: 437, label: 'Royal Court', id: 'royal_court' },
          { x: 2424, y: 230, label: 'Bartender House', id: 'bartender_house' }
        ];
        
        const nearestBuilding = buildings.find(building => {
          return dist([building.x, building.y], player.pos) <= 80;
        });
        
        if (nearestBuilding) {
          onTalkRequest && onTalkRequest({ type: 'building', id: nearestBuilding.id, label: nearestBuilding.label });
        }
      }
    }
    
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entities, playerIdx, onTalkRequest]);

  return (
    <div ref={containerRef} className="world2d-viewport" style={{ width: "100%", height: "100vh", overflow: "hidden", position: "relative", cursor: drawing ? 'crosshair' : 'default' }} onDoubleClick={handleDoubleClick} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="world2d-inner" style={{
        width: MAP_W, height: MAP_H,
        position: 'relative', 
        left: -cameraPos[0], 
        top: -cameraPos[1],
        transition: 'left 0.1s ease, top 0.1s ease'
      }}>
        {/* Map background */}
        <img
          src="map.jpg"
          alt="Map"
          style={{
            position: "relative",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "left top",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />

        {/* Polygons from map coordinates */}
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
            const points = area.polygon.map(p => `${area.x + p.x},${area.y + p.y}`).join(' ');
            return (
              <g key={i}>
                <polygon
                  points={points}
                  fill="rgba(0,255,0,0.15)"
                  stroke="rgba(0,255,0,0.5)"
                  strokeWidth="2"
                />
                <text
                  x={area.x + 10}
                  y={area.y - 5}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textShadow="1px 1px 2px rgba(0,0,0,0.8)"
                >
                  {area.name}
                </text>
              </g>
            );
          })}
          {/* Points from map coordinates */}
          {mapCoordinates.layers?.[0]?.objects?.filter(obj => obj.point).map((point, i) => {
            const isNear = nearestPoint && nearestPoint.id === point.id;
            return (
              <g key={`point-${i}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isNear ? "8" : "4"}
                  fill={isNear ? "rgba(255,100,100,0.9)" : "rgba(255,255,0,0.8)"}
                  stroke={isNear ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.6)"}
                  strokeWidth={isNear ? "2" : "1"}
                />
                {isNear && (
                  <text
                    x={point.x + 12}
                    y={point.y - 8}
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                    textShadow="1px 1px 2px rgba(0,0,0,0.8)"
                  >
                    {point.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Entities */}
        {entities.map(ent => {
          const isPlayer = ent.type === 'player';
          const size = isPlayer ? 36 : 64;
          const initials = ent.name ? ent.name.split(" ").map(s=>s[0]).slice(0,2).join("") : ent.id.slice(0,2);
          
          const player = entities[playerIdx];
          const npcDistance = player ? dist([player.pos[0], player.pos[1]], [ent.pos[0], ent.pos[1]]) : Infinity;
          const isNearNPC = npcDistance <= 80;
          
          if (ent.id === 'guard' || ent.id === 'guard2') {
            return (
              <img
                key={ent.id}
                src="assets/guard_female.png"
                alt={ent.name}
                title={ent.name}
                onClick={() => isNearNPC && onTalkRequest && onTalkRequest(ent.id)}
                style={{
                  left: ent.pos[0] - size/2,
                  top: ent.pos[1] - size/2,
                  width: size,
                  height: size,
                  position: "absolute",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: isNearNPC ? "0 0 18px 6px rgba(255,215,0,0.8)" : "none",
                  cursor: isNearNPC ? "pointer" : "default",
                  zIndex: 35
                }}
              />
            );
          }
          
          if (ent.id === 'thief') {
            return (
              <img
                key={ent.id}
                src="assets/thief.png"
                alt={ent.name}
                title={ent.name}
                onClick={() => isNearNPC && onTalkRequest && onTalkRequest(ent.id)}
                style={{
                  left: ent.pos[0] - size/2,
                  top: ent.pos[1] - size/2,
                  width: size,
                  height: size,
                  position: "absolute",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: isNearNPC ? "0 0 18px 6px rgba(255,215,0,0.8)" : "none",
                  cursor: isNearNPC ? "pointer" : "default",
                  zIndex: 35
                }}
              />
            );
          }
          
          if (ent.id === 'merchant') {
            return (
              <img
                key={ent.id}
                src="assets/merchant.png"
                alt={ent.name}
                title={ent.name}
                onClick={() => isNearNPC && onTalkRequest && onTalkRequest(ent.id)}
                style={{
                  left: ent.pos[0] - size/2,
                  top: ent.pos[1] - size/2,
                  width: size,
                  height: size,
                  position: "absolute",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: isNearNPC ? "0 0 18px 6px rgba(255,215,0,0.8)" : "none",
                  cursor: isNearNPC ? "pointer" : "default",
                  zIndex: 35
                }}
              />
            );
          }
          
          if (ent.id === 'old_man') {
            return (
              <img
                key={ent.id}
                src="assets/old_man.png"
                alt={ent.name}
                title={ent.name}
                onClick={() => isNearNPC && onTalkRequest && onTalkRequest(ent.id)}
                style={{
                  left: ent.pos[0] - size/2,
                  top: ent.pos[1] - size/2,
                  width: size,
                  height: size,
                  position: "absolute",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: isNearNPC ? "0 0 18px 6px rgba(255,215,0,0.8)" : "none",
                  cursor: isNearNPC ? "pointer" : "default",
                  zIndex: 35
                }}
              />
            );
          }
          
          if (ent.id === 'bartender') {
            return (
              <img
                key={ent.id}
                src="assets/bartender.png"
                alt={ent.name}
                title={ent.name}
                onClick={() => isNearNPC && onTalkRequest && onTalkRequest(ent.id)}
                style={{
                  left: ent.pos[0] - size/2,
                  top: ent.pos[1] - size/2,
                  width: size,
                  height: size,
                  position: "absolute",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.5)",
                  boxShadow: isNearNPC ? "0 0 18px 6px rgba(255,215,0,0.8)" : "none",
                  cursor: isNearNPC ? "pointer" : "default",
                  zIndex: 35
                }}
              />
            );
          }
          
          return (
            <div
              key={ent.id}
              title={ent.name}
              className={`world-entity ${isPlayer ? 'player-entity' : 'npc-entity'}`}
              style={{
                left: ent.pos[0] - size/2,
                top: ent.pos[1] - size/2,
                width: size, height: size,
                background: isPlayer ? "#9ae6b4" : "#ccc",
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
        })
       }
        {/* Additional markers */}
        <svg style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 15,
          pointerEvents: 'none'
        }}>
          {(() => {
            const player = entities[playerIdx];
            const markers = [
              { x: 1147, y: 700, label: 'Old Ruin 1', type: 'circle' },
              { x: 1621, y: 700, label: 'Old Ruin 2', type: 'circle' },
              { x: 958, y: 1036, label: 'Fountain', type: 'rect', w: 151, h: 10 },
              { x: 970, y: 1106, label: 'Fountain', type: 'rect', w: 161, h: 10 },
              { x: 1369, y: 437, label: 'Royal Court', type: 'circle' },
              { x: 2424, y: 230, label: 'Bartender House', type: 'rect', w: 4, h: 12 }
            ];
            return markers.map((marker, i) => {
              const distance = player ? dist([player.pos[0], player.pos[1]], [marker.x, marker.y]) : Infinity;
              const isNear = distance <= 80;
              const glow = isNear ? "0 0 18px 6px rgba(255,215,0,0.8)" : "none";
              
              return (
                <g key={i}>
                  {marker.type === 'circle' ? (
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={isNear ? "8" : "6"}
                      fill="rgba(255,255,255,0.3)"
                      stroke="white"
                      strokeWidth="2"
                      filter={isNear ? "drop-shadow(0 0 8px rgba(255,215,0,0.8))" : "none"}
                    />
                  ) : (
                    <rect
                      x={marker.x - marker.w/2}
                      y={marker.y - marker.h/2}
                      width={marker.w}
                      height={marker.h}
                      fill="rgba(255,255,255,0.3)"
                      stroke="white"
                      strokeWidth="1"
                      filter={isNear ? "drop-shadow(0 0 8px rgba(255,215,0,0.8))" : "none"}
                    />
                  )}
                  {isNear && (
                    <text
                      x={marker.x + 12}
                      y={marker.y - 8}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textShadow="1px 1px 2px rgba(0,0,0,0.8)"
                    >
                      {marker.label}
                    </text>
                  )}
                </g>
              );
            });
          })()
          }
        </svg>

        {/* Interaction hints */}
        {nearestBuilding && (
          <div style={{
            position: 'fixed',
            left: nearestBuilding.x - cameraPos[0] + 15,
            top: nearestBuilding.y - cameraPos[1] - 40,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 50,
            pointerEvents: 'none'
          }}>
            Press X to interact with {nearestBuilding.label}
          </div>
        )}
        
        {/* Drawing rectangle */}
        {drawing && drawStart && drawEnd && (
          <div style={{
            position: 'absolute',
            left: Math.min(drawStart[0], drawEnd[0]),
            top: Math.min(drawStart[1], drawEnd[1]),
            width: Math.abs(drawEnd[0] - drawStart[0]),
            height: Math.abs(drawEnd[1] - drawStart[1]),
            border: '2px dashed #00ff00',
            background: 'rgba(0,255,0,0.1)',
            zIndex: 100,
            pointerEvents: 'none'
          }} />
        )}
        
        {/* Drawn rectangle with coordinates */}
        {drawnRect && (
          <>
            <div style={{
              position: 'absolute',
              left: drawnRect.x,
              top: drawnRect.y,
              width: drawnRect.w,
              height: drawnRect.h,
              border: '2px solid #ff0000',
              background: 'rgba(255,0,0,0.1)',
              zIndex: 100,
              pointerEvents: 'none'
            }} />
            <div 
              onClick={() => {
                const coords = `(${Math.round(drawnRect.x)}, ${Math.round(drawnRect.y)}) to (${Math.round(drawnRect.x + drawnRect.w)}, ${Math.round(drawnRect.y + drawnRect.h)})`;
                navigator.clipboard.writeText(coords);
              }}
              style={{
                position: 'fixed',
                left: drawnRect.x - cameraPos[0],
                top: drawnRect.y - cameraPos[1] - 30,
                background: 'rgba(0,0,0,0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 101,
                pointerEvents: 'auto',
                fontFamily: 'monospace',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              ({Math.round(drawnRect.x)}, {Math.round(drawnRect.y)}) to ({Math.round(drawnRect.x + drawnRect.w)}, {Math.round(drawnRect.y + drawnRect.h)})<br/>
              Size: {Math.round(drawnRect.w)} x {Math.round(drawnRect.h)}<br/>
              <span style={{fontSize: '10px', opacity: 0.7}}>Click to copy</span>
            </div>
          </>
        )}

      </div>
      
      {/* Instructions */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 200
      }}>
        Hold Shift + Click & Drag to draw rectangle
      </div>
    </div>
  );
}
