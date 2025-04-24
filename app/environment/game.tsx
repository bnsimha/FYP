'use client'

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree} from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei';
import { OrbitControls, Sky, useGLTF, useAnimations, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { Leva, useControls } from 'leva'
import { TerrainServiceClient } from '@/generated/TerrainServiceClientPb';
import { grpc } from '@improbable-eng/grpc-web';
import { TerrainStreamRequest, TerrainTileResponse } from '@/generated/terrain_pb';
import { Physics, useHeightfield, useSphere } from '@react-three/cannon';

// Type for GLTF with animations
type GLTFResult = ReturnType<typeof useGLTF>

// Character component: loads model, manages animations and movement
// const Character: React.FC = () => {
//   const gltf = useGLTF('./Soldier.glb') as any
//   const { actions, mixer } = useAnimations(gltf.animations, gltf.scene)
//   const currentAction = useRef<string>('Idle')
//   const controls = useRef({
//     key: [0, 0, 0] as [number, number, number], // [forward/back, left/right, run]
//     position: new THREE.Vector3(),
//     targetQuat: new THREE.Quaternion(),
//     moveVec: new THREE.Vector3(),
//     fade: 0.5,
//     walkSpeed: 1.8,
//     runSpeed: 5,
//     turnSpeed: 0.05,
//   })

//   // GUI toggles
//   const { showSkeleton, fixeTransition } = useControls({
//     showSkeleton: false,
//     fixeTransition: true,
//   })

//   // Setup skeleton helper and play initial Idle
//   useEffect(() => {
//     actions.Idle?.reset().fadeIn(0.2).play()
//     const skeleton = new THREE.SkeletonHelper(gltf.scene)
//     skeleton.visible = showSkeleton
//     gltf.scene.add(skeleton)
//     return () => {
//       gltf.scene.remove(skeleton)
//     }
//   }, [])

//   // Toggle skeleton visibility
//   useEffect(() => {
//     gltf.scene.traverse(obj => {
//       if ((obj as THREE.SkeletonHelper).isSkeletonHelper) {
//         ;(obj as THREE.SkeletonHelper).visible = showSkeleton
//       }
//     })
//   }, [showSkeleton])

//   // Listen to keyboard
//   useEffect(() => {
//     const down = (e: KeyboardEvent) => {
//       const k = controls.current.key
//       switch (e.code) {
//         case 'KeyW': case 'ArrowUp': k[0] = 1; break
//         case 'KeyS': case 'ArrowDown': k[0] = -1; break
//         case 'KeyA': case 'ArrowLeft': k[1] = -1; break
//         case 'KeyD': case 'ArrowRight': k[1] = 1; break
//         case 'ShiftLeft': case 'ShiftRight': k[2] = 1; break
//       }
//     }
//     const up = (e: KeyboardEvent) => {
//       const k = controls.current.key
//       switch (e.code) {
//         case 'KeyW': case 'ArrowUp': if (k[0] === 1) k[0] = 0; break
//         case 'KeyS': case 'ArrowDown': if (k[0] === -1) k[0] = 0; break
//         case 'KeyA': case 'ArrowLeft': if (k[1] === -1) k[1] = 0; break
//         case 'KeyD': case 'ArrowRight': if (k[1] === 1) k[1] = 0; break
//         case 'ShiftLeft': case 'ShiftRight': k[2] = 0; break
//       }
//     }
//     window.addEventListener('keydown', down)
//     window.addEventListener('keyup', up)
//     return () => {
//       window.removeEventListener('keydown', down)
//       window.removeEventListener('keyup', up)
//     }
//   }, [])

//   // Update loop: handle animation transitions and movement
//   useFrame((state, delta) => {
//     const c = controls.current
//     const [fwd, strafe, isRun] = c.key
//     const isMoving = fwd !== 0 || strafe !== 0
//     const nextAction = isMoving ? (isRun ? 'Run' : 'Walk') : 'Idle'

//     // Transition animations when action changes
//     if (currentAction.current !== nextAction) {
//       const prev = actions[currentAction.current]
//       const next = actions[nextAction]
//       if (next) {
//         if (fixeTransition) {
//           prev?.fadeOut(c.fade)
//           next.reset().fadeIn(c.fade).play()
//         } else {
//           prev?.fadeOut(c.fade)
//           next.reset().fadeIn(c.fade).play()
//         }
//         currentAction.current = nextAction
//       }
//     }

//     // Movement: calculate direction in world space
//     if (isMoving && currentAction.current !== 'Idle') {
//       // forward is along -Z in Three.js
//       c.moveVec.set(strafe, 0, -fwd)
//       const speed = isRun ? c.runSpeed : c.walkSpeed
//       c.moveVec.multiplyScalar(speed * delta)

//       // Rotate direction by camera yaw
//       const yaw = state.camera.rotation.y
//       c.moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)

//       // Update position and camera
//       c.position.add(c.moveVec)
//       state.camera.position.add(c.moveVec)
//       gltf.scene.position.copy(c.position)

//       // Rotate model to movement direction
//       const targetDirection = c.moveVec.clone().normalize()
//       if (targetDirection.lengthSq() > 0) {
//         const targetQuat = new THREE.Quaternion().setFromUnitVectors(
//           new THREE.Vector3(0, 0, -1),
//           targetDirection
//         )
//         gltf.scene.quaternion.slerp(targetQuat, c.turnSpeed)
//       }

//       // Keep camera looking at the character
//       // const cameraOffset = new THREE.Vector3(0, 2, -5); // Adjust offset as needed
//       // const rotatedOffset = cameraOffset.applyQuaternion(gltf.scene.quaternion); // Rotate offset by character's rotation
//       // state.camera.position.copy(c.position).add(rotatedOffset);
//       // state.camera.lookAt(c.position.x, c.position.y, c.position.z); // Look at the character
//        state?.controls?.target.copy(c.position).add(new THREE.Vector3(0, 0, 0))

//   //   const forward = new THREE.Vector3(0, 0, -1)
//   //   .applyQuaternion(gltf.scene.quaternion)
//   //   .normalize()

//   // // desired camera offset relative to character
//   // const desiredCamPos = c.position
//   //   .clone()
//   //   .add(new THREE.Vector3(0, 2, 0))                  // up
//   //   .add(forward.clone().multiplyScalar(-5))          // behind

//   // // desired look-at point
//   // const desiredTarget = c.position
//   //   .clone()
//   //   .add(forward.clone().multiplyScalar(10))         // ahead

//   // // time-based smoothing factor (damping)
//   // const tau = 5         // larger = snappier, smaller = more floaty
//   // const t   = 1 - Math.exp(-tau * delta)

//   // // smoothly move camera & controls.target
//   // state.camera.position.lerp(desiredCamPos, t)
//   // state.controls.target.lerp(desiredTarget, t)

//   // ensure camera is actually looking at the (smoothed) target
//   // state.camera.lookAt(state.controls.target)

//     // if (isMoving && currentAction.current !== 'Idle') {
//     //   // 1) compute forward
//     //   const forward = new THREE.Vector3(0, 0, -1)
//     //     .applyQuaternion(gltf.scene.quaternion)
//     //     .normalize()
  
//     //   // 2) compute desired camera position
//     //   const desiredCamPos = c.position
//     //     .clone()
//     //     .add(new THREE.Vector3(0, 2, 0))                // 2 units up
//     //     .add(forward.clone().multiplyScalar(-5))        // 5 units behind
  
//     //   // 3) smoothly move camera there (optional lerp for smoothness)
//     //   state.camera.position.lerp(desiredCamPos, 0.1)
  
//     //   // 4) look at a point in front of character
//     //   const lookAtPoint = c.position
//     //     .clone()
//     //     .add(forward.clone().multiplyScalar(10))       // look 10 units ahead
//     //   state.camera.lookAt(lookAtPoint)
//     //   state.controls.target.lerp(lookAtPoint, 0.1)     // update OrbitControls target
//     // }

//      }
  
//     mixer.update(delta)
//   })

//   return <primitive object={gltf.scene} />
// }

// Floor component
// const Floor: React.FC = () => {
//   const ref = useRef<THREE.Mesh | null>(null)
//   const { gl } = useThree()
//   const [diffuse, normal] = useLoader(THREE.TextureLoader, [
//     '/textures/floors/FloorsCheckerboard_S_Diffuse.jpg',
//     '/textures/floors/FloorsCheckerboard_S_Normal.jpg'
//   ])

//   useEffect(() => {
//     const maxA = gl.capabilities.getMaxAnisotropy()
//     for (const tex of [diffuse, normal]) {
//       tex.wrapS = tex.wrapT = THREE.RepeatWrapping
//       tex.repeat.set(16, 16)
//       tex.anisotropy = maxA
//     }
//   }, [diffuse, normal, gl])

//   return (
//     <mesh ref={ref} receiveShadow rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
//       <planeGeometry args={[50, 50, 50, 50]} />
//       <meshStandardMaterial map={diffuse} normalMap={normal} normalScale={new THREE.Vector2(0.5, 0.5)} roughness={0.85} depthWrite={false} color="#404040" />
//     </mesh>
//   )
// }


// camera
// const ThirdPersonCamera: React.FC<{ target: THREE.Object3D }> = ({ target }) => {
//   useFrame((state) => {
//     const cameraOffset = new THREE.Vector3(0, 2, -5); // Adjust offset as needed
//     const rotatedOffset = cameraOffset.applyQuaternion(target.quaternion); // Rotate offset by target's rotation
//     state.camera.position.copy(target.position).add(rotatedOffset);
//     state.camera.lookAt(target.position.x, target.position.y + 1, target.position.z); // Look at the target
//   });

//   return null;
// };


// const Tile: React.FC<{ x: number; z: number; heightmap: Float32Array }> = ({ x, z, heightmap }) => {
//   const tileSize = 10; // Size of each tile
//   const resolution = 64; // Resolution of each tile

//   // Convert heightmap into a 2D array for useHeightfield
//   const heights:any = [];
//   for (let i = 0; i < resolution; i++) {
//     heights.push(heightmap.slice(i * resolution, (i + 1) * resolution));
//   }

//   // Create the heightfield physics body
//   const [ref] = useHeightfield(() => ({
//     args: [heights, { elementSize: tileSize / (resolution - 1) }], // Match the terrain size and resolution
//     position: [x * tileSize, 0, z * tileSize],
//     // rotation: [-Math.PI / 2, 0, 0], // Rotate to match the plane
//   }));

//   // Create the Three.js geometry
//   const terrainGeometry = new THREE.PlaneGeometry(
//     tileSize,
//     tileSize,
//     resolution - 1,
//     resolution - 1
//   );
//   terrainGeometry.rotateX(-Math.PI / 2);

//   // Apply heightmap data to the geometry vertices
//   const positions = terrainGeometry.attributes.position.array;
//   for (let i = 0; i < heightmap.length; i++) {
//     positions[i * 3 + 1] = heightmap[i];
//   }

//   terrainGeometry.attributes.position.needsUpdate = true;
//   terrainGeometry.computeVertexNormals();

//   const terrainMaterial = new THREE.MeshStandardMaterial({
//     color: 0x3b9f86,
//     wireframe: false,
//     flatShading: true,
//   });

//   return <mesh ref={ref} geometry={terrainGeometry} material={terrainMaterial} />;
// };



// Scene component
const GameScene: React.FC = () => {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load('./grasslight-big.jpg');
  const {scene}=useThree();
  const soldierModel = useRef();
   const client = new TerrainServiceClient('http://localhost:8080', null, {
      transport: grpc.CrossBrowserHttpTransport({ withCredentials: false }),
    });


    const streamTerrainTiles = (centerX: number, centerZ: number, viewDistance: number) => {
      const request = new TerrainStreamRequest();
      request.setCenterX(centerX);
      request.setCenterZ(centerZ);
      request.setViewDistance(viewDistance);
  
      const stream = client.streamTerrainUpdates(request);
  
      stream.on('data', (tile: TerrainTileResponse) => {
        const x = tile.getX();
        const z = tile.getZ();
        // const heightmap = new Float32Array(
        //   tile.getHeightmap_asU8().buffer,
        //   tile.getHeightmap_asU8().byteOffset,
        //   tile.getHeightmap_asU8().byteLength / Float32Array.BYTES_PER_ELEMENT
        // );
        const originalHeightmap = tile.getHeightmap_asU8(); // Always get as Uint8Array
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
        // Add the tile to the scene
        addTileToScene(x, z, alignedHeightmap);
      });
  
      stream.on('error', (err) => {
        console.error('Error streaming terrain tiles:', err.message);
      });
  
      stream.on('end', () => {
        console.log('Terrain tile stream ended.');
      });
    };
  
    const addTileToScene = (x: number, z: number, heightmap: Float32Array) => {
      const tileSize = 10; // Size of each tile
      const resolution = 64; // Resolution of each tile
  
      const terrainGeometry = new THREE.PlaneGeometry(
        tileSize,
        tileSize,
        resolution,
        resolution
      );
      terrainGeometry.rotateX(-Math.PI / 2);
  
      // Apply heightmap data to the geometry vertices
      const positions = terrainGeometry.attributes.position.array;
      for (let i = 0; i < heightmap.length; i++) {
        positions[i * 3 + 1] = heightmap[i] ;
      }
  
      terrainGeometry.attributes.position.needsUpdate = true;
      terrainGeometry.computeVertexNormals();
  
      const terrainMaterial = new THREE.MeshStandardMaterial({
       // map: texture,
         color: 0x3b9f86,
        wireframe: false,
        flatShading: true,
      });
  
      const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
      terrainMesh.position.set(x * tileSize, 0, z * tileSize);
      terrainMesh.name = `tile_${x}_${z}`;
  
      scene.add(terrainMesh);
    };
  
  //   const removeDistantTiles = (scene: THREE.Scene, centerX: number, centerZ: number, viewDistance: number) => {
  //     const tileKeysToRemove: string[] = [];

  // // Ensure scene is defined before traversing
  // if (!scene) {
  //   console.error('Scene is not initialized.');
  //   return;
  // }
  // if (scene){
  //     scene.traverse((object) => {
  //       if (object instanceof THREE.Mesh && object.name.startsWith('tile_')) {
  //         const [_, tileX, tileZ] = object.name.split('_').map(Number);
  //         const distanceX = Math.abs(tileX - centerX);
  //         const distanceZ = Math.abs(tileZ - centerZ);
  
  //         if (distanceX > viewDistance || distanceZ > viewDistance) {
  //           tileKeysToRemove.push(object.name);
  //           scene.remove(object);
  //           object.geometry.dispose();
  //           object.material.dispose();
  //         }
  //       }
  //     });
  //   }
  
  //     console.log('Removed tiles:', tileKeysToRemove);
  //   };



  const gltf = useGLTF('./Soldier.glb') as any
  const { actions, mixer } = useAnimations(gltf.animations, gltf.scene)
  const currentAction = useRef<string>('Idle')
  const controls = useRef({
    key: [0, 0, 0] as [number, number, number], // [forward/back, left/right, run]
    position: new THREE.Vector3(),
    targetQuat: new THREE.Quaternion(),
    moveVec: new THREE.Vector3(),
    fade: 0.5,
    walkSpeed: 1.8,
    runSpeed: 3,
    turnSpeed: 0.1,
  })

  // GUI toggles
  const { showSkeleton, fixeTransition } = useControls({
    showSkeleton: false,
    fixeTransition: true,
  })

  // Setup skeleton helper and play initial Idle
  useEffect(() => {
    actions.Idle?.reset().fadeIn(0.2).play()
    const skeleton = new THREE.SkeletonHelper(gltf.scene)
    skeleton.visible = showSkeleton
    gltf.scene.add(skeleton)
    return () => {
      gltf.scene.remove(skeleton)
    }
  }, [])

  // Toggle skeleton visibility
  useEffect(() => {
    gltf.scene.traverse(obj => {
      if ((obj as THREE.SkeletonHelper).isSkeletonHelper) {
        ;(obj as THREE.SkeletonHelper).visible = showSkeleton
      }
    })
  }, [showSkeleton])

  // Listen to keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = controls.current.key
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': k[0] = 1; break
        case 'KeyS': case 'ArrowDown': k[0] = -1; break
        case 'KeyA': case 'ArrowLeft': k[1] = -1; break
        case 'KeyD': case 'ArrowRight': k[1] = 1; break
        case 'ShiftLeft': case 'ShiftRight': k[2] = 1; break
      }
    }
    const up = (e: KeyboardEvent) => {
      const k = controls.current.key
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': if (k[0] === 1) k[0] = 0; break
        case 'KeyS': case 'ArrowDown': if (k[0] === -1) k[0] = 0; break
        case 'KeyA': case 'ArrowLeft': if (k[1] === -1) k[1] = 0; break
        case 'KeyD': case 'ArrowRight': if (k[1] === 1) k[1] = 0; break
        case 'ShiftLeft': case 'ShiftRight': k[2] = 0; break
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // Update loop: handle animation transitions and movement
  useFrame((state, delta) => {
    const c = controls.current
    const [fwd, strafe, isRun] = c.key
    const isMoving = fwd !== 0 || strafe !== 0
    const nextAction = isMoving ? (isRun ? 'Run' : 'Walk') : 'Idle'

    // Transition animations when action changes
    if (currentAction.current !== nextAction) {
      const prev = actions[currentAction.current]
      const next = actions[nextAction]
      if (next) {
        if (fixeTransition) {
          prev?.fadeOut(c.fade)
          next.reset().fadeIn(c.fade).play()
        } else {
          prev?.fadeOut(c.fade)
          next.reset().fadeIn(c.fade).play()
        }
        currentAction.current = nextAction
      }
    }

    // Movement: calculate direction in world space
    if (isMoving && currentAction.current !== 'Idle') {
      // forward is along -Z in Three.js
      c.moveVec.set(strafe, 0, -fwd)
      const speed = isRun ? c.runSpeed : c.walkSpeed
      c.moveVec.multiplyScalar(speed * delta)

      // Rotate direction by camera yaw
      const yaw = state.camera.rotation.y
      c.moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)

      // Update position and camera
      c.position.add(c.moveVec)
      state.camera.position.add(c.moveVec)
      gltf.scene.position.copy(c.position)

      // Rotate model to movement direction
      const targetDirection = c.moveVec.clone().normalize()
      if (targetDirection.lengthSq() > 0) {
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, -1),
          targetDirection
        )
        gltf.scene.quaternion.slerp(targetQuat, c.turnSpeed)
      }

      // Keep camera looking at the character
       state?.controls?.target.copy(c.position).add(new THREE.Vector3(0, 0, 0))

     }
  
    mixer.update(delta)
  })
