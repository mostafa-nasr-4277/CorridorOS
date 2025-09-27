package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// FFMHandle represents a Free-Form Memory allocation
type FFMHandle struct {
    ID               string    `json:"id"`
    Bytes            uint64    `json:"bytes"`
    LatencyClass     string    `json:"latency_class"`
    BandwidthFloor   uint64    `json:"bandwidth_floor_GBs"`
    Persistence      string    `json:"persistence"`
    Shareable        bool      `json:"shareable"`
    SecurityDomain   string    `json:"security_domain"`
    CreatedAt        time.Time `json:"created_at"`
    PolicyLeaseTTL   int       `json:"policy_lease_ttl_s"`
    FileDescriptors  []string  `json:"fds"`
    AchievedBandwidth uint64   `json:"achieved_GBs"`
    MovedPages       uint64    `json:"moved_pages"`
    TailP99Ms        float64   `json:"tail_p99_ms"`
    AttestationTicket string   `json:"attestation_ticket,omitempty"`
}

// AllocationRequest represents a memory allocation request
type AllocationRequest struct {
    Bytes            uint64 `json:"bytes"`
    LatencyClass     string `json:"latency_class"`
    BandwidthFloor   uint64 `json:"bandwidth_floor_GBs"`
    Persistence      string `json:"persistence"`
    Shareable        bool   `json:"shareable"`
    SecurityDomain   string `json:"security_domain"`
    AttestationRequired bool   `json:"attestation_required,omitempty"`
    AttestationTicket   string `json:"attestation_ticket,omitempty"`
}

// BandwidthAdjustRequest represents a bandwidth adjustment request
type BandwidthAdjustRequest struct {
	FloorGBs uint64 `json:"floor_GBs"`
}

// LatencyClassAdjustRequest represents a latency class adjustment request
type LatencyClassAdjustRequest struct {
	Target string `json:"target"`
}

// TelemetryResponse represents telemetry data
type TelemetryResponse struct {
	AchievedGBs  uint64  `json:"achieved_GBs"`
	MovedPages   uint64  `json:"moved_pages"`
	TailP99Ms    float64 `json:"tail_p99_ms"`
	Temperature  float64 `json:"temperature_c"`
	PowerW       float64 `json:"power_w"`
	Utilization  float64 `json:"utilization_percent"`
}

// FFMService manages Free-Form Memory allocations
type FFMService struct {
    allocations map[string]*FFMHandle
    mutex       sync.RWMutex
    nextID      int
    metrics     *FFMMetrics
}

// FFMMetrics holds Prometheus metrics
type FFMMetrics struct {
	AllocationsTotal    prometheus.Gauge
	BandwidthTotal      prometheus.Gauge
	LatencyP99          prometheus.Histogram
	MigrationCount      prometheus.Counter
	AllocationDuration  prometheus.Histogram
}

// NewFFMService creates a new FFM service
func NewFFMService() *FFMService {
	metrics := &FFMMetrics{
		AllocationsTotal: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "ffm_allocations_total",
			Help: "Total number of active FFM allocations",
		}),
		BandwidthTotal: prometheus.NewGauge(prometheus.GaugeOpts{
			Name: "ffm_bandwidth_total_gbps",
			Help: "Total allocated bandwidth in Gbps",
		}),
		LatencyP99: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "ffm_latency_p99_seconds",
			Help:    "P99 latency of FFM operations",
			Buckets: prometheus.ExponentialBuckets(0.001, 2, 15),
		}),
		MigrationCount: prometheus.NewCounter(prometheus.CounterOpts{
			Name: "ffm_migrations_total",
			Help: "Total number of page migrations",
		}),
		AllocationDuration: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "ffm_allocation_duration_seconds",
			Help:    "Time taken to allocate FFM",
			Buckets: prometheus.ExponentialBuckets(0.01, 2, 10),
		}),
	}

	prometheus.MustRegister(metrics.AllocationsTotal)
	prometheus.MustRegister(metrics.BandwidthTotal)
	prometheus.MustRegister(metrics.LatencyP99)
	prometheus.MustRegister(metrics.MigrationCount)
	prometheus.MustRegister(metrics.AllocationDuration)

	return &FFMService{
		allocations: make(map[string]*FFMHandle),
		metrics:     metrics,
		nextID:      1,
	}
}

// Allocate creates a new FFM allocation
func (s *FFMService) Allocate(req AllocationRequest) (*FFMHandle, error) {
	start := time.Now()
	defer func() {
		s.metrics.AllocationDuration.Observe(time.Since(start).Seconds())
	}()

	s.mutex.Lock()
	defer s.mutex.Unlock()

    // Enforce attestation when requested
    if req.AttestationRequired {
        if req.AttestationTicket == "" {
            return nil, fmt.Errorf("attestation required but no ticket provided")
        }
        ok, err := verifyAttestation(req.AttestationTicket)
        if err != nil {
            return nil, fmt.Errorf("attestation verification failed: %v", err)
        }
        if !ok {
            return nil, fmt.Errorf("attestation ticket invalid or expired")
        }
    }

    // Generate unique ID
    id := fmt.Sprintf("ffm-%04x", s.nextID)
    s.nextID++

	// Create allocation
	handle := &FFMHandle{
		ID:               id,
		Bytes:            req.Bytes,
		LatencyClass:     req.LatencyClass,
		BandwidthFloor:   req.BandwidthFloor,
		Persistence:      req.Persistence,
		Shareable:        req.Shareable,
		SecurityDomain:   req.SecurityDomain,
		CreatedAt:        time.Now(),
		PolicyLeaseTTL:   3600, // 1 hour default
		FileDescriptors:  []string{fmt.Sprintf("/proc/12345/fd/%d", s.nextID)},
		AchievedBandwidth: uint64(float64(req.BandwidthFloor) * 0.9), // Simulate 90% achievement
		MovedPages:       0,
        TailP99Ms:        2.1,
        AttestationTicket: req.AttestationTicket,
    }

	s.allocations[id] = handle

	// Update metrics
	s.metrics.AllocationsTotal.Set(float64(len(s.allocations)))
	s.metrics.BandwidthTotal.Add(float64(req.BandwidthFloor))

	return handle, nil
}

