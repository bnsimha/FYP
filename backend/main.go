package main

import (
	"context"
	"encoding/binary"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"time"

	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "terrain-generator/pb"
)

// TerrainService implements the gRPC service
type TerrainService struct {
	pb.UnimplementedTerrainServiceServer
	workers       []*Worker
	parametersMu  sync.RWMutex
	parameters    TerrainParameters
	terrainCache  map[string][]byte
	cacheMu       sync.RWMutex
	workQueue     chan WorkRequest
	workerResults chan WorkResult
}

// TerrainParameters holds the configuration for terrain generation
type TerrainParameters struct {
	Scale       float32
	Amplitude   float32
	Octaves     int32
	Persistence float32
	Lacunarity  float32
	Seed        int32
}

// Worker represents a terrain generation worker
type Worker struct {
	ID        string
	params    TerrainParameters
	isRunning bool
	mu        sync.Mutex
}

// WorkRequest represents a request for terrain generation
type WorkRequest struct {
	X          int32
	Z          int32
	Resolution int32
	LOD        int32
	ResponseCh chan WorkResult
}

// WorkResult represents the result of a terrain generation task
type WorkResult struct {
	X          int32
	Z          int32
	Resolution int32
	Heightmap  []byte
	Error      error
	WorkerID   string
	IsCached   bool
}

// NewTerrainService creates a new terrain service
func NewTerrainService(numWorkers int) *TerrainService {
	s := &TerrainService{
		parameters: TerrainParameters{
			Scale:       0.01,
			Amplitude:   1.5,
			Octaves:     4,
			Persistence: 0.5,
			Lacunarity:  2.0,
			Seed:        rand.Int31(),
		},
		terrainCache:  make(map[string][]byte),
		workQueue:     make(chan WorkRequest, 100),
		workerResults: make(chan WorkResult, 100),
	}

	// Initialize workers
	s.workers = make([]*Worker, numWorkers)
	for i := 0; i < numWorkers; i++ {
		s.workers[i] = &Worker{
			ID:        fmt.Sprintf("worker-%d", i),
			params:    s.parameters,
			isRunning: true,
		}
		go s.runWorker(s.workers[i])
	}

	// Start the work dispatcher
	go s.dispatchWork()

	return s
}

// GetTerrainTile implements the RPC method
func (s *TerrainService) GetTerrainTile(ctx context.Context, req *pb.TerrainTileRequest) (*pb.TerrainTileResponse, error) {
	cacheKey := fmt.Sprintf("%d:%d:%d:%d", req.X, req.Z, req.Resolution, req.Lod)

	// Check cache first
	s.cacheMu.RLock()
	cachedHeightmap, found := s.terrainCache[cacheKey]
	s.cacheMu.RUnlock()

	if found {
		return &pb.TerrainTileResponse{
			X:          req.X,
			Z:          req.Z,
			Resolution: req.Resolution,
			Heightmap:  cachedHeightmap,
			IsCached:   true,
			WorkerId:   "cache",
		}, nil
	}

	// Create response channel
	resultCh := make(chan WorkResult, 1)

	// Queue the work
	s.workQueue <- WorkRequest{
		X:          req.X,
		Z:          req.Z,
		Resolution: req.Resolution,
		LOD:        req.Lod,
		ResponseCh: resultCh,
	}

	// Wait for the result or context cancellation
	select {
	case result := <-resultCh:
		if result.Error != nil {
			return nil, status.Errorf(codes.Internal, "Failed to generate terrain: %v", result.Error)
		}

		// Store in cache
		s.cacheMu.Lock()
		s.terrainCache[cacheKey] = result.Heightmap
		s.cacheMu.Unlock()

		return &pb.TerrainTileResponse{
			X:          result.X,
			Z:          result.Z,
			Resolution: result.Resolution,
			Heightmap:  result.Heightmap,
			IsCached:   false,
			WorkerId:   result.WorkerID,
		}, nil

	case <-ctx.Done():
		return nil, status.Errorf(codes.Canceled, "Request canceled")
	}
}

