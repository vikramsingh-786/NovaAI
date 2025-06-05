"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, TorusKnot } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/app/context/ThemeContext'; 

function PulsatingBrain({ theme }: { theme: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(0);

  const material = useMemo(() => {
    let color;
    switch (theme) {
      case 'light':
        color = new THREE.Color("#6366F1"); 
        break;
      case 'deepDark':
        color = new THREE.Color("#14B8A6"); 
        break;
      case 'current':
      default:
        color = new THREE.Color("#A855F7"); 
        break;
    }
    return new THREE.MeshStandardMaterial({ 
      color: color, 
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.1,
    });
  }, [theme]);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
      const scale = 1 + Math.sin(timeRef.current * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });
  return (
    <TorusKnot ref={meshRef} args={[0.8, 0.25, 200, 20]} material={material} castShadow receiveShadow>
    </TorusKnot>
  );
}

export default function InteractiveBrainCanvas() {
  const { theme } = useTheme(); 

  return (
    <Canvas 
        shadows 
        camera={{ position: [0, 0, 4], fov: 50 }} 
        style={{ touchAction: 'none' }} 
    >
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <PulsatingBrain theme={theme} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
    </Canvas>
  );
}