# FYP
Final Year Project

# Distributed Terrain Generation System

A distributed terrain generation system using Perlin noise with Next.js, Three.js, and Go.

## Project Structure

This project consists of three main components:

1. **Frontend**: Next.js application with Three.js for terrain visualization
2. **Backend**: Go server with gRPC for distributed terrain generation
3. **Tooling**: Protocol buffers definition and code generation

## Setup and Installation

### Prerequisites

- Node.js (v18+)
- Go (v1.19+)
- Protocol Buffers Compiler (protoc) with Go and TypeScript plugins

### Getting Started

1. Clone the repository
2. Install dependencies:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies (in a real project)
cd backend
go mod tidy
```

3. Generate code from protocol buffers:

```bash
node scripts/protogen.js
```

### Development

To start the development servers:

1. Frontend:

```bash
npm run dev
```

2. Backend (in a separate terminal):

```bash
cd backend
go run main.go
```

## Components

### Frontend (Next.js + Three.js)

The frontend provides:

- 3D terrain visualization with Three.js
- Controls for terrain parameters
- Real-time updates with gRPC-Web

### Backend (Go + gRPC)

The backend provides:

- Terrain generation with Perlin noise
- Distributed worker system for parallel processing
- Tile caching for performance optimization
- gRPC-Web compatible API

### Protocol Buffers

The project uses Protocol Buffers (protobuf) for defining the API contract between frontend and backend. The main service is defined in `terrain.proto`.

## Development Notes

- The frontend uses a mock implementation of the gRPC client during development if the backend is not available
- The backend simulates a simple Perlin noise implementation for demonstration purposes
- In a real deployment, you would need to set up proper CORS and security configurations

## Project Structure

```
├── app/                  # Next.js app directory
├── components/           # React components
│   ├── layout/           # Layout components
│   ├── providers/        # React context providers
│   └── terrain/          # Terrain-specific components
├── lib/                  # Shared libraries and utilities
│   ├── grpc/             # gRPC client implementations
│   └── stores/           # State management
├── backend/              # Go backend
│   ├── pb/               # Generated Go code from protobuf
│   └── main.go           # Main Go application
├── scripts/              # Utility scripts
└── terrain.proto         # Protocol Buffers definition
```