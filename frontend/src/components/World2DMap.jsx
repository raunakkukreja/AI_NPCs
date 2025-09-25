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
  { id: "thief", name: "Helios", type: "npc", pos: [1050, 718],
    path: [[1050, 718], [1249, 720], [1531, 751], [1692, 631]], speed: 40, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "merchant", name: "Merchant", type: "npc", pos: [1759, 879],
    path: [[1759, 879], [1813, 1370], [1578, 1320], [2509, 1354], [2034, 882], [2063, 1323], [2295, 883], [2329, 1355]], speed: 60, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "old_man", name: "Old Man", type: "npc", pos: [288, 446],
    path: [[318, 469], [891, 485], [1103, 521]], speed: 25, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "guard2", name: "Royal Guard", type: "npc", pos: [1372, 502],
    path: [[1372, 502], [1374, 924]], speed: 50, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "bartender", name: "Bartender", type: "npc", pos: [2281, 251],
    path: [[2281, 251], [2679, 287], [2598, 264], [2642, 1370], [1576, 1334], [2630, 1346]], speed: 45, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "woman_1", name: "Woman", type: "npc", pos: [134, 38],
    path: [[134, 38], [150, 1267]], speed: 30, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "boy", name: "Boy", type: "npc", pos: [2486, 502],
    path: [[2486, 502], [2502, 510]], speed: 20, _meta: { idx: 0, t: 0, pauseUntil: 0 } },
  { id: "woman_2", name: "Woman 2", type: "npc", pos: [2278, 233],
    path: [[2278, 233], [2558, 280]], speed: 35, _meta: { idx: 0, t: 0, pauseUntil: 0 } }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpPos(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
function dist(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]); }