let lastCenterX = 0, lastCenterZ = 0
  // useFrame((state) => {
  //   const characterPosition = soldierModel.current?.position;
  //   if (!characterPosition) return;
  //   const centerX = Math.floor(characterPosition.x / tileSize);
  //   const centerZ = Math.floor(characterPosition.z / tileSize);
  
  //   if (centerX !== lastCenterX || centerZ !== lastCenterZ) {
  //     lastCenterX = centerX;
  //     lastCenterZ = centerZ;
  
  //     // Stream new tiles
  //     streamTerrainTiles(centerX, centerZ, viewDistance);
  
  //     // Remove distant tiles
  //     removeDistantTiles(centerX, centerZ, viewDistance);
  //   }
  // });
  useFrame((state) => {
    const characterPosition = controls.current.position;
    const centerX = Math.floor(characterPosition.x / 5); // Tile size is 10
    const centerZ = Math.floor(characterPosition.z / 5);
  
    if (centerX !== lastCenterX || centerZ !== lastCenterZ ||(lastCenterX==0 && lastCenterZ==0)) {
      lastCenterX = centerX;
      lastCenterZ = centerZ;
  
      // Stream new tiles
      streamTerrainTiles(centerX, centerZ, 3); // View distance of 3 tiles
  
      // Remove distant tiles
      // if (scene){
      // removeDistantTiles(scene ,centerX, centerZ, 3);}
   }
  });

  

  return (
    <>
    
        <OrbitControls enableDamping enablePan={false} maxPolarAngle={Math.PI / 2 - 0.05}  makeDefault />
        <Sky sunPosition={[0, 1, 0]} />
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
        {/* <Character /> */}
        <primitive object={gltf.scene}  ref={soldierModel}/>
        {/* <Grid
  infiniteGrid
  cellSize={1}
  sectionSize={10}
  fadeDistance={100}
  fadeStrength={1}
  position={[0, -0.01, 0]}
/> */}

</>
  )
}

