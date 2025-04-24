"use client"
import TerrainViewer from "@/components/terrain/TerrainViewer";
import TileRenderer from "@/components/terrain/TileRenderer";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-1 relative">

      <Leva collapsed={false} />
               <Canvas
                 shadows
                 camera={{ position: [0, 2, -10], fov: 75 }}
                 style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
                 // onCreated={({ gl, scene }) => {
                 //   scene.background = new THREE.Color(0x5e5d5d)
                 //   scene.fog = new THREE.Fog(0x5e5d5d, 2, 20)
                 //   gl.setPixelRatio(window.devicePixelRatio)
                 //   gl.toneMapping = THREE.ACESFilmicToneMapping
                 //   gl.toneMappingExposure = 0.5
                 // }}
               >
                <TileRenderer/>

               </Canvas>
      </div>
    </main>
  );
}