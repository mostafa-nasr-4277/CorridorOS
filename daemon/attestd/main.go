package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
)

// AttestationRequest represents a device attestation request
type AttestationRequest struct {
	DeviceID     string `json:"device_id"`
	DeviceType   string `json:"device_type"`
	FirmwareHash string `json:"firmware_hash"`
	ConfigHash   string `json:"config_hash"`
	RequirePQC   bool   `json:"require_pqc"`
}

// AttestationResult represents the result of attestation
type AttestationResult struct {
	DeviceID       string    `json:"device_id"`
	AttestationID  string    `json:"attestation_id"`
	Valid          bool      `json:"valid"`
	TrustLevel     string    `json:"trust_level"` // high, medium, low, untrusted
	FirmwareValid  bool      `json:"firmware_valid"`
	ConfigValid    bool      `json:"config_valid"`
	PQCSignature   string    `json:"pqc_signature"`
	IssuedAt       time.Time `json:"issued_at"`
	ExpiresAt      time.Time `json:"expires_at"`
	Error          string    `json:"error,omitempty"`
}

// MeasuredBoot represents measured boot data
type MeasuredBoot struct {
	PCR0    string `json:"pcr0"`    // Platform Configuration Register 0
	PCR1    string `json:"pcr1"`    // Platform Configuration Register 1
	PCR2    string `json:"pcr2"`    // Platform Configuration Register 2
	PCR7    string `json:"pcr7"`    // Platform Configuration Register 7
	TPMVer  string `json:"tpm_version"`
	Vendor  string `json:"vendor"`
	Model   string `json:"model"`
}

// SPDMRequest represents SPDM attestation request
type SPDMRequest struct {
	DeviceID     string `json:"device_id"`
	Capabilities string `json:"capabilities"`
	Version      string `json:"version"`
}

// SPDMResponse represents SPDM attestation response
type SPDMResponse struct {
	DeviceID       string    `json:"device_id"`
	SPDMVersion    string    `json:"spdm_version"`
	Capabilities   []string  `json:"capabilities"`
	Certificate    string    `json:"certificate"`
	Challenge      string    `json:"challenge"`
	Response       string    `json:"response"`
	Valid          bool      `json:"valid"`
	AttestedAt     time.Time `json:"attested_at"`
}

// AttestationService manages device attestation
type AttestationService struct {
	attestations map[string]*AttestationResult
	measuredBoot map[string]*MeasuredBoot
	spdmSessions map[string]*SPDMResponse
	mutex        sync.RWMutex
	nextID       int
}

// NewAttestationService creates a new attestation service
func NewAttestationService() *AttestationService {
	service := &AttestationService{
		attestations: make(map[string]*AttestationResult),
		measuredBoot: make(map[string]*MeasuredBoot),
		spdmSessions: make(map[string]*SPDMResponse),
		nextID:       1,
	}

	// Initialize with some mock measured boot data
	service.initializeMockMeasuredBoot()
	return service
}

// initializeMockMeasuredBoot creates mock measured boot data
func (s *AttestationService) initializeMockMeasuredBoot() {
	devices := []string{"cxl-dev-001", "cxl-dev-002", "cxl-dev-003", "corridor-001"}
	
	for _, deviceID := range devices {
		s.measuredBoot[deviceID] = &MeasuredBoot{
			PCR0:   s.generateHash("BIOS"),
			PCR1:   s.generateHash("Platform"),
			PCR2:   s.generateHash("OptionROM"),
			PCR7:   s.generateHash("SecureBoot"),
			TPMVer: "2.0",
			Vendor: "Intel",
			Model:  "CXL Device",
		}
	}
}

