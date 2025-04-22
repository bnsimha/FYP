"use client";

import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TerrainControls from "@/components/terrain/TerrainControls";
import { useTerrainStore } from "@/lib/stores/terrainStore";
import { TerrainClient } from "@/lib/grpc/terrainClient";
import { TerrainServiceClient } from "@/generated/TerrainServiceClientPb";
import { TerrainTileRequest, TerrainTileResponse } from "@/generated/terrain_pb";
import { grpc } from "@improbable-eng/grpc-web";

export default function TerrainViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const terrainParams = useTerrainStore((state) => state.parameters);
  const updateTerrainMesh = useTerrainStore((state) => state.updateTerrainMesh);
  const [showControls, setShowControls] = useState(true);
  const client = new TerrainServiceClient('http://localhost:8080', null, {
    transport: grpc.CrossBrowserHttpTransport({ withCredentials: false }),
  });
  const fetchTileData = (): Promise<{ heightmap: Float32Array }> => {
    return new Promise((resolve, reject) => {
      const request = new TerrainTileRequest();
      request.setX(Math.floor(Math.random()*10));
      request.setZ(Math.ceil(Math.random() * (8- 3.5) + 5));
      request.setResolution(64);
      request.setLod(3);
  
      client.getTerrainTile(request, {}, (err: Error | null, response: TerrainTileResponse | null) => {
        if (err) {
          console.error('Error:', err.message);
          reject(err);
        } else if (response) {
          console.log(response.toObject())
          const originalHeightmap = response.getHeightmap_asU8(); // Always get as Uint8Array
          let alignedHeightmap: Float32Array;
  
          if (originalHeightmap.byteOffset % 4 === 0) {
            // Already aligned, create Float32Array directly
            alignedHeightmap = new Float32Array(
              originalHeightmap.buffer,
              originalHeightmap.byteOffset,
              originalHeightmap.byteLength / Float32Array.BYTES_PER_ELEMENT
            );
          } else {
            // Not aligned, create a new aligned buffer
            const alignedBuffer = new Uint8Array(originalHeightmap.byteLength);
            alignedBuffer.set(originalHeightmap); // Copy data into the new buffer
            alignedHeightmap = new Float32Array(
              alignedBuffer.buffer,
              alignedBuffer.byteOffset,
              alignedBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT
            );
          }
          console.log('Decoded Heightmap:', alignedHeightmap); // Updated to log the correct variable
            console.log('Decoded Heightmap Length:', alignedHeightmap.length); // Updated to log the correct variable
  
          resolve({ heightmap: alignedHeightmap });
        }
      });
    });
  };

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    
    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Set up controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    //scene.add(gridHelper);
    
    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Generate and render the terrain mesh based on terrain parameters
    const generateTerrainMesh = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Remove any existing terrain mesh
        const existingMesh = scene.getObjectByName("terrainMesh");
        if (existingMesh) {
          scene.remove(existingMesh);
          if (existingMesh instanceof THREE.Mesh) {
            existingMesh.geometry.dispose();
          }
          if (existingMesh instanceof THREE.Mesh && existingMesh.material) {
            if (Array.isArray(existingMesh.material)) {
              existingMesh.material.forEach((mat) => mat.dispose());
            } else {
              existingMesh.material.dispose();
            }
          }
        }
        
        //Request terrain data from the gRPC service
     
        // const terrainClient = new TerrainClient();
        // const tileData = await terrainClient.getTerrainTile({
        //   x: 0,
        //   z: 0,
        //   resolution: terrainParams.resolution,
        //   lod: terrainParams.lod
        // });
        // console.log("Dummy heightmap" , tileData)
//         let tileData:any;
       
//             try {
//               console.log('GetTerrainTile button clicked');
//               const request = new TerrainTileRequest();
//               request.setX(0);
//               request.setZ(0);
//               request.setResolution(64);
//               request.setLod(1);
           
              
//             client.getTerrainTile(request, {}, (err: Error | null, response: TerrainTileResponse | null) => {
//               if (err) {
//                 console.error('Error:', err.message);
//               } else if (response) {
//                 const responseObject = response;
//                 console.log('Heightmap Uint8Array:', responseObject.getHeightmap());
// console.log('ByteOffset:', (responseObject.getHeightmap() as Uint8Array).byteOffset);
// const originalHeightmap = response.getHeightmap_asU8(); // Always get as Uint8Array
// let alignedHeightmap: Float32Array | undefined;

