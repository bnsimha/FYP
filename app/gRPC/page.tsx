"use client"

import { grpc } from '@improbable-eng/grpc-web';
import { TerrainChunkRequest, TerrainChunkResponse, TerrainStreamRequest, TerrainTileRequest } from '../../generated/terrain_pb';

import React from "react";
import { TerrainTileResponse } from '../../generated/terrain_pb';
import { TerrainServiceClient } from '../../generated/TerrainServiceClientPb';

const LogGRPC = () => {
  // Example functions for each gRPC request
  const client = new TerrainServiceClient('http://localhost:8080', null, {
    transport: grpc.CrossBrowserHttpTransport({ withCredentials: false }),
  });

  const GetTerrainTile = async () => {
    try {
      console.log('GetTerrainTile button clicked');
      const request = new TerrainTileRequest();
      request.setX(0);
      request.setZ(0);
      request.setResolution(64);
      request.setLod(1);
   
      
    client.getTerrainTile(request, {}, (err: Error | null, response: TerrainTileResponse | null) => {
      if (err) {
        console.error('Error:', err.message);
      } else if (response) {
        console.log('Response', response.toObject());
      }
    });
    } catch (error) {
      console.error("Error in getTerrainTile:", error);
    }
  }

  const GetTerrainChunk = async () => {
    try {
      console.log('GetTerrainChunk button clicked');
        const chunkRequest = new TerrainChunkRequest();
        chunkRequest.setCenterX(10);
        chunkRequest.setCenterZ(10);
        chunkRequest.setRadius(2);
        chunkRequest.setResolution(64);
        chunkRequest.setLod(1);
        
        client.getTerrainChunk(chunkRequest, {}, (err: Error | null, response: TerrainChunkResponse | null) => {
          if (err) {
            console.error('Error:', err.message);
          } else if (response) {
            console.log('Tiles:', response.toObject()); // Added toObject() to convert response
          }
        });
    } catch (error) {
      console.error("Error in GetTerrainChunk:", error);
    }
  };


  const StreamTerrainUpdates = async () => {
    try {
      console.log('StreamTerrainUpdates button clicked');
        const streamRequest = new TerrainStreamRequest();
        streamRequest.setCenterX(10);
        streamRequest.setCenterZ(10);
        streamRequest.setViewDistance(2);
        streamRequest.setHighPriority(true);
        
        const stream = client.streamTerrainUpdates(streamRequest);
        stream.on('data', (tile:any) => {
          console.log('Received tile:', tile.toObject());
        });
        stream.on('error', (err:any) => {
          console.error('Stream error:', err.message);
        });
        stream.on('end', () => {
          console.log('Stream ended');
        });
    } catch (error) {
      console.error("Error in Request 4:", error);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={GetTerrainTile}>GetTerrainTile</button>
        <button onClick={StreamTerrainUpdates}>StreamTerrainUpdates</button>
        <button onClick={GetTerrainChunk}>GetTerrainChunk</button>
      </div>
    </>
  );
};

export default LogGRPC;