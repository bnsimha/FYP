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
     const startTime = performance.now(); 
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
      const startTime = performance.now(); 
      //console.log('GetTerrainChunk button clicked');
        const chunkRequest = new TerrainChunkRequest();
        chunkRequest.setCenterX(-8650);
        chunkRequest.setCenterZ(-8650);
        chunkRequest.setRadius(3);
        chunkRequest.setResolution(128);
        chunkRequest.setLod(1);
        
        client.getTerrainChunk(chunkRequest, {}, (err: Error | null, response: TerrainChunkResponse | null) => {
          const endTime = performance.now(); // Record the end time
          console.log(`GetTerrainChunk execution time: ${(endTime - startTime)} ms`);
          if (err) {
            console.error('Error:', err.message);
          } else if (response) {
                    // Log the payload size
        const serializedResponse = response.serializeBinary(); // Serialize the response to binary format
        const payloadSize = serializedResponse.byteLength; // Get the size in bytes
        console.log(`Payload size (GetTerrainChunk): ${payloadSize} bytes`);

           // console.log('Tiles:', response.toObject()); // Added toObject() to convert response
          }
        });
    } catch (error) {
      console.error("Error in GetTerrainChunk:", error);
    }
  };


  const StreamTerrainUpdates = async () => {
    try {
      const startTime = performance.now(); 
      console.log('StreamTerrainUpdates button clicked');
        const streamRequest = new TerrainStreamRequest();
        streamRequest.setCenterX(1000);
        streamRequest.setCenterZ(1000);
        streamRequest.setViewDistance(3);
        streamRequest.setHighPriority(true);
        
        const stream = client.streamTerrainUpdates(streamRequest);
        stream.on('data', (tile:any) => {
          console.log('Received tile:', tile.toObject());
        });
        stream.on('error', (err:any) => {
          console.error('Stream error:', err.message);
        });
        stream.on('end', () => {
          const endTime = performance.now();
          console.log(`Stream ended. Total time: ${(endTime - startTime).toFixed(2)} ms`);
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