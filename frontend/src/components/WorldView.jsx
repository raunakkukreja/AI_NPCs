// frontend/src/components/WorldView.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/*
  WorldView: pointer-lock + WASD + mouse-look, NPCs, "Press X to interact" hint.
  Interaction key: X (dispatches event with camera position).
*/

const CHARACTERS = [
  { id: "player", name: "You", type: "player", position: [0, 0.5, 0], color: "skyblue" },
  { id: "moody_old_man", name: "Dorian (Old Man)", type: "npc", position: [2, 0.5, -2], color: "orange" },
  { id: "helios", name: "Helios (Former Prisoner)", type: "npc", position: [-3, 0.5, 1], color: "limegreen" },
  { id: "merchant", name: "Merek (Merchant)", type: "npc", position: [4, 0.5, 3], color: "gold" }
];

function NPCMesh({ npc, inRange, onClick }) {
  return (
    <mesh position={npc.position} onClick={() => onClick && onClick(npc.id)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={npc.color}
        emissive={inRange ? "#ffd54f" : "#000000"}
        emissiveIntensity={inRange ? 0.6 : 0}
      />
    </mesh>
  );
}

function PlayerController({ onPositionChange }) {
  const { camera, gl } = useThree();
  const direction = useRef(new THREE.Vector3());
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const locked = useRef(false);

  const speed = 4.0; // units per second
  const lookSensitivity = 0.0025;

  useEffect(() => {
    camera.position.set(0, 1.6, 6);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  // keyboard for movement and interaction (X)
  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === "KeyW") moveState.current.forward = true;
      if (e.code === "KeyS") moveState.current.backward = true;
      if (e.code === "KeyA") moveState.current.left = true;
      if (e.code === "KeyD") moveState.current.right = true;
      if (e.code === "KeyX") {
        // dispatch a custom event with current camera position so distance checks are accurate
        const pos = camera.position.clone();
        const evt = new CustomEvent("game-interact-request", {
          detail: { position: [pos.x, pos.y, pos.z] }
        });
        window.dispatchEvent(evt);
      }
    }
    function onKeyUp(e) {
      if (e.code === "KeyW") moveState.current.forward = false;
      if (e.code === "KeyS") moveState.current.backward = false;
      if (e.code === "KeyA") moveState.current.left = false;
      if (e.code === "KeyD") moveState.current.right = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [camera]);

  // pointer lock & mouse look
  useEffect(() => {
    function onPointerDown() {
      if (!locked.current) {
        gl.domElement.requestPointerLock();
      }
    }
    function onPointerLockChange() {
      locked.current = document.pointerLockElement === gl.domElement;
    }
    function onMouseMove(e) {
      if (!locked.current) return;
      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;
      camera.rotation.y -= movementX * lookSensitivity;
      camera.rotation.x -= movementY * lookSensitivity;
      const max = Math.PI / 2 - 0.05;
      const min = -max;
      camera.rotation.x = Math.max(min, Math.min(max, camera.rotation.x));
    }
    gl.domElement.addEventListener("mousedown", onPointerDown);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      gl.domElement.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [gl, camera]);

  useFrame((state, delta) => {
    direction.current.set(0, 0, 0);
    const ms = moveState.current;
    if (ms.forward) direction.current.z = -1;
    if (ms.backward) direction.current.z = 1;
    if (ms.left) direction.current.x = -1;
    if (ms.right) direction.current.x = 1;
    if (direction.current.lengthSq() > 0) direction.current.normalize();

    const vector = new THREE.Vector3(direction.current.x, 0, direction.current.z);
    vector.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
    vector.multiplyScalar(speed * delta);

    camera.position.add(vector);

    if (onPositionChange) onPositionChange(camera.position.clone());
  });

  return null;
}

/*
  Scene: this component is rendered *inside* <Canvas> so it can safely use R3F hooks.
  It calculates nearest NPC, computes screen projection and calls onNearestUpdate to
  let parent render the UI hint (outside the canvas).
*/
function Scene({ npcs, onNearestUpdate, onTalkRequest, onPositionChange }) {
  const { camera } = useThree();
  const [nearest, setNearest] = useState(null);

  useFrame(() => {
    const camPos = camera.position;
    let best = null;
    let bd = Infinity;
    npcs.forEach((npc) => {
      const p = new THREE.Vector3(...npc.position);
      const d = p.distanceTo(camPos);
      if (d < bd) {
        bd = d;
        best = npc;
      }
    });

    if (best && bd <= 6) {
      // project to screen coordinates
      const v = new THREE.Vector3(...best.position).project(camera);
      const x = (v.x + 1) / 2 * window.innerWidth;
      const y = (-v.y + 1) / 2 * window.innerHeight;
      const info = { npc: best, dist: bd, screen: [x, y] };
      setNearest(info);
      onNearestUpdate && onNearestUpdate(info);
    } else {
      setNearest(null);
      onNearestUpdate && onNearestUpdate(null);
    }
  });

  // respond to click on mesh (handled by NPCMesh onClick which calls onTalkRequest)
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />

      {/* ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color={"#556b2f"} />
      </mesh>

      <PlayerController onPositionChange={onPositionChange} />

      {npcs.map((npc) => {
        const inRange = nearest && nearest.npc && nearest.npc.id === npc.id && nearest.dist <= 2.2;
        return <NPCMesh key={npc.id} npc={npc} inRange={inRange} onClick={(id) => onTalkRequest(id)} />;
      })}
    </>
  );
}

export default function WorldView({ onTalkRequest }) {
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 1.6, 6));
  const npcs = CHARACTERS.filter((c) => c.type === "npc");
  const [nearestInfo, setNearestInfo] = useState(null);

  const handlePositionChange = useCallback((pos) => {
    setPlayerPos(pos);
  }, []);

  // --- THIS EFFECT listens for the X-key event and triggers onTalkRequest ---
  useEffect(() => {
    function onGameInteract(e) {
      const camArr = e && e.detail && e.detail.position ? e.detail.position : null;
      const camPos = camArr ? new THREE.Vector3(...camArr) : playerPos;
      let nearest = null;
      let bestDist = Infinity;
      npcs.forEach((npc) => {
        const p = new THREE.Vector3(...npc.position);
        const d = p.distanceTo(camPos);
        if (d < bestDist) {
          bestDist = d;
          nearest = npc;
        }
      });
      if (nearest && bestDist <= 2.2) {
        // call up to App
        onTalkRequest && onTalkRequest(nearest.id);
      } else {
        window.dispatchEvent(new CustomEvent("game-interact-failed", { detail: { distance: bestDist } }));
      }
    }
    window.addEventListener("game-interact-request", onGameInteract);
    return () => window.removeEventListener("game-interact-request", onGameInteract);
  }, [npcs, playerPos, onTalkRequest]);

  return (
    <div className="canvas-wrap" style={{ height: "100vh", width: "100%" }}>
      <Canvas camera={{ position: [0, 1.6, 6], fov: 60 }}>
        <Scene
          npcs={npcs}
          onNearestUpdate={(info) => setNearestInfo(info)}
          onTalkRequest={onTalkRequest}
          onPositionChange={handlePositionChange}
        />
      </Canvas>

      {/* floating "Press X" hint */}
      {nearestInfo && nearestInfo.dist <= 2.2 && (
        <div
          style={{
            position: "absolute",
            left: nearestInfo.screen[0] + "px",
            top: nearestInfo.screen[1] + "px",
            transform: "translate(-50%, -120%)",
            zIndex: 60,
            pointerEvents: "none",
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            padding: "6px 8px",
            borderRadius: "6px"
          }}
        >
          Press <strong>X</strong> to interact
        </div>
      )}
    </div>
  );
}
