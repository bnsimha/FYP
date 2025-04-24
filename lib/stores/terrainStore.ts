"use client";

import { create } from "zustand";
import * as THREE from "three";

export interface TerrainParameters {
  scale: number;
  amplitude: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seed: number;
  resolution: number;
  lod: number;
  wireframe: boolean;
  flatShading: boolean;
}

interface TerrainState {
  parameters: TerrainParameters;
  terrainMesh: THREE.Mesh | null;
  updateParameters: (params: Partial<TerrainParameters>) => void;
  updateTerrainMesh: (mesh: THREE.Mesh) => void;
  regenerate: () => void;
  needsUpdate: boolean;
}

// Default terrain parameters
const defaultParameters: TerrainParameters = {
  scale: 0.08,
  amplitude: 1.5,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0,
  seed: 118800,
  resolution: 64,
  lod: 1,
  wireframe: false,
  flatShading: false,
};

export const useTerrainStore = create<TerrainState>((set) => ({
  parameters: defaultParameters,
  terrainMesh: null,
  needsUpdate: false,
  
  updateParameters: (params) => set((state) => ({
    parameters: { ...state.parameters, ...params },
    needsUpdate: true,
  })),
  
  updateTerrainMesh: (mesh) => set({ terrainMesh: mesh }),
  
  regenerate: () => set({ needsUpdate: true }),
}));