export default function World2DMap({ onTalkRequest, pausedNPCId, playerInteractions = [], chatVisible = false }) {
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
  const [gossipNetwork, setGossipNetwork] = useState({});
  const [showGossipGraph, setShowGossipGraph] = useState(true);
  const [sharingPairs, setSharingPairs] = useState([]);
  const audioRef = useRef({
    bg: null,
    sfxInteract: null,
    sfxSwish: null,
    sfxStep: null,
    footstepsInterval: null,
    audioStarted: false
  });

  // Music on/off setting (persisted)
  const [musicOn, setMusicOn] = useState(() => {
    try {
      const v = localStorage.getItem('musicOn');
      return v === null ? true : v === 'true';
    } catch (e) {
      return true;
    }
  });

  const DEBUG_MOVEMENT = true;

  /* Movement and Audio Handlers */
  const startFootsteps = useCallback(() => {
    const a = audioRef.current;
    if (a.footstepsInterval) return;
    console.log("[Movement-Debug] Creating footsteps interval");
    a.footstepsInterval = setInterval(() => {
      try {
        if (!a.sfxStep) return;
        const stepSound = a.sfxStep.cloneNode();
        stepSound.volume = 0.7;
        stepSound.play().catch(err => {
          console.warn("[Movement-Debug] Failed to play step:", err);
        });
      } catch (err) {
        console.error("[Movement-Debug] Step sound error:", err);
      }
    }, 300);
  }, []);

  const stopFootsteps = useCallback(() => {
    const a = audioRef.current;
    if (a.footstepsInterval) {
      clearInterval(a.footstepsInterval);
      a.footstepsInterval = null;
      console.log("[Movement-Debug] Cleared footsteps interval");
    }
  }, []);

  // Load map coordinates
  useEffect(() => {
    fetch('map_coordinates.json')
      .then(res => res.json())
      .then(data => setMapCoordinates(data))
      .catch(err => console.error('Failed to load map coordinates:', err));
  }, []);

  // Reset data on page load and load gossip from backend
  useEffect(() => {
    const resetAndLoad = async () => {
      try {
        await fetch('/api/reset', { method: 'POST' });
        console.log('NPC data reset on page load');
        const response = await fetch('/api/gossip');
        if (response.ok) {
          const gossipData = await response.json();
          setGossipNetwork(gossipData);
        }
      } catch (err) {
        console.error('Failed to reset/load:', err);
      }
    };
    resetAndLoad();
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/gossip');
        if (response.ok) {
          const gossipData = await response.json();
          setGossipNetwork(gossipData);
        }
      } catch (err) {
        console.error('Failed to load gossip network:', err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Audio initialization
  useEffect(() => {
    console.log("[Audio-Debug] Component mounted, starting audio setup");
    const a = audioRef.current;

    try {
      a.bg = new Audio("/assets/bg_loop.mp3");
      a.bg.addEventListener('ended', () => {
        console.log("[Audio-Debug] BG music ended, restarting");
        a.bg.currentTime = 0;
        a.bg.play().catch(err => console.warn("[Audio-Debug] BG loop failed:", err));
      });
      a.bg.loop = true;
      a.bg.volume = 0.5;
      console.log("[Audio-Debug] BG music setup complete");
    } catch(err) {
      console.error("[Audio-Error] Audio initialization failed:", err);
    }

    const audioStates = { bg: false, interact: false, step: false };

    try {
      console.log("[Audio-Debug] Creating audio objects...");
      a.sfxInteract = new Audio("/assets/sfx_interact.mp3");
      a.sfxInteract.addEventListener('canplaythrough', () => {
        console.log("[Audio-Debug] Interact sound loaded");
        audioStates.interact = true;
      });

      a.sfxStep = new Audio("/assets/sfx_step.mp3");
      a.sfxStep.addEventListener('canplaythrough', () => {
        console.log("[Audio-Debug] Step sound loaded");
        audioStates.step = true;
      });

      // Respect saved music preference when audio is ready
      const applySavedMusicPref = () => {
        const pref = (() => {
          try { return localStorage.getItem('musicOn'); } catch (e) { return null; }
        })();
        const wantMusic = pref === null ? musicOn : (pref === 'true');
        console.log("[Audio-Debug] Applying saved music preference:", wantMusic);
        if (!wantMusic) {
          if (a.bg) {
            try {
              a.bg.pause();
              console.log("[Audio-Debug] BG paused due to saved preference");
            } catch (e) { console.warn("[Audio-Debug] Pause failed:", e); }
          }
        } else {
          // do not force play if browser blocks autoplay; startAudio user gesture will attempt play
          console.log("[Audio-Debug] musicOn=true (will attempt autoplay on user gesture)");
        }
      };

      // Attach small timeout to apply pref after objects created
      setTimeout(applySavedMusicPref, 120);

      // Start audio on user interaction
      const startAudio = () => {
        console.log("[Audio-Debug] User interaction detected, attempting to start audio");
        if (a.audioStarted) {
          console.log("[Audio-Debug] Audio already started, skipping");
          return;
        }

        const wantMusic = (() => {
          try { return localStorage.getItem('musicOn') !== 'false'; } catch (e) { return musicOn; }
        })();

        const tries = [];
        if (wantMusic && a.bg) {
          tries.push(a.bg.play().then(() => console.log("[Audio-Debug] BG play succeeded")).catch(e => console.warn("[Audio-Debug] BG autoplay failed:", e)));
        } else {
          console.log("[Audio-Debug] Not attempting BG play (music disabled)");
        }

        // test other sounds without leaving them playing
        tries.push(a.sfxStep.play().then(() => { a.sfxStep.pause(); console.log("[Audio-Debug] Step sound test successful"); }).catch(e => console.warn("[Audio-Debug] Step sound test failed:", e)));
        tries.push(a.sfxInteract.play().then(() => { a.sfxInteract.pause(); console.log("[Audio-Debug] Interact sound test successful"); }).catch(e => console.warn("[Audio-Debug] Interact sound test failed:", e)));

        Promise.allSettled(tries).then(() => {
          console.log("[Audio-Debug] Audio initialization attempts completed");
          a.audioStarted = true;
        });
      };

      window.addEventListener('click', startAudio);
      window.addEventListener('keydown', startAudio);
      console.log("[Audio-Debug] Added user interaction listeners");

    } catch(err) {
      console.error("[Audio-Error] Audio initialization failed:", err);
    }

    const debugInterval = setInterval(() => {
      console.log("[Audio-Status]", {
        bgExists: !!a.bg,
        bgPlaying: !!a.bg && a.bg.paused === false,
        interactExists: !!a.sfxInteract,
        stepExists: !!a.sfxStep,
        audioStarted: a.audioStarted,
        musicOnSetting: (() => { try { return localStorage.getItem('musicOn'); } catch(e){ return 'err'; } })()
      });
    }, 5000);

    return () => {
      console.log("[Audio-Debug] Cleaning up audio resources");
      clearInterval(debugInterval);
      window.removeEventListener('click', () => {});
      window.removeEventListener('keydown', () => {});
      if (a.bg) {
        a.bg.pause();
        console.log("[Audio-Debug] BG music stopped");
      }
    };
  }, [musicOn]);

  // Keep audio state in sync when musicOn toggles
  useEffect(() => {
    console.log("[Audio-Debug] musicOn changed ->", musicOn);
    try {
      localStorage.setItem('musicOn', musicOn ? 'true' : 'false');
    } catch (e) {
      console.warn("[Audio-Debug] Could not persist musicOn:", e);
    }
    const a = audioRef.current;
    if (a && a.bg) {
      if (musicOn) {
        a.bg.play().then(() => {
          console.log("[Audio-Debug] BG play successful after toggle");
        }).catch(err => {
          console.warn("[Audio-Debug] BG play failed after toggle:", err);
        });
      } else {
        try {
          a.bg.pause();
          console.log("[Audio-Debug] BG paused after toggle");
        } catch (e) {
          console.warn("[Audio-Debug] Pause failed after toggle:", e);
        }
      }
    } else {
      console.log("[Audio-Debug] audioRef.bg not ready yet, saved preference will be applied when ready");
    }
  }, [musicOn]);

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
          // Don't move if chat is visible
          if (!chatVisible) {
            if (keys.current['KeyW'] || keys.current['ArrowUp']) dy -= 1;
            if (keys.current['KeyS'] || keys.current['ArrowDown']) dy += 1;
            if (keys.current['KeyA'] || keys.current['ArrowLeft']) dx -= 1;
            if (keys.current['KeyD'] || keys.current['ArrowRight']) dx += 1;
          }
          const moving = dx !== 0 || dy !== 0;

          // Add movement debugging
          if (DEBUG_MOVEMENT && moving) {
            console.log("[Movement-Debug] Player moving:", {
              dx, dy,
              hasStepSound: !!audioRef.current.sfxStep,
              hasInterval: !!audioRef.current.footstepsInterval
            });
          }

          if (moving) {
            const len = Math.hypot(dx,dy) || 1;
            const move = (playerSpeed * dt);
            pos[0] += (dx/len) * move;
            pos[1] += (dy/len) * move;
            startFootsteps();
          } else {
            stopFootsteps();
          }
          pos[0] = Math.min(Math.max(10, pos[0]), MAP_W - 10);
          pos[1] = Math.min(Math.max(10, pos[1]), MAP_H - 10);
          return { ...ent, pos };
        });
        return next;
      });

      // Update camera, check nearest points, and handle gossip spreading
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
            { x: 1147, y: 700, label: 'Old Ruin 1', id: 'old_ruin_1', description: 'Standing as a grim monument on the edge of the market, these crumbling stones are all that remain of the old senate building, destroyed in the devastating "Senators\' Affair" that led to a bloody revolt years ago. The city tries to forget the tragedy, leaving the ruins overgrown and silent—a place of hushed secrets and a stark warning against challenging the court.' },
            { x: 1621, y: 700, label: 'Old Ruin 2', id: 'old_ruin_2', description: 'Standing as a grim monument on the edge of the market, these crumbling stones are all that remain of the old senate building, destroyed in the devastating "Senators\' Affair" that led to a bloody revolt years ago. The city tries to forget the tragedy, leaving the ruins overgrown and silent—a place of hushed secrets and a stark warning against challenging the court.' },
            { x: 1018, y: 1074, label: 'The Fountain of Elders', id: 'fountain', description: 'The true center of the market square. All paths lead to this sculpted fountain, where water has flowed for generations. It is a natural meeting point for merchants, travelers, and locals alike—a place to rest one\'s feet, to see and be seen, and to listen to the undercurrent of gossip that flows as steadily as the water itself.' },
            { x: 1369, y: 437, label: 'The Royal Court', id: 'royal_court', description: 'A bastion of order and law, the grand Royal Court stands as a symbol of the city\'s enduring power. Its ornate tiled plaza is patrolled by loyal guards, and its marble halls dispense the crown\'s justice. Yet, whispers in the market and the weary expressions of the guards themselves suggest that its principles may be more flexible than the stone from which it is built.' },
            { x: 2728, y: 308, label: 'The Desmos Inn', id: 'desmos_inn', description: 'What was once a humble eatery owned by a foster family has been transformed by Robert Desmos into the city\'s most popular tavern. The Inn is more than a place for drink; it is the city\'s living memory. Every patron leaves a story behind, and Robert, the quiet keeper of these tales, forgets nothing.' },
            { x: 605, y: 482, label: 'The Garden', id: 'garden', description: 'A peaceful garden where locals come to rest and reflect.' },
            { x: 2052, y: 1299, label: 'The Moachivitis Market', id: 'moachivitis_market', description: 'The vibrant heart and soul of the city, built upon the agricultural wealth of the Moachivitis family. The air is thick with the scent of spices and the sound of a hundred conversations. Stalls overflow with goods from every corner of the land, and it is said that anything—or anyone—can be found here if one knows who to ask.' }
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

          // Handle gossip spreading between NPCs
          const npcs = current.filter(ent => ent.type === 'npc');
          const newSharingPairs = [];

          npcs.forEach((npc1, i) => {
            npcs.forEach((npc2, j) => {
              if (i !== j && dist(npc1.pos, npc2.pos) < 100) {
                newSharingPairs.push([npc1.id, npc2.id]);

                // Trigger gossip sharing on backend
                fetch('/api/gossip/share', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ npc1: npc1.id, npc2: npc2.id })
                }).catch(err => console.error('Gossip share failed:', err));
              }
            });
          });

          setSharingPairs(newSharingPairs);
        }
        return current;
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerIdx, updateEntityPos, playerSpeed, pausedNPCId, chatVisible]);

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
        console.log("[Audio-Debug] X key pressed");
        try {
          if (audioRef.current.sfxInteract) {
            console.log("[Audio-Debug] Playing interact sound");
            audioRef.current.sfxInteract.currentTime = 0;
            audioRef.current.sfxInteract.play()
              .then(() => console.log("[Audio-Debug] Interact sound played successfully"))
              .catch(err => console.warn("[Audio-Debug] Interact sound failed:", err));
          } else {
            console.warn("[Audio-Debug] Interact sound not initialized");
          }
        } catch(err) {
          console.error("[Audio-Debug] Error playing interact sound:", err);
        }

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
          { x: 1018, y: 1074, label: 'The Fountain of Elders', id: 'fountain' },
          { x: 1369, y: 437, label: 'The Royal Court', id: 'royal_court' },
          { x: 2728, y: 308, label: 'The Desmos Inn', id: 'desmos_inn' },
          { x: 605, y: 482, label: 'The Garden', id: 'garden' },
          { x: 2052, y: 1299, label: 'The Moachivitis Market', id: 'moachivitis_market' }
        ];

        const nearestBuilding = buildings.find(building => {
          return dist([building.x, building.y], player.pos) <= 80;
        });

        if (nearestBuilding) {
          console.log('Building interaction:', nearestBuilding);
          onTalkRequest && onTalkRequest({ type: 'building', id: nearestBuilding.id, label: nearestBuilding.label, description: nearestBuilding.description });
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [entities, playerIdx, onTalkRequest]);

  // Settings toggle handler
  const toggleMusic = (evt) => {
    evt.stopPropagation();
    const next = !musicOn;
    console.log("[Audio-Settings] toggling music ->", next);
    setMusicOn(next);
    // persistence done in effect
  };

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
          const size = isPlayer ? 86 : 80;

          const player = entities[playerIdx];
          const npcDistance = player ? dist([player.pos[0], player.pos[1]], [ent.pos[0], ent.pos[1]]) : Infinity;
          const isNearNPC = npcDistance <= 80;

          // Check if this NPC is sharing gossip with another NPC
          const isSharing = !isPlayer && entities.some(other =>
            other.type === 'npc' && other.id !== ent.id && dist(ent.pos, other.pos) < 100
          );

          const getEntityImage = (id) => {
            if (id === 'player') return 'assets/nico.png';
            if (id === 'guard' || id === 'guard2') return 'assets/guard_female.png';
            if (id === 'thief') return 'assets/thief.png';
            if (id === 'merchant') return 'assets/merchant.png';
            if (id === 'old_man') return 'assets/old_man.png';
            if (id === 'bartender') return 'assets/bartender.png';
            if (id === 'woman_1') return 'assets/woman_1.png';
            if (id === 'boy') return 'assets/boy.png';
            if (id === 'woman_2') return 'assets/woman_2.png';
            return null;
          };

          const entityImage = getEntityImage(ent.id);

          let filterEffect = "none";
          if (!isPlayer && isNearNPC) {
            filterEffect = "drop-shadow(0 0 30px rgba(255,215,0,1)) drop-shadow(0 0 60px rgba(255,215,0,0.6))";
          } else if (isSharing) {
            filterEffect = "drop-shadow(0 0 20px rgba(128,0,128,1)) drop-shadow(0 0 40px rgba(128,0,128,0.6))";
          }

          return (
            <div key={ent.id} style={{ position: 'absolute', left: ent.pos[0] - size/2, top: ent.pos[1] - size/2 }}>
              {isPlayer && (
                <div style={{
                  position: 'absolute',
                  left: size/2 - 8,
                  top: -20,
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '12px solid #ffff00',
                  zIndex: 50
                }} />
              )}
              <img
                src={entityImage}
                alt={ent.name}
                title={ent.name}
                onClick={() => !isPlayer && isNearNPC && onTalkRequest && onTalkRequest(ent.id)}
                style={{
                  width: size,
                  height: size,
                  filter: filterEffect,
                  cursor: !isPlayer && isNearNPC ? "pointer" : "default",
                  zIndex: isPlayer ? 40 : 35
                }}
              />
              <div style={{
                position: 'absolute',
                left: size/2,
                top: -35,
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                zIndex: 45
              }}>
                {ent.name}
              </div>
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
              { x: 1018, y: 1074, label: 'The Fountain of Elders', type: 'circle' },
              { x: 1369, y: 437, label: 'The Royal Court', type: 'circle' },
              { x: 2728, y: 308, label: 'The Desmos Inn', type: 'circle' },
              { x: 605, y: 482, label: 'The Garden', type: 'circle' },
              { x: 2052, y: 1299, label: 'The Moachivitis Market', type: 'circle' }
            ];
            return markers.map((marker, i) => {
              const distance = player ? dist([player.pos[0], player.pos[1]], [marker.x, marker.y]) : Infinity;
              const isNear = distance <= 80;

              return (
                <g key={i}>
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={isNear ? "8" : "6"}
                    fill="rgba(255,255,255,0.3)"
                    stroke="white"
                    strokeWidth="2"
                    filter={isNear ? "drop-shadow(0 0 8px rgba(255,215,0,0.8))" : "none"}
                  />
                  {isNear && (
                    <text
                      x={marker.x + 12}
                      y={marker.y - 8}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
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

      {/* Minimap */}
      <div className="minimap-box" style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        width: '200px',
        height: '120px',
        background: 'rgba(0,0,0,0.8)',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '8px',
        zIndex: 300
      }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
          <rect width={MAP_W} height={MAP_H} fill="rgba(50,50,50,0.8)" />
          {entities.map(ent => (
            <circle
              key={ent.id}
              cx={ent.pos[0]}
              cy={ent.pos[1]}
              r={ent.type === 'player' ? '12' : '8'}
              fill={ent.type === 'player' ? '#00ff00' : '#ffff00'}
            />
          ))}
          <rect
            x={cameraPos[0]}
            y={cameraPos[1]}
            width={window.innerWidth}
            height={window.innerHeight}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="4"
          />
        </svg>

        {/* Settings button (music toggle) */}
        <button
          className={`minimap-settings-btn ${musicOn ? 'on' : 'off'}`}
          onClick={toggleMusic}
          title={musicOn ? "Music: On (click to mute)" : "Music: Off (click to enable)"}
          aria-pressed={musicOn}
        >
          {/* simple inline gear icon (SVG) */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06A2 2 0 012.28 16.9l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09c.7 0 1.32-.4 1.51-1a1.65 1.65 0 00-.33-1.82L4.3 4.28A2 2 0 016.13 1.45l.06.06a1.65 1.65 0 001.82.33c.7-.3 1.51-.3 2.2 0L12 4.6l1.79-1.52c.69-.3 1.5-.3 2.2 0 .7.3 1.1 1.07.8 1.77l-.33 1.82c.18.6.8 1 1.51 1H21a2 2 0 110 4h-.09c-.7 0-1.32.4-1.51 1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Gossip Network Graph */}
      {showGossipGraph && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          width: '300px',
          height: '280px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 300,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}>
          <div style={{ color: 'white', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
            Gossip Network
          </div>

          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '16px', lineHeight: '1.4' }}>
            Total Gossip: {Object.values(gossipNetwork).reduce((sum, arr) => sum + arr.length, 0)}<br/>
            Active Shares: {sharingPairs.length}
          </div>

          <svg width="268" height="160" style={{ marginBottom: '12px' }}>
            {entities.filter(ent => ent.type === 'npc').map((npc, i) => {
              const x = 35 + (i % 4) * 60;
              const y = 35 + Math.floor(i / 4) * 50;
              const hasGossip = gossipNetwork[npc.id] && gossipNetwork[npc.id].length > 0;
              const isSharing = sharingPairs.some(pair => pair.includes(npc.id));

              return (
                <g key={npc.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill={hasGossip ? '#ef4444' : (isSharing ? '#8b5cf6' : '#06b6d4')}
                    stroke={isSharing ? '#a855f7' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={isSharing ? '2' : '1'}
                    filter={hasGossip ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))' : (isSharing ? 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))' : 'none')}
                  />
                  <text
                    x={x}
                    y={y + 25}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {npc.name.split(' ')[0]}
                  </text>
                  {hasGossip && (
                    <text
                      x={x + 16}
                      y={y - 10}
                      fill="#fbbf24"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {gossipNetwork[npc.id].length}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <button
            onClick={() => setShowGossipGraph(false)}
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Hide Gossip Network
          </button>
        </div>
      )}

      {!showGossipGraph && (
        <button
          onClick={() => setShowGossipGraph(true)}
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            padding: '10px 16px',
            cursor: 'pointer',
            zIndex: 300,
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Show Gossip
        </button>
      )}

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
