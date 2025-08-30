
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function PlayerCube(){
  const ref = useRef();
  // simple bob animation
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.8;
  });
  return (
    <mesh ref={ref} position={[0, 0.6, 0]}>
      <boxGeometry args={[0.8,0.8,0.8]} />
      <meshStandardMaterial />
    </mesh>
  );
}

function NPCCube({ onClick }){
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.rotation.x += delta * 0.6;
    ref.current.rotation.z += delta * 0.4;
  });
  return (
    <mesh ref={ref} position={[2,0.6,0]} onClick={() => onClick && onClick('bartender')}>
      <boxGeometry args={[0.9,0.9,0.9]} />
      <meshStandardMaterial color={'orange'} />
    </mesh>
  );
}

export default function GameCanvas({ onTalk }){
  return (
    <div className="canvas-wrap">
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5,10,5]} intensity={0.8} />
        <mesh rotation-x={-Math.PI/2} position={[0,0,0]}>
          <planeGeometry args={[20,20]} />
          <meshStandardMaterial color={'#228B22'} />
        </mesh>

        <PlayerCube />
        <NPCCube onClick={onTalk} />

      </Canvas>
    </div>
  );
}

