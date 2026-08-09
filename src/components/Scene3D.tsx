import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { MeshDistortMaterial } from '@react-three/drei';

function ParticleGalaxy() {
  const ref = useRef<THREE.Points>(null);
  const [positions, colors] = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorPalette = [
      new THREE.Color('#00ffff'),
      new THREE.Color('#ff00ff'),
      new THREE.Color('#ffff00'),
      new THREE.Color('#00ff88'),
      new THREE.Color('#ff0088'),
    ];

    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 15 + 2;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingTorus() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.3;
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={ref} position={[0, 0, 0]}>
        <torusKnotGeometry args={[1.5, 0.4, 200, 32]} />
        <MeshDistortMaterial
          color="#00ffff"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.9}
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </Float>
  );
}

function FloatingCrystal({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.5;
      ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={ref} position={position} scale={scale}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          transmission={0.6}
          thickness={0.5}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    </Float>
  );
}

function OrbitingSphere({ radius, speed, color, size = 0.3 }: { radius: number; speed: number; color: string; size?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed;
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      ref.current.position.y = Math.sin(t * 2) * 0.5;
    }
  });
  return (
    <Trail width={0.5} length={6} color={color} attenuation={(t) => t * t}>
      <mesh ref={ref}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </Trail>
  );
}

function HolographicRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[3, 0.05, 16, 100]} />
      <meshBasicMaterial color="#ff00ff" transparent opacity={0.6} />
    </mesh>
  );
}

function GridFloor() {
  return (
    <group position={[0, -3, 0]}>
      <gridHelper args={[40, 40, '#00ffff', '#00ffff']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#000033" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Title3D() {
  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <Text
        position={[0, 3.5, -2]}
        fontSize={0.8}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#ff00ff"
      >
        NEXUS
      </Text>
      <Text
        position={[0, 2.7, -2]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#00ffff"
      >
        منصة الأبعاد الثلاثية
      </Text>
    </Float>
  );
}

function DataStream() {
  const groupRef = useRef<THREE.Group>(null);
  const lines = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      y: (i - 6) * 0.4,
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <mesh key={i} position={[0, line.y, -5]}>
          <boxGeometry args={[20, 0.02, 0.02]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#00ffff' : '#ff00ff'} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene3D({ asBackground = false }: { asBackground?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 60 }}
      gl={{ antialias: true, alpha: asBackground }}
      style={asBackground ? { position: 'absolute', inset: 0, pointerEvents: 'none' } : undefined}
      onCreated={({ gl }) => {
        gl.setClearColor(asBackground ? '#000000' : '#000011', asBackground ? 0 : 1);
      }}
    >
      <fog attach="fog" args={['#000033', 10, 30]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
      <pointLight position={[-10, -5, 5]} intensity={1.5} color="#ff00ff" />
      <pointLight position={[0, 5, -10]} intensity={1} color="#ffff00" />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <Title3D />
      <ParticleGalaxy />
      <FloatingTorus />
      <HolographicRing />
      <GridFloor />
      <DataStream />

      <FloatingCrystal position={[-3.5, 1.5, 0]} color="#00ffff" scale={1} />
      <FloatingCrystal position={[3.5, 1.5, 0]} color="#ff00ff" scale={1} />
      <FloatingCrystal position={[-2, -1, 2]} color="#ffff00" scale={0.7} />
      <FloatingCrystal position={[2, -1, 2]} color="#00ff88" scale={0.7} />
      <FloatingCrystal position={[0, 3, -3]} color="#ff0088" scale={0.6} />

      <OrbitingSphere radius={3.5} speed={0.8} color="#00ffff" size={0.2} />
      <OrbitingSphere radius={4.5} speed={0.5} color="#ff00ff" size={0.15} />
      <OrbitingSphere radius={5} speed={-0.3} color="#ffff00" size={0.18} />
      <OrbitingSphere radius={3} speed={-0.7} color="#00ff88" size={0.12} />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#000033" transparent opacity={0.9} />
      </mesh>

      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.1} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration offset={[0.002, 0.002]} blendFunction={BlendFunction.NORMAL} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={4}
        maxDistance={15}
      />
    </Canvas>
  );
}
