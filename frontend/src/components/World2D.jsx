// frontend/src/components/World2D.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./../styles.css";

/* constants & helpers */
const WORLD_W = 2000;
const WORLD_H = 1200;

const AREAS = [
  { id: 'flea_market', x: 340, y: 460, w: 240, h: 140, label: 'Flea Market' },
  { id: 'royal_court', x: 1050, y: 150, w: 240, h: 200, label: 'Royal Court' },
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

export default function World2D({ onTalkRequest, pausedNPCId }) {
  const containerRef = useRef(null);
  const [entities, setEntities] = useState(() => INITIAL_CHARACTERS);
  const [playerIdx] = useState(0);
  const playerSpeed = 220;
  const keys = useRef({});
  const lastTimeRef = useRef(performance.now());
  const [nearest, setNearest] = useState(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [mapSize] = useState({ w: 180, h: 110 });
  const [grassMode, setGrassMode] = useState(false);
  const [grassTiles, setGrassTiles] = useState(() => {
    const saved = localStorage.getItem('grassTiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [selecting, setSelecting] = useState(false);
  const [selectStart, setSelectStart] = useState(null);
  const [selectEnd, setSelectEnd] = useState(null);
  const [buildMode, setBuildMode] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [placedComponents, setPlacedComponents] = useState(() => {
    const saved = localStorage.getItem('placedComponents');
    return saved ? JSON.parse(saved) : [];
  });
  const [dragging, setDragging] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  
  const COMPONENTS = [
    { id: 'bartender', name: 'Bartender', image: 'assets/bartender.png', size: 50 },
    { id: 'castle', name: 'Castle', image: 'assets/castle.png', size: 80 },
    { id: 'clothes_stall', name: 'Clothes Stall', image: 'assets/clothes_stall.png', size: 60 },
    { id: 'flower_stall', name: 'Flower Stall', image: 'assets/flower_stall.png', size: 60 },
    { id: 'fountain', name: 'Fountain', image: 'assets/fountain.png', size: 60 },
    { id: 'fruit_stall', name: 'Fruit Stall', image: 'assets/fruit_stall.png', size: 60 },
    { id: 'garden_house', name: 'Garden House', image: 'assets/garden_house.png', size: 70 },
    { id: 'garden_square', name: 'Garden Square', image: 'assets/garden_square.png', size: 80 },
    { id: 'grass_patch', name: 'Grass Patch', image: 'assets/grass_patch.png', size: 40 },
    { id: 'guard', name: 'Guard', image: 'assets/guard.png', size: 50 },
    { id: 'guard_female', name: 'Guard Female', image: 'assets/guard_female.png', size: 50 },
    { id: 'merchant', name: 'Merchant', image: 'assets/merchant.png', size: 50 },
    { id: 'old_man', name: 'Old Man', image: 'assets/old_man.png', size: 50 },
    { id: 'sweet_stall', name: 'Sweet Stall', image: 'assets/sweet_stall.png', size: 60 },
    { id: 'thief', name: 'Thief', image: 'assets/thief.png', size: 50 },
    { id: 'village_square', name: 'Village Square', image: 'assets/village_sqaure.png', size: 80 }
  ];

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
          // Pause NPC if chatting
          if (ent.type === 'npc' && ent.id === pausedNPCId) {
            return ent;
          }
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
  }, [playerIdx, updateEntityPos, playerSpeed, pausedNPCId]);

  useEffect(() => {
    function onKeyDown(e) {
      keys.current[e.code] = true;
      if (e.code === "KeyG") {
        setGrassMode(!grassMode);
        setBuildMode(false);
        return;
      }
      if (e.code === "KeyB") {
        setBuildMode(!buildMode);
        setGrassMode(false);
        return;
      }
      if (e.code === "KeyC" && grassMode) {
        setGrassTiles([]);
        localStorage.setItem('grassTiles', JSON.stringify([]));
        return;
      }
      if (e.code === "KeyR" && buildMode && selectedComponent) {
        setRotation(prev => (prev + 90) % 360);
        return;
      }
      if (e.code === "Delete" && selectedBuilding) {
        const updated = placedComponents.filter(comp => comp.id !== selectedBuilding);
        setPlacedComponents(updated);
        localStorage.setItem('placedComponents', JSON.stringify(updated));
        setSelectedBuilding(null);
        return;
      }
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

  // Scroll the container so player is centered (like page scroll)
  useEffect(() => {
    const id = setInterval(() => {
      const player = entities[playerIdx];
      const container = containerRef.current;
      if (!player || !container) return;
      const px = Math.round(player.pos[0] - container.offsetWidth / 2);
      const py = Math.round(player.pos[1] - container.offsetHeight / 2);
      container.scrollLeft = Math.max(0, Math.min(px, WORLD_W - container.offsetWidth));
      container.scrollTop = Math.max(0, Math.min(py, WORLD_H - container.offsetHeight));
    }, 60);
    return () => clearInterval(id);
  }, [entities, playerIdx]);

  // compute nearest & screen projection using container scroll offsets
  useEffect(()=> {
    const p = entities[playerIdx]?.pos;
    if (!p) return;
    const container = containerRef.current;
    const scrollX = container ? container.scrollLeft : 0;
    const scrollY = container ? container.scrollTop : 0;
    let best = null, bestD = Infinity;
    entities.forEach(ent => {
      if (ent.type !== 'npc') return;
      const d = dist(ent.pos, p);
      if (d < bestD) { bestD = d; best = ent; }
    });
    if (best) {
      const screenX = best.pos[0] - scrollX;
      const screenY = best.pos[1] - scrollY;
      setNearest({ id: best.id, dist: bestD, screen: [screenX, screenY] });
    } else setNearest(null);
  }, [entities, playerIdx]);

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

  const handleMouseDown = (e) => {
    if (grassMode) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const y = e.clientY - rect.top + containerRef.current.scrollTop;
      setSelecting(true);
      setSelectStart([x, y]);
      setSelectEnd([x, y]);
    } else if (buildMode && selectedComponent) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const y = e.clientY - rect.top + containerRef.current.scrollTop;
      const newComponent = {
        id: Date.now(),
        type: selectedComponent.id,
        x: x - selectedComponent.size/2,
        y: y - selectedComponent.size/2,
        rotation: rotation,
        size: selectedComponent.size,
        image: selectedComponent.image,
        name: selectedComponent.name,
        isFixed: true,
        hasNPC: false,
        npcConfig: null
      };
      const updated = [...placedComponents, newComponent];
      setPlacedComponents(updated);
      localStorage.setItem('placedComponents', JSON.stringify(updated));
    }
  };

  const handleMouseMove = (e) => {
    if (grassMode && selecting) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const y = e.clientY - rect.top + containerRef.current.scrollTop;
      setSelectEnd([x, y]);
    } else if (dragging) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const y = e.clientY - rect.top + containerRef.current.scrollTop;
      const updated = placedComponents.map(comp => 
        comp.id === dragging ? { ...comp, x: x - comp.size/2, y: y - comp.size/2 } : comp
      );
      setPlacedComponents(updated);
    }
  };

  const handleMouseUp = () => {
    if (grassMode && selecting && selectStart && selectEnd) {
      const minX = Math.min(selectStart[0], selectEnd[0]);
      const maxX = Math.max(selectStart[0], selectEnd[0]);
      const minY = Math.min(selectStart[1], selectEnd[1]);
      const maxY = Math.max(selectStart[1], selectEnd[1]);
      const newTile = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      const updatedTiles = [...grassTiles, newTile];
      setGrassTiles(updatedTiles);
      localStorage.setItem('grassTiles', JSON.stringify(updatedTiles));
      setSelecting(false);
      setSelectStart(null);
      setSelectEnd(null);
    } else if (dragging) {
      localStorage.setItem('placedComponents', JSON.stringify(placedComponents));
      setDragging(null);
    }
  };

  return (
    <div ref={containerRef} className="world2d-viewport" style={{ width: "100%", height: "100vh", overflow: "auto", position: "relative", cursor: grassMode ? 'crosshair' : (buildMode ? 'copy' : 'default') }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <div className="world2d-inner" style={{
        width: WORLD_W, height: WORLD_H,
        position: 'relative', left:0, top:0
      }}>
        {/* World background image */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            backgroundImage: "url('assets/village_layout.png')",
            backgroundSize: "20% 20%",
            backgroundRepeat: "repeat",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />

        {/* Grass tiles */}
        {grassTiles.map((tile, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: tile.x,
            top: tile.y,
            width: tile.w,
            height: tile.h,
            backgroundImage: "url('assets/grass_patch.png')",
            backgroundSize: 'cover',
            zIndex: 5
          }} />
        ))}

        {/* Placed components */}
        {placedComponents.map((comp) => (
          <div
            key={comp.id}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedBuilding(comp.id);
              setDragging(comp.id);
            }}
            style={{
              position: 'absolute',
              left: comp.x,
              top: comp.y,
              width: comp.size,
              height: comp.size,
              backgroundImage: `url('${comp.image}')`,
              backgroundSize: 'cover',
              transform: `rotate(${comp.rotation || 0}deg)`,
              cursor: 'move',
              zIndex: 15,
              border: selectedBuilding === comp.id ? '3px solid #00ff00' : (comp.hasNPC ? '2px solid #ffff00' : 'none'),
              boxShadow: selectedBuilding === comp.id ? '0 0 15px rgba(0,255,0,0.7)' : (comp.hasNPC ? '0 0 10px rgba(255,255,0,0.5)' : 'none')
            }}
            title={comp.hasNPC ? `${comp.name} - Has NPC` : comp.name}
          />
        ))}

        {/* Selection rectangle */}
        {grassMode && selecting && selectStart && selectEnd && (
          <div style={{
            position: 'absolute',
            left: Math.min(selectStart[0], selectEnd[0]),
            top: Math.min(selectStart[1], selectEnd[1]),
            width: Math.abs(selectEnd[0] - selectStart[0]),
            height: Math.abs(selectEnd[1] - selectStart[1]),
            border: '2px dashed #00ff00',
            background: 'rgba(0,255,0,0.1)',
            zIndex: 100,
            pointerEvents: 'none'
          }} />
        )}

        {/* Render area rectangles */}
        {AREAS.map(a => {
          const getAreaImage = (id) => {
            if (id === 'royal_court') return 'assets/castle.png';
            if (id === 'fountain') return 'assets/fountain.png';
            return null;
          };
          const areaImage = getAreaImage(a.id);
          
          return (
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
              {areaImage && (
                <img
                  src={areaImage}
                  alt={a.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 6,
                    opacity: 0.8
                  }}
                />
              )}
              <div style={{position:'absolute', left:6, top:6, color:'#ddd', fontSize:12, textShadow:'0 0 4px rgba(0,0,0,0.8)'}}>{a.label}</div>
            </div>
          );
        })
      }

        {/* NPCs + Player */}
        {entities.map(ent => {
          const isPlayer = ent.type === 'player';
          const glow = !isPlayer && nearest && nearest.id === ent.id && nearest.dist <= 90;
          const size = isPlayer ? 36 : 48;
          const initials = ent.name ? ent.name.split(" ").map(s=>s[0]).slice(0,2).join("") : ent.id.slice(0,2);
          
          const getNPCImage = (id) => {
            if (id === 'guard') return 'assets/guard_female.png';
            if (id === 'moody_old_man') return 'assets/old_man.png';
            if (id === 'bartender') return 'assets/bartender.png';
            if (id === 'helios') return 'assets/thief.png';
            if (id === 'merchant') return 'assets/merchant.png';
            return null;
          };
          const npcImage = getNPCImage(ent.id);
          
          return (
            <div
              key={ent.id}
              onClick={() => !isPlayer && onNpcClick(ent.id)}
              title={ent.name}
              className={`world-entity ${isPlayer ? 'player-entity' : 'npc-entity'}`}
              style={{
                left: ent.pos[0] - size/2,
                top: ent.pos[1] - size/2,
                width: size, height: size,
                background: npcImage ? 'transparent' : (ent.color || (isPlayer ? "#9ae6b4" : "#ccc")),
                boxShadow: glow ? "0 0 18px 6px rgba(255,215,0,0.25)" : "none",
                border: isPlayer ? "2px solid #0f1724" : "1px solid rgba(0,0,0,0.2)",
                position: "absolute",
                borderRadius: "50%",
                overflow: "hidden"
              }}
            >
              {npcImage ? (
                <img
                  src={npcImage}
                  alt={ent.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{fontSize:12, fontWeight:700}}>{initials}</div>
              )}
            </div>
          );
        })}
      </div>
      

      {/* hint */}
      {nearest && nearest.dist <= 90 && (
        <div className="world-hint" style={{ position: 'fixed', left: (nearest.screen[0] - 10) + 'px', top: (nearest.screen[1] - 50) + 'px', zIndex: 200 }}>
          Press <strong>X</strong> to interact
        </div>
      )}
      {hintVisible && <div className="world-hint-temp">Move closer to interact</div>}
      {!grassMode && !buildMode && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          zIndex: 200,
          fontSize: '12px'
        }}>
          Press G for Grass Mode | Press B for Build Mode
        </div>
      )}
      {grassMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,255,0,0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          zIndex: 200
        }}>
          Grass Mode: Click and drag to place grass | Press C to clear all | Press G to exit
        </div>
      )}
      {buildMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          zIndex: 200,
          minWidth: '200px'
        }}>
          <div style={{marginBottom: '10px', fontWeight: 'bold'}}>Build Mode (Press B to exit)</div>
          <div style={{marginBottom: '8px'}}>Select Component:</div>
          {COMPONENTS.map(comp => (
            <div
              key={comp.id}
              onClick={() => {setSelectedComponent(comp); setRotation(0);}}
              style={{
                padding: '6px',
                margin: '2px 0',
                background: selectedComponent?.id === comp.id ? '#0066cc' : '#333',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              {comp.name}
            </div>
          ))}
          {selectedComponent && (
            <div style={{marginTop: '10px', fontSize: '12px'}}>
              Press R to rotate ({rotation}°)
            </div>
          )}
          <button
            onClick={() => {
              setPlacedComponents([]);
              localStorage.setItem('placedComponents', JSON.stringify([]));
            }}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%'
            }}
          >
            Clear All Buildings
          </button>
          {selectedBuilding && (
            <div style={{marginTop: '10px', padding: '8px', background: '#333', borderRadius: '4px'}}>
              <div style={{fontSize: '12px', color: '#0f0', marginBottom: '4px'}}>Building Selected</div>
              <div style={{fontSize: '11px', color: '#ccc'}}>Press Delete to remove</div>
            </div>
          )}
        </div>
      )}

      {/* minimap */}
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

