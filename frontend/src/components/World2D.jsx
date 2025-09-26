// frontend/src/components/World2D.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./../styles.css";
import { addSteps, interactNPC, interactArea } from "../api";

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

  // audioRef holds audio objects and bookkeeping
  const audioRef = useRef({
    bg: null,
    sfxInteract: null,
    sfxSwish: null,
    sfxStep: null,
    sfxFootLoop: null,
    footstepsInterval: null,
    audioStarted: false
  });

  // Robust audio initialization with logging
  useEffect(() => {
    console.log("[Audio] initializing audioRef...");
    const a = audioRef.current;

    // Background loop
    try {
      a.bg = new Audio("/assets/bg_loop.mp3");
      a.bg.loop = true;
      a.bg.volume = 0.5;
      a.bg.preload = 'auto';
      a.bg.addEventListener('canplaythrough', () => console.log("[Audio] bg canplaythrough"));
      a.bg.addEventListener('play', () => console.log("[Audio] bg play event"));
      a.bg.addEventListener('error', (e) => console.error("[Audio] bg error", e, a.bg.error));
      console.log("[Audio] bg initialized:", a.bg.src);
    } catch(e) {
      console.error("[Audio] error initializing bg", e);
    }

    // Interact SFX
    try {
      a.sfxInteract = new Audio("/assets/sfx_interact.mp3");
      a.sfxInteract.volume = 0.9;
      a.sfxInteract.preload = 'auto';
      a.sfxInteract.addEventListener('canplaythrough', ()=>console.log("[Audio] sfxInteract canplaythrough"));
      a.sfxInteract.addEventListener('play', ()=>console.log("[Audio] sfxInteract play event"));
      a.sfxInteract.addEventListener('error', (e)=>console.error("[Audio] sfxInteract error", e, a.sfxInteract.error));
      console.log("[Audio] sfxInteract initialized:", a.sfxInteract.src);
    } catch(e) {
      console.error("[Audio] error initializing sfxInteract", e);
    }

    // NPC swish / reply
    try {
      a.sfxSwish = new Audio("/assets/sfx_npc_swish.mp3");
      a.sfxSwish.volume = 0.9;
      a.sfxSwish.preload = 'auto';
      a.sfxSwish.addEventListener('canplaythrough', ()=>console.log("[Audio] sfxSwish canplaythrough"));
      a.sfxSwish.addEventListener('error', (e)=>console.error("[Audio] sfxSwish error", e, a.sfxSwish.error));
      console.log("[Audio] sfxSwish initialized:", a.sfxSwish.src);
    } catch(e) {
      console.error("[Audio] error initializing sfxSwish", e);
    }

    // Step SFX (single short clip) and a loop fallback
    try {
      a.sfxStep = new Audio("/assets/sfx_step.mp3");
      a.sfxStep.volume = 0.9;
      a.sfxStep.preload = 'auto';
      a.sfxStep.addEventListener('canplaythrough', ()=>console.log("[Audio] sfxStep canplaythrough"));
      a.sfxStep.addEventListener('error', (e)=>console.error("[Audio] sfxStep error", e, a.sfxStep.error));
      console.log("[Audio] sfxStep initialized:", a.sfxStep.src);
    } catch(e) {
      console.error("[Audio] error initializing sfxStep", e);
    }

    // Create a looping footsteps element (safer than rapidly cloning)
    try {
      a.sfxFootLoop = new Audio("/assets/sfx_step.mp3"); // reuse sfx_step if no dedicated loop
      a.sfxFootLoop.loop = true;
      a.sfxFootLoop.volume = 0.85;
      a.sfxFootLoop.preload = 'auto';
      a.sfxFootLoop.addEventListener('play', ()=>console.log("[Audio] sfxFootLoop play"));
      a.sfxFootLoop.addEventListener('pause', ()=>console.log("[Audio] sfxFootLoop pause"));
      a.sfxFootLoop.addEventListener('error', (e)=>console.error("[Audio] sfxFootLoop error", e, a.sfxFootLoop.error));
      console.log("[Audio] sfxFootLoop initialized:", a.sfxFootLoop.src);
    } catch(e) {
      console.error("[Audio] error initializing sfxFootLoop", e);
    }

    // Attempt auto-play once (may be blocked) — log result
    const tryStartBG = () => {
      if (!a.bg) return;
      a.bg.play()
        .then(()=>{ console.log("[Audio] BG autoplay succeeded"); a.audioStarted = true; })
        .catch(err => { console.warn("[Audio] BG autoplay blocked:", err); });
    };

    // Unlock audio on first user click — start bg and mark audioStarted
    const unlock = () => {
      console.log("[Audio] first user gesture detected (unlock)");
      tryStartBG();
      window.removeEventListener("click", unlock);
    };
    window.addEventListener("click", unlock);

    console.log("[Audio] initialization complete; waiting for user gesture if necessary.");
    return () => {
      window.removeEventListener("click", unlock);
      console.log("[Audio] cleaning up audio refs");
      try { a.bg && a.bg.pause(); } catch(e){}
      audioRef.current = { bg: null, sfxInteract: null, sfxSwish: null, sfxStep: null, sfxFootLoop: null, footstepsInterval: null, audioStarted: false };
    };
  }, []);

  // footsteps control: start and stop using the loop element
  const startFootsteps = useCallback(() => {
    const a = audioRef.current;
    if (!a.sfxFootLoop) {
      console.warn("[Audio] startFootsteps: no sfxFootLoop found — fallback to playing sfxStep clones");
      // fallback approach: try a single clone play
      if (a.sfxStep) {
        try {
          const c = a.sfxStep.cloneNode();
          c.play().catch(e => console.warn("[Audio] fallback footstep clone play failed", e));
        } catch(e) {
          console.error("[Audio] fallback footstep error", e);
        }
      }
      return;
    }
    // only start if not already playing
    if (audioRef.current.footstepsInterval) {
      console.log("[Audio] footsteps already active");
      return;
    }
    console.log("[Audio] starting footsteps loop (sfxFootLoop). Attempting to play...");
    a.sfxFootLoop.play()
      .then(()=> {
        audioRef.current.footstepsInterval = true; // marker
        console.log("[Audio] sfxFootLoop play OK");
      })
      .catch(e => {
        console.warn("[Audio] sfxFootLoop play failed:", e);
      });
  }, []);

  const stopFootsteps = useCallback(() => {
    const a = audioRef.current;
    if (!a.sfxFootLoop) {
      return;
    }
    try {
      a.sfxFootLoop.pause();
      audioRef.current.footstepsInterval = null;
      console.log("[Audio] stopped footsteps (sfxFootLoop paused)");
    } catch(e){
      console.error("[Audio] error stopping footsteps", e);
    }
  }, []);

  // movement + NPC patrols
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
          
          // Check if typing
          const active = document.activeElement;
          const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
          
          if (!typing) {
            if (keys.current['KeyW'] || keys.current['ArrowUp']) dy -= 1;
            if (keys.current['KeyS'] || keys.current['ArrowDown']) dy += 1;
            if (keys.current['KeyA'] || keys.current['ArrowLeft']) dx -= 1;
            if (keys.current['KeyD'] || keys.current['ArrowRight']) dx += 1;
          }
          
          const moving = dx !== 0 || dy !== 0;
          if (moving) {
            const len = Math.hypot(dx,dy) || 1;
            const move = (playerSpeed * dt);
            pos[0] += (dx/len) * move;
            pos[1] += (dy/len) * move;
          }
          
          pos[0] = Math.min(Math.max(10, pos[0]), WORLD_W - 10);
          pos[1] = Math.min(Math.max(10, pos[1]), WORLD_H - 10);
          
          return { ...ent, pos, walking: moving };
        });
        return next;
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerIdx, playerSpeed, pausedNPCId]);

  // keyboard events + interact logic (X)
  useEffect(() => {
    function logKey(e) {
      // general logging for debugging
      if (e.code === "KeyX") console.log("[Input] KeyX pressed (window listener)");
      // store pressed for movement handling
      keys.current[e.code] = true;

      // Track movement steps
      if (
        e.code === "KeyW" || e.code === "KeyA" || e.code === "KeyS" || e.code === "KeyD" ||
        e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "ArrowLeft" || e.code === "ArrowRight"
      ) {
        addSteps(1);
      }
    }
    function onKeyDown(e) {
      logKey(e);
      // we call a centralized logging helper
      console.log("[Input] keydown:", e.code, "activeElement:", document.activeElement?.tagName);
      keys.current[e.code] = true;

      if (e.code === "KeyG") {
        setGrassMode(prev => !prev);
        setBuildMode(false);
        console.log("[Mode] toggle grassMode ->", !grassMode);
        return;
      }
      if (e.code === "KeyB") {
        setBuildMode(prev => !prev);
        setGrassMode(false);
        console.log("[Mode] toggle buildMode ->", !buildMode);
        return;
      }
      if (e.code === "KeyC" && grassMode) {
        setGrassTiles([]);
        localStorage.setItem('grassTiles', JSON.stringify([]));
        console.log("[Grass] cleared");
        return;
      }
      if (e.code === "KeyR" && buildMode && selectedComponent) {
        setRotation(prev => (prev + 90) % 360);
        console.log("[Build] rotated selected component ->", (rotation+90)%360);
        return;
      }
      if (e.code === "Delete" && selectedBuilding) {
        const updated = placedComponents.filter(comp => comp.id !== selectedBuilding);
        setPlacedComponents(updated);
        localStorage.setItem('placedComponents', JSON.stringify(updated));
        setSelectedBuilding(null);
        console.log("[Build] deleted building", selectedBuilding);
        return;
      }

      // INTERACT: X
      if (e.code === "KeyX") {
        console.log("[Audio] X pressed, attempting to play interact SFX");
        const a = audioRef.current;
        // Ensure sfxInteract exists
        if (!a.sfxInteract) {
          console.warn("[Audio] sfxInteract missing, creating on-the-fly");
          try {
            a.sfxInteract = new Audio("/assets/sfx_interact.mp3");
            a.sfxInteract.preload = 'auto';
          } catch (err) {
            console.error("[Audio] failed to create sfxInteract", err);
          }
        }
        if (a.sfxInteract) {
          console.log("[Audio] sfxInteract state before play:", { readyState: a.sfxInteract.readyState, src: a.sfxInteract.src });
          a.sfxInteract.play()
            .then(() => console.log("[Audio] sfxInteract played OK"))
            .catch(err => console.error("[Audio] sfxInteract play failed:", err));
        } else {
          console.warn("[Audio] no sfxInteract available to play");
        }

        // Now find nearest npc/area
        const p = entities[playerIdx].pos;
        let nearestEnt = null, best = Infinity;
        entities.forEach(ent => {
          if (ent.type !== 'npc') return;
          const d = dist(ent.pos, p);
          if (d < best) { best = d; nearestEnt = ent; }
        });
        if (nearestEnt && best <= 90) {
          console.log("[APP] interact -> NPC", nearestEnt.id, "dist", best);
          onTalkRequest && onTalkRequest(nearestEnt.id);
          interactNPC(nearestEnt.id); // Track NPC interaction
          return;
        }
        const nearestArea = AREAS.find(ar => {
          const center = [ar.x + ar.w/2, ar.y + ar.h/2];
          return dist(center, p) <= 120;
        });
        if (nearestArea) {
          console.log("[APP] interact -> AREA", nearestArea.id);
          onTalkRequest && onTalkRequest({ type:'area', id: nearestArea.id });
          interactArea(nearestArea.id); // Track area interaction
          return;
        }
        setHintVisible(true);
        setTimeout(()=>setHintVisible(false), 900);
      }
    }
    function onKeyUp(e) {
      keys.current[e.code] = false;
      //console.log("[Input] keyup:", e.code);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return ()=>{ window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [entities, playerIdx, onTalkRequest, placedComponents, rotation, grassMode, buildMode, selectedComponent, selectedBuilding]);

  // Scroll the container so player is centered
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

  // compute nearest & hint position using container scroll offsets
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
      // compute page position for the hint (container rect)
      const rect = container.getBoundingClientRect();
      setNearest({ id: best.id, dist: bestD, screen: [screenX, screenY] });
      setHintPos({ left: Math.round(rect.left + screenX), top: Math.round(rect.top + screenY - 50) });
    } else {
      setNearest(null);
    }
  }, [entities, playerIdx]);

  const onNpcClick = (id) => {
    const ent = entities.find(e=>e.id===id);
    const p = entities[playerIdx].pos;
    if (ent && dist(ent.pos, p) <= 90) {
      console.log("[UI] NPC clicked in-range:", id);
      onTalkRequest && onTalkRequest(id);
    } else {
      const nearestArea = AREAS.find(ar => {
        const center = [ar.x + ar.w/2, ar.y + ar.h/2];
        return dist(center, p) <= 120;
      });
      if (nearestArea) {
        console.log("[UI] NPC clicked -> nearest area:", nearestArea.id);
        onTalkRequest && onTalkRequest({ type:'area', id: nearestArea.id });
        return;
      }
      setHintVisible(true);
      setTimeout(()=>setHintVisible(false), 800);
    }
  };

  // watch player.walking to start/stop footsteps audio
  useEffect(() => {
    const player = entities[playerIdx];
    if (!player) return;
    if (player.walking) {
      startFootsteps();
    } else {
      stopFootsteps();
    }
  }, [entities, playerIdx, startFootsteps, stopFootsteps]);

  // The rest of the rendering (map, components, entities, hints, minimap)
  return (
    <div ref={containerRef} className="world2d-viewport" style={{ width: "100%", height: "100vh", overflow: "auto", position: "relative", cursor: grassMode ? 'crosshair' : (buildMode ? 'copy' : 'default') }}>
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
        })}

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
          {/* (components list omitted here for brevity — unchanged) */}
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
