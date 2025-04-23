"use client"
import React from 'react'
import { Canvas } from '@react-three/fiber'
import GameScene from './game'
import * as THREE from 'three'

import { PointerLockControls } from '@react-three/drei';
import { OrbitControls, Sky, useGLTF, useAnimations, Grid } from '@react-three/drei'

import { Leva, useControls } from 'leva'
import { TerrainStreamRequest, TerrainTileResponse } from '@/generated/terrain_pb';
import { TerrainServiceClient } from '@/generated/TerrainServiceClientPb';
import { grpc } from '@improbable-eng/grpc-web';
import { extend } from '@react-three/fiber'
import { Physics, useHeightfield, useSphere } from '@react-three/cannon';

const Environment = () => {
  return (
  <>
  <div className='w-full h-full '>
  {/* <Canvas > */}
  <Leva collapsed />
       <Canvas
         shadows
         camera={{ position: [0, 2, -5], fov: 75 }}
         style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
         // onCreated={({ gl, scene }) => {
         //   scene.background = new THREE.Color(0x5e5d5d)
         //   scene.fog = new THREE.Fog(0x5e5d5d, 2, 20)
         //   gl.setPixelRatio(window.devicePixelRatio)
         //   gl.toneMapping = THREE.ACESFilmicToneMapping
         //   gl.toneMappingExposure = 0.5
         // }}
       >
        <Physics>
    <GameScene/>
    </Physics>
  </Canvas> 
  </div>
  </>
  )
}

export default Environment