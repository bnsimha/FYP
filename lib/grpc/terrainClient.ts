"use client";

import { TerrainParameters } from "@/lib/stores/terrainStore";

function improvedNoise(x: number, y: number, seed: number): number {
  // Simple but effective noise function
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  
  const n = X + Y * 57 + seed;
  
  // Simple value noise
  const value = Math.sin(n * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
}

function generateSimpleNoise(width: number, height: number, params: TerrainParameters): Float32Array {
  const result = new Float32Array(width * height);
  
  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = params.scale;
      let maxValue = 0;
      
      // Accumulate octaves
      for (let i = 0; i < params.octaves; i++) {
        const sampleX = x * frequency;
        const sampleZ = z * frequency;
        
        const noise = improvedNoise(sampleX, sampleZ, params.seed);
        value += noise * amplitude;
        maxValue += amplitude;
        
        amplitude *= params.persistence;
        frequency *= params.lacunarity;
      }
      
      // Normalize
      value /= maxValue;
      
      // Store in result array
      result[z * width + x] = value;
    }
  }
  
  return result;
}

// Delay function to simulate network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface TerrainTileRequest {
  x: number;
  z: number;
  resolution: number;
  lod: number;
}

export interface TerrainTileResponse {
  x: number;
  z: number;
  resolution: number;
  heightmap: Float32Array;
  is_cached: boolean;
  worker_id: string;
}

export class TerrainClient {
  async getTerrainTile(request: TerrainTileRequest): Promise<TerrainTileResponse> {
    // Simulate a network request
    await delay(200);
    
    // Get the current parameters from local storage or use defaults
    const paramsString = localStorage.getItem('terrainParameters');
    let params: TerrainParameters;
    
    if (paramsString) {
      params = JSON.parse(paramsString);
    } else {
      params = {
        scale: 0.01,
        amplitude: 1.5,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0,
        seed: 118800,
        // seed: Math.floor(Math.random() * 10000),
        resolution: 64,
        lod: 1,
        wireframe: false,
        flatShading: false,
      };
    }
    
    // Generate heightmap
    const heightmap = generateSimpleNoise(request.resolution, request.resolution, params);
    
    // Return response
    return {
      x: request.x,
      z: request.z,
      resolution: request.resolution,
      heightmap,
      is_cached: false,
      worker_id: "mock-worker-1",
    };
  }
  
  async updateTerrainParameters(params: Partial<TerrainParameters>): Promise<void> {
    // Simulate network request
    await delay(300);
    
    // In a real implementation, this would send the parameters to the server
    // For now, we'll just store them in localStorage
    const existingParamsString = localStorage.getItem('terrainParameters');
    let existingParams: TerrainParameters;
    
    if (existingParamsString) {
      existingParams = JSON.parse(existingParamsString);
    } else {
      existingParams = {
        scale: 0.01,
        amplitude: 1.5,
        octaves: 4,
        persistence: 0.5,
        lacunarity: 2.0,
        seed:118800,
        // Math.floor(Math.random() * 10000),
        resolution: 64,
        lod: 1,
        wireframe: false,
        flatShading: false,
      };
    }
    
    // Update params
    const updatedParams = { ...existingParams, ...params };
    
    // Save to localStorage
    localStorage.setItem('terrainParameters', JSON.stringify(updatedParams));
    
    return;
  }
}