// GetTelemetry returns telemetry for an allocation
func (s *FFMService) GetTelemetry(id string) (*TelemetryResponse, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	handle, exists := s.allocations[id]
	if !exists {
		return nil, fmt.Errorf("allocation %s not found", id)
	}

	return &TelemetryResponse{
		AchievedGBs:  handle.AchievedBandwidth,
		MovedPages:   handle.MovedPages,
		TailP99Ms:    handle.TailP99Ms,
		Temperature:  45.2,
		PowerW:       12.5,
		Utilization:  85.3,
	}, nil
}

// AdjustBandwidth modifies bandwidth floor for an allocation
func (s *FFMService) AdjustBandwidth(id string, req BandwidthAdjustRequest) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	handle, exists := s.allocations[id]
	if !exists {
		return fmt.Errorf("allocation %s not found", id)
	}

	oldFloor := handle.BandwidthFloor
	handle.BandwidthFloor = req.FloorGBs
	handle.AchievedBandwidth = uint64(float64(req.FloorGBs) * 0.9)

	// Update metrics
	s.metrics.BandwidthTotal.Add(float64(req.FloorGBs - oldFloor))

	return nil
}

// AdjustLatencyClass migrates allocation to different tier
func (s *FFMService) AdjustLatencyClass(id string, req LatencyClassAdjustRequest) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	handle, exists := s.allocations[id]
	if !exists {
		return fmt.Errorf("allocation %s not found", id)
	}

	// Simulate migration
	handle.LatencyClass = req.Target
	handle.MovedPages += 1000000 // Simulate page migration
	s.metrics.MigrationCount.Add(1000000)

	return nil
}

// ListAllocations returns all active allocations
func (s *FFMService) ListAllocations() []*FFMHandle {
    s.mutex.RLock()
    defer s.mutex.RUnlock()

    allocations := make([]*FFMHandle, 0, len(s.allocations))
    for _, handle := range s.allocations {
        allocations = append(allocations, handle)
    }

    return allocations
}

// GetAllocation returns a specific allocation by ID
func (s *FFMService) GetAllocation(id string) (*FFMHandle, error) {
    s.mutex.RLock()
    defer s.mutex.RUnlock()

    handle, exists := s.allocations[id]
    if !exists {
        return nil, fmt.Errorf("allocation %s not found", id)
    }
    return handle, nil
}

// verifyAttestation checks attestation with attestd
func verifyAttestation(ticket string) (bool, error) {
    url := os.Getenv("ATTESTD_URL")
    if url == "" {
        url = "http://localhost:8084"
    }
    resp, err := http.Get(fmt.Sprintf("%s/v1/attest/%s", strings.TrimRight(url, "/"), ticket))
    if err != nil {
        return false, err
    }
    defer resp.Body.Close()
    if resp.StatusCode != http.StatusOK {
        return false, fmt.Errorf("HTTP %d", resp.StatusCode)
    }
    var result struct { Valid bool `json:"valid"` }
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return false, err
    }
    return result.Valid, nil
}

// HTTP handlers
func (s *FFMService) handleAllocate(w http.ResponseWriter, r *http.Request) {
	var req AllocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

    handle, err := s.Allocate(req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(handle)
}

func (s *FFMService) handleGetTelemetry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	telemetry, err := s.GetTelemetry(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(telemetry)
}

func (s *FFMService) handleAdjustBandwidth(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req BandwidthAdjustRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := s.AdjustBandwidth(id, req); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *FFMService) handleAdjustLatencyClass(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req LatencyClassAdjustRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := s.AdjustLatencyClass(id, req); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *FFMService) handleListAllocations(w http.ResponseWriter, r *http.Request) {
    allocations := s.ListAllocations()

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(allocations)
}

func (s *FFMService) handleGetAllocation(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id := vars["id"]

    handle, err := s.GetAllocation(id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(handle)
}

func main() {
	// Create FFM service
	service := NewFFMService()

	// Set up HTTP router
	router := mux.NewRouter()
	api := router.PathPrefix("/v1/ffm").Subrouter()

	// API endpoints
    api.HandleFunc("/alloc", service.handleAllocate).Methods("POST")
    api.HandleFunc("/{id}/telemetry", service.handleGetTelemetry).Methods("GET")
    api.HandleFunc("/{id}/bandwidth", service.handleAdjustBandwidth).Methods("PATCH")
    api.HandleFunc("/{id}/latency_class", service.handleAdjustLatencyClass).Methods("PATCH")
    api.HandleFunc("/{id}", service.handleGetAllocation).Methods("GET")
    api.HandleFunc("/", service.handleListAllocations).Methods("GET")

	// Metrics endpoint
	router.Handle("/metrics", promhttp.Handler())

	// Health check
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	// Start server
	server := &http.Server{
		Addr:    ":8081",
		Handler: router,
	}

	// Graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-c
		log.Println("Shutting down FFM service...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		server.Shutdown(ctx)
	}()

	log.Println("Starting FFM service on :8081")
	log.Fatal(server.ListenAndServe())
}
