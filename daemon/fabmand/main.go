package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
)

// CXLDevice represents a CXL device in the fabric
type CXLDevice struct {
	ID           string    `json:"id"`
	Type         string    `json:"type"` // Type-1, Type-2, Type-3
	VendorID     string    `json:"vendor_id"`
	DeviceID     string    `json:"device_id"`
	SerialNumber string    `json:"serial_number"`
	FirmwareVer  string    `json:"firmware_version"`
	Capacity     uint64    `json:"capacity_bytes"`
	Latency      uint64    `json:"latency_ns"`
	Bandwidth    uint64    `json:"bandwidth_gbps"`
	Status       string    `json:"status"`
	LastSeen     time.Time `json:"last_seen"`
	Attestation  string    `json:"attestation_ticket"`
}

// FabricPath represents a CXL fabric path
type FabricPath struct {
	ID           string    `json:"id"`
	SourceDevice string    `json:"source_device"`
	TargetDevice string    `json:"target_device"`
	PathType     string    `json:"path_type"` // PBR, GIM, Direct
	Bandwidth    uint64    `json:"bandwidth_gbps"`
	Latency      uint64    `json:"latency_ns"`
	QoS          QoSConfig `json:"qos"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

// QoSConfig represents Quality of Service configuration
type QoSConfig struct {
	Priority     string `json:"priority"`     // gold, silver, bronze
	MinBandwidth uint64 `json:"min_bandwidth_gbps"`
	MaxLatency   uint64 `json:"max_latency_ns"`
	PFC          bool   `json:"pfc"`          // Priority Flow Control
	ECN          bool   `json:"ecn"`          // Explicit Congestion Notification
}

// AttestationTicket represents device attestation
type AttestationTicket struct {
	DeviceID     string    `json:"device_id"`
	TicketID     string    `json:"ticket_id"`
	FirmwareHash string    `json:"firmware_hash"`
	ConfigHash   string    `json:"config_hash"`
	Signature    string    `json:"signature"`
	IssuedAt     time.Time `json:"issued_at"`
	ExpiresAt    time.Time `json:"expires_at"`
	Valid        bool      `json:"valid"`
}

// PathRequest represents a path creation request
type PathRequest struct {
	SourceDevice string    `json:"source_device"`
	TargetDevice string    `json:"target_device"`
	PathType     string    `json:"path_type"`
	Bandwidth    uint64    `json:"bandwidth_gbps"`
	Latency      uint64    `json:"latency_ns"`
	QoS          QoSConfig `json:"qos"`
}

// AttestationRequest represents an attestation request
type AttestationRequest struct {
	DeviceID string `json:"device_id"`
	RequirePQC bool `json:"require_pqc"`
}

// FabricManagerService manages CXL fabric
type FabricManagerService struct {
    devices    map[string]*CXLDevice
    paths      map[string]*FabricPath
    attestations map[string]*AttestationTicket
    mutex      sync.RWMutex
    nextPathID int
    policies   map[string]*Policy
}

// NewFabricManagerService creates a new fabric manager service
func NewFabricManagerService() *FabricManagerService {
    service := &FabricManagerService{
        devices:      make(map[string]*CXLDevice),
        paths:        make(map[string]*FabricPath),
        attestations: make(map[string]*AttestationTicket),
        nextPathID:   1,
        policies:     make(map[string]*Policy),
    }

	// Initialize with some mock devices
	service.initializeMockDevices()
	return service
}

// Device state request
type DeviceStateRequest struct {
    Status string `json:"status"` // active, maintenance, disabled
}

// Policy represents a simple QoS policy for device or path
type Policy struct {
    Name      string    `json:"name"`
    Match     string    `json:"match"`      // "device" or "path"
    TargetID  string    `json:"target_id"`  // deviceID or pathID
    QoS       QoSConfig `json:"qos"`
    Enabled   bool      `json:"enabled"`
    CreatedAt time.Time `json:"created_at"`
}

// initializeMockDevices creates some mock CXL devices for testing
func (s *FabricManagerService) initializeMockDevices() {
	devices := []*CXLDevice{
		{
			ID:           "cxl-dev-001",
			Type:         "Type-3",
			VendorID:     "0x8086",
			DeviceID:     "0x0b5a",
			SerialNumber: "SN123456789",
			FirmwareVer:  "1.2.3",
			Capacity:     256 * 1024 * 1024 * 1024, // 256GB
			Latency:      100,
			Bandwidth:    64,
			Status:       "active",
			LastSeen:     time.Now(),
		},
		{
			ID:           "cxl-dev-002",
			Type:         "Type-3",
			VendorID:     "0x8086",
			DeviceID:     "0x0b5a",
			SerialNumber: "SN987654321",
			FirmwareVer:  "1.2.3",
			Capacity:     512 * 1024 * 1024 * 1024, // 512GB
			Latency:      120,
			Bandwidth:    64,
			Status:       "active",
			LastSeen:     time.Now(),
		},
		{
			ID:           "cxl-dev-003",
			Type:         "Type-2",
			VendorID:     "0x10de",
			DeviceID:     "0x2204",
			SerialNumber: "SN555666777",
			FirmwareVer:  "2.1.0",
			Capacity:     0, // Type-2 devices don't have memory
			Latency:      50,
			Bandwidth:    128,
			Status:       "active",
			LastSeen:     time.Now(),
		},
	}

	for _, device := range devices {
		s.devices[device.ID] = device
	}
}

// ListDevices returns all CXL devices
func (s *FabricManagerService) ListDevices() []*CXLDevice {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	devices := make([]*CXLDevice, 0, len(s.devices))
	for _, device := range s.devices {
		devices = append(devices, device)
	}
	return devices
}

// GetDevice returns a specific device
func (s *FabricManagerService) GetDevice(id string) (*CXLDevice, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	device, exists := s.devices[id]
	if !exists {
		return nil, fmt.Errorf("device %s not found", id)
	}
	return device, nil
}

// CreatePath creates a new fabric path
func (s *FabricManagerService) CreatePath(req PathRequest) (*FabricPath, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Validate source device
	_, exists := s.devices[req.SourceDevice]
	if !exists {
		return nil, fmt.Errorf("source device %s not found", req.SourceDevice)
	}

	// Validate target device
	_, exists = s.devices[req.TargetDevice]
	if !exists {
		return nil, fmt.Errorf("target device %s not found", req.TargetDevice)
	}

	// Generate path ID
	pathID := fmt.Sprintf("path-%04d", s.nextPathID)
	s.nextPathID++

    // Create path; validate PathType
    switch req.PathType {
    case "PBR", "GIM", "Direct":
    default:
        return nil, fmt.Errorf("unsupported path_type: %s", req.PathType)
    }
    // Create path
    path := &FabricPath{
        ID:           pathID,
        SourceDevice: req.SourceDevice,
        TargetDevice: req.TargetDevice,
        PathType:     req.PathType,
        Bandwidth:    req.Bandwidth,
        Latency:      req.Latency,
        QoS:          req.QoS,
        Status:       "active",
        CreatedAt:    time.Now(),
    }

	s.paths[pathID] = path
	return path, nil
}

// SetDeviceState updates a device status
func (s *FabricManagerService) SetDeviceState(id string, status string) (*CXLDevice, error) {
    s.mutex.Lock()
    defer s.mutex.Unlock()
    dev, ok := s.devices[id]
    if !ok { return nil, fmt.Errorf("device %s not found", id) }
    switch status {
    case "active", "maintenance", "disabled":
        dev.Status = status
        dev.LastSeen = time.Now()
        return dev, nil
    default:
        return nil, fmt.Errorf("invalid status: %s", status)
    }
}

// AddPolicy adds or updates a policy
func (s *FabricManagerService) AddPolicy(p Policy) (*Policy, error) {
    s.mutex.Lock()
    defer s.mutex.Unlock()
    if p.Name == "" { return nil, fmt.Errorf("policy name required") }
    if p.Match != "device" && p.Match != "path" { return nil, fmt.Errorf("match must be 'device' or 'path'") }
    p.CreatedAt = time.Now()
    s.policies[p.Name] = &p
    // Apply to existing objects (best-effort)
    if p.Enabled {
        if p.Match == "path" {
            if path, ok := s.paths[p.TargetID]; ok {
                path.QoS = p.QoS
            }
        }
        // For device policies, a real system would push QTG; here we mark LastSeen
        if p.Match == "device" {
            if dev, ok := s.devices[p.TargetID]; ok {
                dev.LastSeen = time.Now()
            }
        }
    }
    return s.policies[p.Name], nil
}

func (s *FabricManagerService) ListPolicies() []*Policy {
    s.mutex.RLock()
    defer s.mutex.RUnlock()
    out := make([]*Policy, 0, len(s.policies))
    for _, p := range s.policies { out = append(out, p) }
    return out
}

func (s *FabricManagerService) DeletePolicy(name string) error {
    s.mutex.Lock()
    defer s.mutex.Unlock()
    if _, ok := s.policies[name]; !ok { return fmt.Errorf("policy %s not found", name) }
    delete(s.policies, name)
    return nil
}

// ListPaths returns all fabric paths
func (s *FabricManagerService) ListPaths() []*FabricPath {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	paths := make([]*FabricPath, 0, len(s.paths))
	for _, path := range s.paths {
		paths = append(paths, path)
	}
	return paths
}

// GetPath returns a specific path
func (s *FabricManagerService) GetPath(id string) (*FabricPath, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	path, exists := s.paths[id]
	if !exists {
		return nil, fmt.Errorf("path %s not found", id)
	}
	return path, nil
}

// AttestDevice performs device attestation
func (s *FabricManagerService) AttestDevice(req AttestationRequest) (*AttestationTicket, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Check if device exists
	device, exists := s.devices[req.DeviceID]
	if !exists {
		return nil, fmt.Errorf("device %s not found", req.DeviceID)
	}

	// Generate attestation ticket
	ticketID := fmt.Sprintf("attest-%d", time.Now().Unix())
	ticket := &AttestationTicket{
		DeviceID:     req.DeviceID,
		TicketID:     ticketID,
		FirmwareHash: fmt.Sprintf("sha256:%x", []byte(device.FirmwareVer)),
		ConfigHash:   fmt.Sprintf("sha256:%x", []byte(device.SerialNumber)),
		Signature:    fmt.Sprintf("pqc-sig-%x", []byte(ticketID)),
		IssuedAt:     time.Now(),
		ExpiresAt:    time.Now().Add(24 * time.Hour),
		Valid:        true,
	}

	s.attestations[ticketID] = ticket
	return ticket, nil
}

// VerifyAttestation verifies an attestation ticket
func (s *FabricManagerService) VerifyAttestation(ticketID string) (*AttestationTicket, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	ticket, exists := s.attestations[ticketID]
	if !exists {
		return nil, fmt.Errorf("attestation ticket %s not found", ticketID)
	}

	// Check if ticket is still valid
	if time.Now().After(ticket.ExpiresAt) {
		ticket.Valid = false
	}

	return ticket, nil
}

// HTTP handlers
func (s *FabricManagerService) handleListDevices(w http.ResponseWriter, r *http.Request) {
	devices := s.ListDevices()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(devices)
}

func (s *FabricManagerService) handleGetDevice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	device, err := s.GetDevice(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(device)
}

func (s *FabricManagerService) handleDeviceState(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id := vars["id"]
    var req DeviceStateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    dev, err := s.SetDeviceState(id, req.Status)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(dev)
}

func (s *FabricManagerService) handleCreatePath(w http.ResponseWriter, r *http.Request) {
	var req PathRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	path, err := s.CreatePath(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(path)
}

func (s *FabricManagerService) handleListPaths(w http.ResponseWriter, r *http.Request) {
	paths := s.ListPaths()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(paths)
}

func (s *FabricManagerService) handleGetPath(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	path, err := s.GetPath(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(path)
}

func (s *FabricManagerService) handleAddPolicy(w http.ResponseWriter, r *http.Request) {
    var p Policy
    if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    pol, err := s.AddPolicy(p)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(pol)
}

func (s *FabricManagerService) handleListPolicies(w http.ResponseWriter, r *http.Request) {
    pols := s.ListPolicies()
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(pols)
}

func (s *FabricManagerService) handleDeletePolicy(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    name := vars["name"]
    if err := s.DeletePolicy(name); err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }
    w.WriteHeader(http.StatusNoContent)
}

func (s *FabricManagerService) handleAttestDevice(w http.ResponseWriter, r *http.Request) {
	var req AttestationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ticket, err := s.AttestDevice(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ticket)
}

func (s *FabricManagerService) handleVerifyAttestation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	ticketID := vars["ticket_id"]

	ticket, err := s.VerifyAttestation(ticketID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ticket)
}

func (s *FabricManagerService) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	// Create fabric manager service
	service := NewFabricManagerService()

	// Set up HTTP router
	router := mux.NewRouter()
	api := router.PathPrefix("/v1/fabman").Subrouter()

    // Device endpoints
    api.HandleFunc("/devices", service.handleListDevices).Methods("GET")
    api.HandleFunc("/devices/{id}", service.handleGetDevice).Methods("GET")
    api.HandleFunc("/devices/{id}/state", service.handleDeviceState).Methods("POST")

    // Path endpoints
    api.HandleFunc("/paths", service.handleCreatePath).Methods("POST")
    api.HandleFunc("/paths", service.handleListPaths).Methods("GET")
    api.HandleFunc("/paths/{id}", service.handleGetPath).Methods("GET")

    // Policy endpoints
    api.HandleFunc("/policies", service.handleAddPolicy).Methods("POST")
    api.HandleFunc("/policies", service.handleListPolicies).Methods("GET")
    api.HandleFunc("/policies/{name}", service.handleDeletePolicy).Methods("DELETE")

	// Attestation endpoints
	api.HandleFunc("/attest", service.handleAttestDevice).Methods("POST")
	api.HandleFunc("/attest/{ticket_id}", service.handleVerifyAttestation).Methods("GET")

	// Health check
	router.HandleFunc("/health", service.handleHealth).Methods("GET")

	// Start server
	log.Println("Starting Fabric Manager service on :8083")
	log.Fatal(http.ListenAndServe(":8083", router))
}