// GetTerrainChunk implements the RPC method
func (s *TerrainService) GetTerrainChunk(ctx context.Context, req *pb.TerrainChunkRequest) (*pb.TerrainChunkResponse, error) {
	// Calculate tile coordinates based on center and radius
	var tiles []*pb.TerrainTileResponse
	var totalTiles, generatedTiles, cachedTiles int32

	// Use a wait group to manage concurrent tile generation
	var wg sync.WaitGroup
	var mu sync.Mutex // To protect the slice and counters

	// For each tile in the chunk
	for z := req.CenterZ - req.Radius; z <= req.CenterZ+req.Radius; z++ {
		for x := req.CenterX - req.Radius; x <= req.CenterX+req.Radius; x++ {
			wg.Add(1)
			totalTiles++

			// Process each tile concurrently
			go func(x, z int32) {
				defer wg.Done()

				tileReq := &pb.TerrainTileRequest{
					X:          x,
					Z:          z,
					Resolution: req.Resolution,
					Lod:        req.Lod,
				}

				tileResp, err := s.GetTerrainTile(ctx, tileReq)
				if err != nil {
					log.Printf("Failed to generate tile at (%d, %d): %v", x, z, err)
					return
				}

				mu.Lock()
				tiles = append(tiles, tileResp)
				if tileResp.IsCached {
					cachedTiles++
				} else {
					generatedTiles++
				}
				mu.Unlock()
			}(x, z)
		}
	}

	// Wait for all tile generations to complete
	wg.Wait()

	return &pb.TerrainChunkResponse{
		Tiles:         tiles,
		TotalTiles:    totalTiles,
		GeneratedTiles: generatedTiles,
		CachedTiles:   cachedTiles,
	}, nil
}

// UpdateTerrainParameters implements the RPC method
func (s *TerrainService) UpdateTerrainParameters(ctx context.Context, req *pb.TerrainParametersRequest) (*pb.TerrainParametersResponse, error) {
	s.parametersMu.Lock()
	s.parameters = TerrainParameters{
		Scale:       req.Scale,
		Amplitude:   req.Amplitude,
		Octaves:     req.Octaves,
		Persistence: req.Persistence,
		Lacunarity:  req.Lacunarity,
		Seed:        req.Seed,
	}
	s.parametersMu.Unlock()

	// Update worker parameters
	for _, worker := range s.workers {
		worker.mu.Lock()
		worker.params = s.parameters
		worker.mu.Unlock()
	}

	// Clear cache when parameters change
	s.cacheMu.Lock()
	s.terrainCache = make(map[string][]byte)
	s.cacheMu.Unlock()

	return &pb.TerrainParametersResponse{
		Success: true,
		Message: "Parameters updated successfully",
	}, nil
}

// StreamTerrainUpdates implements the RPC streaming method
func (s *TerrainService) StreamTerrainUpdates(req *pb.TerrainStreamRequest, stream pb.TerrainService_StreamTerrainUpdatesServer) error {
	// Calculate the view area
	tileCoords := make([][2]int32, 0)
	for z := req.CenterZ - req.ViewDistance; z <= req.CenterZ+req.ViewDistance; z++ {
		for x := req.CenterX - req.ViewDistance; x <= req.CenterX+req.ViewDistance; x++ {
			// Calculate distance from center
			dx := x - req.CenterX
			dz := z - req.CenterZ
			distSquared := dx*dx + dz*dz

			// Send tiles within view distance (using squared distance to avoid sqrt)
			if distSquared <= req.ViewDistance*req.ViewDistance {
				tileCoords = append(tileCoords, [2]int32{x, z})
			}
		}
	}

	// Prioritize closest tiles
	for _, coord := range tileCoords {
		// Check if the stream is still active
		select {
		case <-stream.Context().Done():
			return nil
		default:
			// Continue processing
		}

		tileReq := &pb.TerrainTileRequest{
			X:          coord[0],
			Z:          coord[1],
			Resolution: 64, // Default resolution
			Lod:        1,  // Default LOD
		}

		tile, err := s.GetTerrainTile(stream.Context(), tileReq)
		if err != nil {
			log.Printf("Error generating tile at (%d, %d): %v", coord[0], coord[1], err)
			continue
		}

		if err := stream.Send(tile); err != nil {
			return err
		}

		// Small delay to avoid flooding the client
		time.Sleep(50 * time.Millisecond)
	}

	return nil
}

