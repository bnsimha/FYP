import * as jspb from 'google-protobuf'



export class TerrainTileRequest extends jspb.Message {
  getX(): number;
  setX(value: number): TerrainTileRequest;

  getZ(): number;
  setZ(value: number): TerrainTileRequest;

  getResolution(): number;
  setResolution(value: number): TerrainTileRequest;

  getLod(): number;
  setLod(value: number): TerrainTileRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TerrainTileRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TerrainTileRequest): TerrainTileRequest.AsObject;
  static serializeBinaryToWriter(message: TerrainTileRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TerrainTileRequest;
  static deserializeBinaryFromReader(message: TerrainTileRequest, reader: jspb.BinaryReader): TerrainTileRequest;
}

export namespace TerrainTileRequest {
  export type AsObject = {
    x: number,
    z: number,
    resolution: number,
    lod: number,
  }
}

export class TerrainTileResponse extends jspb.Message {
  getX(): number;
  setX(value: number): TerrainTileResponse;

  getZ(): number;
  setZ(value: number): TerrainTileResponse;

  getResolution(): number;
  setResolution(value: number): TerrainTileResponse;

  getHeightmap(): Uint8Array | string;
  getHeightmap_asU8(): Uint8Array;
  getHeightmap_asB64(): string;
  setHeightmap(value: Uint8Array | string): TerrainTileResponse;

  getIsCached(): boolean;
  setIsCached(value: boolean): TerrainTileResponse;

  getWorkerId(): string;
  setWorkerId(value: string): TerrainTileResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TerrainTileResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TerrainTileResponse): TerrainTileResponse.AsObject;
  static serializeBinaryToWriter(message: TerrainTileResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TerrainTileResponse;
  static deserializeBinaryFromReader(message: TerrainTileResponse, reader: jspb.BinaryReader): TerrainTileResponse;
}

export namespace TerrainTileResponse {
  export type AsObject = {
    x: number,
    z: number,
    resolution: number,
    heightmap: Uint8Array | string,
    isCached: boolean,
    workerId: string,
  }
}

export class TerrainChunkRequest extends jspb.Message {
  getCenterX(): number;
  setCenterX(value: number): TerrainChunkRequest;

  getCenterZ(): number;
  setCenterZ(value: number): TerrainChunkRequest;

  getRadius(): number;
  setRadius(value: number): TerrainChunkRequest;

  getResolution(): number;
  setResolution(value: number): TerrainChunkRequest;

  getLod(): number;
  setLod(value: number): TerrainChunkRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TerrainChunkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TerrainChunkRequest): TerrainChunkRequest.AsObject;
  static serializeBinaryToWriter(message: TerrainChunkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TerrainChunkRequest;
  static deserializeBinaryFromReader(message: TerrainChunkRequest, reader: jspb.BinaryReader): TerrainChunkRequest;
}

export namespace TerrainChunkRequest {
  export type AsObject = {
    centerX: number,
    centerZ: number,
    radius: number,
    resolution: number,
    lod: number,
  }
}

export class TerrainChunkResponse extends jspb.Message {
  getTilesList(): Array<TerrainTileResponse>;
  setTilesList(value: Array<TerrainTileResponse>): TerrainChunkResponse;
  clearTilesList(): TerrainChunkResponse;
  addTiles(value?: TerrainTileResponse, index?: number): TerrainTileResponse;

  getTotalTiles(): number;
  setTotalTiles(value: number): TerrainChunkResponse;

  getGeneratedTiles(): number;
  setGeneratedTiles(value: number): TerrainChunkResponse;

  getCachedTiles(): number;
  setCachedTiles(value: number): TerrainChunkResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TerrainChunkResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TerrainChunkResponse): TerrainChunkResponse.AsObject;
  static serializeBinaryToWriter(message: TerrainChunkResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TerrainChunkResponse;
  static deserializeBinaryFromReader(message: TerrainChunkResponse, reader: jspb.BinaryReader): TerrainChunkResponse;
}

export namespace TerrainChunkResponse {
  export type AsObject = {
    tilesList: Array<TerrainTileResponse.AsObject>,
    totalTiles: number,
    generatedTiles: number,
    cachedTiles: number,
  }
}

export class TerrainParametersRequest extends jspb.Message {
  getScale(): number;
  setScale(value: number): TerrainParametersRequest;

  getAmplitude(): number;
  setAmplitude(value: number): TerrainParametersRequest;

  getOctaves(): number;
  setOctaves(value: number): TerrainParametersRequest;

  getPersistence(): number;
  setPersistence(value: number): TerrainParametersRequest;

  getLacunarity(): number;
  setLacunarity(value: number): TerrainParametersRequest;

  getSeed(): number;
  setSeed(value: number): TerrainParametersRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TerrainParametersRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TerrainParametersRequest): TerrainParametersRequest.AsObject;
  static serializeBinaryToWriter(message: TerrainParametersRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TerrainParametersRequest;
  static deserializeBinaryFromReader(message: TerrainParametersRequest, reader: jspb.BinaryReader): TerrainParametersRequest;
}

export namespace TerrainParametersRequest {
  export type AsObject = {
    scale: number,
    amplitude: number,
    octaves: number,
    persistence: number,
    lacunarity: number,
    seed: number,
  }
}

export class TerrainParametersResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): TerrainParametersResponse;

  getMessage(): string;
  setMessage(value: string): TerrainParametersResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TerrainParametersResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TerrainParametersResponse): TerrainParametersResponse.AsObject;
  static serializeBinaryToWriter(message: TerrainParametersResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TerrainParametersResponse;
  static deserializeBinaryFromReader(message: TerrainParametersResponse, reader: jspb.BinaryReader): TerrainParametersResponse;
}

export namespace TerrainParametersResponse {
  export type AsObject = {
    success: boolean,
    message: string,
  }
}

export class TerrainStreamRequest extends jspb.Message {
  getCenterX(): number;
  setCenterX(value: number): TerrainStreamRequest;

  getCenterZ(): number;
  setCenterZ(value: number): TerrainStreamRequest;

  getViewDistance(): number;
  setViewDistance(value: number): TerrainStreamRequest;

  getHighPriority(): boolean;
  setHighPriority(value: boolean): TerrainStreamRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TerrainStreamRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TerrainStreamRequest): TerrainStreamRequest.AsObject;
  static serializeBinaryToWriter(message: TerrainStreamRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TerrainStreamRequest;
  static deserializeBinaryFromReader(message: TerrainStreamRequest, reader: jspb.BinaryReader): TerrainStreamRequest;
}

export namespace TerrainStreamRequest {
  export type AsObject = {
    centerX: number,
    centerZ: number,
    viewDistance: number,
    highPriority: boolean,
  }
}