// generateHash generates a mock hash
func (s *AttestationService) generateHash(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// AttestDevice performs device attestation
func (s *AttestationService) AttestDevice(req AttestationRequest) (*AttestationResult, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Generate attestation ID
	attestationID := fmt.Sprintf("attest-%d", s.nextID)
	s.nextID++

	// Validate firmware hash
	firmwareValid := s.validateFirmwareHash(req.FirmwareHash)
	
	// Validate config hash
	configValid := s.validateConfigHash(req.ConfigHash)
	
	// Determine trust level
	trustLevel := s.determineTrustLevel(firmwareValid, configValid, req.RequirePQC)
	
	// Generate PQC signature if required
	pqcSignature := ""
	if req.RequirePQC {
		pqcSignature = s.generatePQCSignature(attestationID)
	}

	// Create attestation result
	result := &AttestationResult{
		DeviceID:      req.DeviceID,
		AttestationID: attestationID,
		Valid:         firmwareValid && configValid,
		TrustLevel:    trustLevel,
		FirmwareValid: firmwareValid,
		ConfigValid:   configValid,
		PQCSignature:  pqcSignature,
		IssuedAt:      time.Now(),
		ExpiresAt:     time.Now().Add(24 * time.Hour),
	}

	s.attestations[attestationID] = result
	return result, nil
}

// validateFirmwareHash validates firmware hash against known good hashes
func (s *AttestationService) validateFirmwareHash(hash string) bool {
	// In a real implementation, this would check against a database of known good hashes
	// For now, we'll simulate validation
	knownHashes := []string{
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // empty string
		"2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae", // "foo"
		"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", // "abc"
	}
	
	for _, knownHash := range knownHashes {
		if hash == knownHash {
			return true
		}
	}
	
	// Simulate some validation logic
	return len(hash) == 64 && hash != "0000000000000000000000000000000000000000000000000000000000000000"
}

// validateConfigHash validates configuration hash
func (s *AttestationService) validateConfigHash(hash string) bool {
	// Similar to firmware validation
	return len(hash) == 64 && hash != "0000000000000000000000000000000000000000000000000000000000000000"
}

// determineTrustLevel determines the trust level based on validation results
func (s *AttestationService) determineTrustLevel(firmwareValid, configValid, pqcRequired bool) string {
	if firmwareValid && configValid {
		if pqcRequired {
			return "high"
		}
		return "medium"
	}
	if firmwareValid || configValid {
		return "low"
	}
	return "untrusted"
}

// generatePQCSignature generates a mock PQC signature
func (s *AttestationService) generatePQCSignature(data string) string {
	// In a real implementation, this would use actual PQC algorithms like Kyber/Dilithium
	hash := sha256.Sum256([]byte(data + "pqc-salt"))
	return "pqc-sig-" + hex.EncodeToString(hash[:])
}

// GetAttestation retrieves an attestation result
func (s *AttestationService) GetAttestation(attestationID string) (*AttestationResult, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	result, exists := s.attestations[attestationID]
	if !exists {
		return nil, fmt.Errorf("attestation %s not found", attestationID)
	}

	// Check if expired
	if time.Now().After(result.ExpiresAt) {
		result.Valid = false
	}

	return result, nil
}

// GetMeasuredBoot retrieves measured boot data for a device
func (s *AttestationService) GetMeasuredBoot(deviceID string) (*MeasuredBoot, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	boot, exists := s.measuredBoot[deviceID]
	if !exists {
		return nil, fmt.Errorf("measured boot data for device %s not found", deviceID)
	}

	return boot, nil
}

// SPDMAttest performs SPDM attestation
func (s *AttestationService) SPDMAttest(req SPDMRequest) (*SPDMResponse, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Generate challenge
	challenge := make([]byte, 32)
	rand.Read(challenge)
	challengeHex := hex.EncodeToString(challenge)

	// Generate response (simplified)
	response := s.generateHash(req.DeviceID + challengeHex)

	// Create SPDM response
	spdmResp := &SPDMResponse{
		DeviceID:     req.DeviceID,
		SPDMVersion:  "1.2.0",
		Capabilities: []string{"measurement", "certificate", "challenge"},
		Certificate:  s.generateHash("cert-" + req.DeviceID),
		Challenge:    challengeHex,
		Response:     response,
		Valid:        true,
		AttestedAt:   time.Now(),
	}

	sessionID := fmt.Sprintf("spdm-%d", s.nextID)
	s.nextID++
	s.spdmSessions[sessionID] = spdmResp

	return spdmResp, nil
}

// HTTP handlers
func (s *AttestationService) handleAttestDevice(w http.ResponseWriter, r *http.Request) {
	var req AttestationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := s.AttestDevice(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

func (s *AttestationService) handleGetAttestation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	attestationID := vars["attestation_id"]

	result, err := s.GetAttestation(attestationID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (s *AttestationService) handleGetMeasuredBoot(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	deviceID := vars["device_id"]

	boot, err := s.GetMeasuredBoot(deviceID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(boot)
}

func (s *AttestationService) handleSPDMAttest(w http.ResponseWriter, r *http.Request) {
	var req SPDMRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	result, err := s.SPDMAttest(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(result)
}

func (s *AttestationService) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	// Create attestation service
	service := NewAttestationService()

	// Set up HTTP router
	router := mux.NewRouter()
	api := router.PathPrefix("/v1/attest").Subrouter()

	// Attestation endpoints
	api.HandleFunc("/device", service.handleAttestDevice).Methods("POST")
	api.HandleFunc("/{attestation_id}", service.handleGetAttestation).Methods("GET")
	api.HandleFunc("/measured-boot/{device_id}", service.handleGetMeasuredBoot).Methods("GET")
	api.HandleFunc("/spdm", service.handleSPDMAttest).Methods("POST")

	// Health check
	router.HandleFunc("/health", service.handleHealth).Methods("GET")

	// Start server
	log.Println("Starting Attestation service on :8084")
	log.Fatal(http.ListenAndServe(":8084", router))
}
