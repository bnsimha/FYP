"use client"
import { TerrainParametersRequest, TerrainStreamRequest, TerrainTileRequest, TerrainTileResponse } from '@/generated/terrain_pb';
import { TerrainServiceClient } from '@/generated/TerrainServiceClientPb';
import { grpc } from '@improbable-eng/grpc-web';
import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { button, Leva, useControls } from 'leva'
import { Grid, OrbitControls } from '@react-three/drei';
import { AxesHelper } from 'three';
import { useTerrainStore } from '@/lib/stores/terrainStore';

interface TerrainParams{
    Scale: number;
    Amplitude: number;
    Octaves: number;
    Persistence: number;
    Lacunarity: number;
    Seed: number;
  }


  function TerrainTile({ x, z, heightmap }: { x:number, z:number, heightmap:Float32Array }) {
    const ref = useRef<THREE.Mesh>(null!);
  
    // Whenever heightmap changes, rewrite the plane’s vertices
    useEffect(() => {
      const mesh = ref.current!;
      const pos = (mesh.geometry as THREE.PlaneGeometry).attributes.position.array as Float32Array;
      for (let i = 0; i < heightmap.length; i++) {
        pos[i*3 + 1] = heightmap[i];
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }, [heightmap]);
  
    return (
      <mesh
        ref={ref}
        name={`tile_${x}_${z}`}
        position={[x*10, 0, z*10]}
        rotation-x={-Math.PI/2}
      >
        <planeGeometry args={[10,10,64,64]} />
        <meshStandardMaterial color={0x3b9f86} flatShading side={THREE.DoubleSide} />
      </mesh>
    );
  }

  

const TileRenderer = () => {
    
    const [heightmap, setHeightmap] = useState<Float32Array|null>(null);
      const client = new TerrainServiceClient('http://localhost:8080', null, {
        transport: grpc.CrossBrowserHttpTransport({ withCredentials: false }),
      });
      const {scene}=useThree();
      const iniSeed=Math.random()*11266
      const [mathIdx, setmathIdx] = useState<number>(0)
const [terrainParams, setTerrainParams] = useState<TerrainParams>({ Scale: 0.08, Amplitude: 1.5, Octaves: 5, Persistence: 0.2, Lacunarity: 4, Seed: iniSeed });

// const mathFunc= (i:number)=>{
//     if(mathIdx==0)
//     {
//         return 1;
//     } else if (mathIdx==1)
//     {
//         return Math.random();
//     }
//     else{
//         return Math.sin(i);
//     }
// }
useControls('Terrain Parameters',()=>({
    Scale: {
      value: terrainParams.Scale,
      min: 0.01,
      max: 5,
      step: 0.01,
      onChange: (value) => setTerrainParams((prev) => ({ ...prev, Scale: value })),
    },
    Amplitude: {
      value: terrainParams.Amplitude,
      min: 0.1,
      max: 20,
      step: 0.5,
      onChange: (value) => setTerrainParams((prev) => ({ ...prev, Amplitude: value })),
    },
    Octaves: {
      value: terrainParams.Octaves,
      min: 1,
      max: 20,
      step: 1,
      onChange: (value) => setTerrainParams((prev) => ({ ...prev, Octaves: value })),
    },
    Persistence: {
      value: terrainParams.Persistence,
      min: 0.1,
      max: 1,
      step: 0.1,
      onChange: (value) => setTerrainParams((prev) => ({ ...prev, Persistence: value })),
    },
    Lacunarity: {
      value: terrainParams.Lacunarity,
      min: 1,
      max: 20,
      step: 0.5,
      onChange: (value) => setTerrainParams((prev) => ({ ...prev, Lacunarity: value })),
    },
  }));

//   useControls('Additinal MathFuncs', ()=>({

//     Normal: {
//         value: false, // Checkbox starts unchecked
//         onChange: (value) => {
//           if (value) {
//             setmathIdx(0); // Set state to 0 when checked
//             console.log('Normal selected');
//           }
//         },
//       },
//       Random: {
//         value: false, // Checkbox starts unchecked
//         onChange: (value) => {
//           if (value) {
//             setmathIdx(1); // Set state to 1 when checked
//             console.log('Random selected');
//           }
//         },
//       },
//       Sin: {
//         value: false, // Checkbox starts unchecked
//         onChange: (value) => {
//           if (value) {
//             setmathIdx(2); // Set state to 2 when checked
//             console.log('Sin selected');
//           }
//         },
//       },
//   }));

  useEffect(() => {
    updateParams();
    getTerrainTile(0,0,64,1)
  }, [terrainParams]);


      const getTerrainTile = async (x:number,z:number,resolution:number, lod:number)=>{
        const request = new TerrainTileRequest();
        request.setX(x);
        request.setZ(z);
        request.setResolution(resolution);
        request.setLod(lod);
        try{
            const responseTile = await client.getTerrainTile(request);
            const originalHeightmap = responseTile.getHeightmap_asU8(); // Always get as Uint8Array
            let alignedHeightmap: Float32Array;
    
            if (originalHeightmap.byteOffset % 4 === 0) {
              alignedHeightmap = new Float32Array(
                originalHeightmap.buffer,
                originalHeightmap.byteOffset,
                originalHeightmap.byteLength / Float32Array.BYTES_PER_ELEMENT
              );
            } else {
              const alignedBuffer = new Uint8Array(originalHeightmap.byteLength);
              alignedBuffer.set(originalHeightmap); // Copy data into the new buffer
              alignedHeightmap = new Float32Array(
                alignedBuffer.buffer,
                alignedBuffer.byteOffset,
                alignedBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT
              );
            }
             addTileToScene(x, z, alignedHeightmap);
            //setHeightmap(alignedHeightmap);
          
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching terrain tile:', error.message);
            } else {
                console.error('Error fetching terrain tile:', error);
            }
        }
      }        
          const addTileToScene = (x: number, z: number, heightmap: Float32Array) => {
            const tileSize = 10; 
            const resolution = 64;
        
            const existingTile = scene.getObjectByName(`tile_${x}_${z}`);
            if (existingTile) {
              scene.remove(existingTile);
              (existingTile as THREE.Mesh).geometry.dispose(); // Dispose of geometry to free memory
              (existingTile as THREE.Mesh).geometry.dispose(); // Dispose of material to free memory
            }


            const terrainGeometry = new THREE.PlaneGeometry(
              tileSize,
              tileSize,
              resolution,
              resolution
            );
            terrainGeometry.rotateX(-Math.PI / 2);
        
            const positions = terrainGeometry.attributes.position.array;
            for (let i = 0; i < heightmap.length; i++) {
              positions[i * 3 + 1] = heightmap[i];
            }
        
            terrainGeometry.attributes.position.needsUpdate = true;
            terrainGeometry.computeVertexNormals();
        
            const terrainMaterial = new THREE.MeshStandardMaterial({
            //   map: texture,
               color: 0x3b9f86,
              wireframe: false,
              flatShading: true,
              side: THREE.DoubleSide,
            });
        
            const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
            terrainMesh.position.set(x * tileSize, 0, z * tileSize);
            terrainMesh.name = `tile_${x}_${z}`;
        
            scene.add(terrainMesh);
          };

          const updateParams=async()=>{
            const requestParams=new TerrainParametersRequest();
requestParams.setScale(terrainParams.Scale)
requestParams.setAmplitude(terrainParams?.Amplitude)
requestParams.setOctaves(terrainParams.Octaves)
requestParams.setPersistence(terrainParams.Persistence)
requestParams.setLacunarity(terrainParams.Lacunarity)
// requestParams.setSeed(terrainParams.Seed)


            const newParams = await client.updateTerrainParameters(requestParams);
            if(newParams.getSuccess()){
                console.log(requestParams)
                console.log('Terrain parameters updated successfully');
              // await getTerrainTile(0, 0, 64, 1);
            } else {

                console.error('Failed to update terrain parameters');
            }
          }

//           useFrame(() => {

// if(tile==0)
//     getTerrainTile(0, 0, 64, 1);
// setTile(1);


// });
  // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

  return (
    <>
   
    <color attach="background" args={['black']} />
  <OrbitControls />
  <directionalLight
          castShadow
          intensity={5}
          position={[-2, 5, -3]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={3}
          shadow-camera-far={8}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}
          shadow-bias={-0.005}
          shadow-radius={4}
        />
        <ambientLight intensity={0.5} />
        
        {/* {heightmap && <TerrainTile x={0} z={0} heightmap={heightmap} />} */}
      
    </>
  )
}

export default TileRenderer