export default GameScene






































// import React from 'react'
// import { Backdrop, Grid, OrbitControls, Sky, TransformControls } from "@react-three/drei"
// import { useAnimations, useGLTF, ScrollControls, useScroll } from '@react-three/drei'
// const Game = () => {
//     const model = useGLTF('./Soldier.glb')
//   return (
//     <>
//       <OrbitControls makeDefault/> 
//         <directionalLight position={ [ 1, 2, 3 ] } intensity={ 4.5 } />
//         <ambientLight intensity={ 1.5 } />
//         <Sky />
// {/*  
//         <mesh position-x={ - 2 }>
//             <sphereGeometry />
//             <meshStandardMaterial color="orange" />
//         </mesh>
    
//         <TransformControls  position-x={ 2 }>
//         <mesh   position-x={ 0 }scale={ 1.5 }>
//             <boxGeometry />
//             <meshStandardMaterial color="mediumpurple" />
//         </mesh>
//         </TransformControls>
//         <mesh position-y={ - 1 } rotation-x={ - Math.PI * 0.5 } scale={ 10 }>
//             <planeGeometry />
//             <meshStandardMaterial color="greenyellow" />
//         </mesh> */}
//           <primitive object={model.scene} />
//         <Grid
//   infiniteGrid
//   cellSize={1}
//   sectionSize={10}
//   fadeDistance={100}
//   fadeStrength={1}
//   position={[0, -0.01, 0]}
// />
     
        
//     </>
//   )
// }

// export default Game