// dispatchWork handles dispatching work to available workers
func (s *TerrainService) dispatchWork() {
	for req := range s.workQueue {
		// Find an available worker
		var worker *Worker
		for _, w := range s.workers {
			w.mu.Lock()
			if w.isRunning {
				worker = w
				w.isRunning = false
				w.mu.Unlock()
				break
			}
			w.mu.Unlock()
		}

		if worker == nil {
			// No available worker, retry later
			go func(req WorkRequest) {
				time.Sleep(100 * time.Millisecond)
				s.workQueue <- req
			}(req)
			continue
		}

		// Assign work to the worker
		go func(w *Worker, req WorkRequest) {
			heightmap, err := s.generateTerrainTile(w, req.X, req.Z, req.Resolution, req.LOD)
			
			// Mark worker as available
			w.mu.Lock()
			w.isRunning = true
			w.mu.Unlock()
			
			// Send result
			req.ResponseCh <- WorkResult{
				X:          req.X,
				Z:          req.Z,
				Resolution: req.Resolution,
				Heightmap:  heightmap,
				Error:      err,
				WorkerID:   w.ID,
				IsCached:   false,
			}
		}(worker, req)
	}
}

// runWorker manages a worker's lifecycle
func (s *TerrainService) runWorker(worker *Worker) {
	log.Printf("Worker %s started", worker.ID)
	// The worker's actual work is done in the dispatchWork function
	// This function is more of a placeholder for worker lifecycle management
}

// generateTerrainTile generates a terrain tile with Perlin noise
func (s *TerrainService) generateTerrainTile(worker *Worker, x, z, resolution, lod int32) ([]byte, error) {
	// Get worker parameters
	worker.mu.Lock()
	params := worker.params
	worker.mu.Unlock()

	// Simulate computation time
	time.Sleep(200 * time.Millisecond)

	// Create heightmap buffer
	heightmap := make([]float32, resolution*resolution)
	
	// Simple Perlin noise (simulated)
	for i := int32(0); i < resolution; i++ {
		for j := int32(0); j < resolution; j++ {
			// Scale coordinates based on tile position
			nx := float64(x) + float64(i)/float64(resolution)
			nz := float64(z) + float64(j)/float64(resolution)
			
			// Apply scaling
			nx *= float64(params.Scale)
			nz *= float64(params.Scale)
			
			// Apply seed
			nx += float64(params.Seed) * 0.1
			nz += float64(params.Seed) * 0.1
			
			// Simple noise function (this would be a real Perlin noise implementation)
			var value float64
			amplitude := 1.0
			frequency := 1.0
			
			for o := int32(0); o < params.Octaves; o++ {
				// Simple sinusoidal noise for demonstration
				// In production, this would use a proper Perlin noise function
				noiseValue := math.Sin(nx*frequency*5) * math.Cos(nz*frequency*5)
				
				value += noiseValue * amplitude
				
				amplitude *= float64(params.Persistence)
				frequency *= float64(params.Lacunarity)
			}
			
			// Normalize to 0-1 range
			value = (value + 1) / 2
			
			// Apply amplitude
			value *= float64(params.Amplitude)
			
			// Store in heightmap
			heightmap[i*resolution+j] = float32(value)
		}
	}
	
	// Convert to bytes
	byteData := make([]byte, len(heightmap)*4)
	for i, h := range heightmap {
		binary.LittleEndian.PutUint32(byteData[i*4:], math.Float32bits(h))
	}
	
	return byteData, nil
}

func main() {
	// Create service with 4 workers
	service := NewTerrainService(4)
	
	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterTerrainServiceServer(grpcServer, service)
	
	// Create gRPC-Web wrapper
	wrappedServer := grpcweb.WrapServer(grpcServer,
		grpcweb.WithOriginFunc(func(origin string) bool { return true }))
	
	// Create HTTP server
	httpServer := &http.Server{
		Addr: ":8080",
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Add CORS headers
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			
			// Handle preflight requests
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			
			// Handle gRPC-Web requests
			if wrappedServer.IsGrpcWebRequest(r) || wrappedServer.IsAcceptableGrpcCorsRequest(r) {
				wrappedServer.ServeHTTP(w, r)
				return
			}
			
			// Handle regular HTTP requests (for health checks, etc.)
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Terrain Generation Service"))
		}),
	}
	
	// Start gRPC server in a separate goroutine
	go func() {
		log.Printf("Starting terrain generation service on port 8080")
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()
	
	// Start gRPC server in a separate goroutine
	go func() {
		lis, err := net.Listen("tcp", ":9090")
		if err != nil {
			log.Fatalf("Failed to listen: %v", err)
		}
		log.Printf("Starting gRPC server on port 9090")
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()
	
	// Wait for interrupt signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	<-c
	
	// Graceful shutdown
	log.Println("Shutting down server...")
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}
	
	grpcServer.GracefulStop()
	
	log.Println("Server stopped")
}