// if (originalHeightmap.byteOffset % 4 === 0) {
//   // Already aligned, create Float32Array directly
//   alignedHeightmap = new Float32Array(
//     originalHeightmap.buffer,
//     originalHeightmap.byteOffset,
//     originalHeightmap.byteLength / Float32Array.BYTES_PER_ELEMENT
//   );
// } else {
//   // Not aligned, create a new aligned buffer
//   const alignedBuffer = new Uint8Array(originalHeightmap.byteLength);
//   alignedBuffer.set(originalHeightmap); // Copy data into the new buffer
//   alignedHeightmap = new Float32Array(
//     alignedBuffer.buffer,
//     alignedBuffer.byteOffset,
//     alignedBuffer.byteLength / Float32Array.BYTES_PER_ELEMENT
//   );
// }

// tileData = {
//   heightmap: alignedHeightmap,
// };

//     console.log('Decoded Heightmap:', tileData.heightmap);
//     console.log('Decoded Heightmap Length:', tileData.heightmap.length);
//               }
//             });
//              } catch (error) {
//               console.error("Error in getTerrainTile:", error);
//             }
           // Fetch tile data
    const tileData = await fetchTileData();
        // Create a new terrain mesh from the received data
        if (tileData && tileData.heightmap) {
          const terrainGeometry = new THREE.PlaneGeometry(
            10, 
            10, 
            terrainParams.resolution , 
            terrainParams.resolution
          );
          terrainGeometry.rotateX(-Math.PI / 2);
        
          // Apply heightmap data to the geometry vertices
          const positions = terrainGeometry.attributes.position.array;
          console.log("Geometry vertex count:", terrainGeometry.attributes.position.count);
          console.log(" this is the geometry's arra7y",positions)
          const heights = tileData.heightmap;
        
          for (let i = 0; i < heights.length; i++) {
            // Update Y coordinate (height) for each vertex
            positions[i * 3 + 1] = heights[i] * terrainParams.amplitude ;
          }
        
          // Update geometry
          terrainGeometry.attributes.position.needsUpdate = true;
          terrainGeometry.computeVertexNormals();
        
          // Create material with proper shading
          const terrainMaterial = new THREE.MeshStandardMaterial({
            color: 0x3b9f86,
            wireframe: terrainParams.wireframe,
            flatShading: terrainParams.flatShading,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.8,
          });
        
          // Create mesh
          const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
          terrainMesh.name = "terrainMesh";
          terrainMesh.receiveShadow = true;
          terrainMesh.castShadow = true;
        
          // Add to scene
          scene.add(terrainMesh);
        
          // Update global terrain mesh reference
          updateTerrainMesh(terrainMesh);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error generating terrain:", err);
        setError("Failed to generate terrain");
        setIsLoading(false);
      }
    };
    
    // Generate initial terrain
    generateTerrainMesh();
    
    // Watch for parameter changes
    const unsubscribe = useTerrainStore.subscribe((state) => {
      const newParams = state.parameters;
      if (JSON.stringify(newParams) !== JSON.stringify(terrainParams)) {
        generateTerrainMesh();
      }
    });
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      // Update camera
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      
      // Update renderer
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          object.material.dispose();
        }
      });
      
      controls.dispose();
      renderer.dispose();
    };
  }, [terrainParams, updateTerrainMesh]);
  
  return (
    <div className="relative w-full h-screen">
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Generating terrain...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 right-4 bg-destructive p-3 rounded-md text-destructive-foreground">
          {error}
        </div>
      )}
      
      <div className={`absolute top-4 right-4 md:block ${showControls ? 'block' : 'hidden'}`}>
        <TerrainControls onToggle={() => setShowControls(!showControls)} />
      </div>
      
      {!showControls && (
        <button 
          onClick={() => setShowControls(true)}
          className="absolute top-4 right-4 bg-primary/80 p-2 rounded-md hover:bg-primary"
          aria-label="Show controls"
        >
          <span className="text-sm text-primary-foreground">Controls</span>
        </button>
      )}
    </div>
  );
}