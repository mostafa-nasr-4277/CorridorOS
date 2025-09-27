package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/corridoros/security/pqc"
	"github.com/corridoros/security/confidential"
)

// SecurityService manages all security features
type SecurityService struct {
	// PQC key management
	pqcKeys map[string]*pqc.PQCKeyPair
	
	// Confidential compute
	confidentialService *confidential.ConfidentialComputeService
	
	// Security policies
	policies map[string]*SecurityPolicy
	
	// Audit log
	auditLog []*AuditEntry
	
	mutex sync.RWMutex
}

// SecurityPolicy represents a security policy
type SecurityPolicy struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Rules       []SecurityRule    `json:"rules"`
	Enabled     bool              `json:"enabled"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// SecurityRule represents a security rule
type SecurityRule struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`        // access_control, encryption, attestation
	Condition   string                 `json:"condition"`   // JSON path expression
	Action      string                 `json:"action"`      // allow, deny, encrypt, require_attestation
	Parameters  map[string]interface{} `json:"parameters"`
	Priority    int                    `json:"priority"`
}

// AuditEntry represents an audit log entry
type AuditEntry struct {
	ID        string                 `json:"id"`
	Timestamp time.Time              `json:"timestamp"`
	Event     string                 `json:"event"`
	User      string                 `json:"user,omitempty"`
	Resource  string                 `json:"resource,omitempty"`
	Action    string                 `json:"action"`
	Result    string                 `json:"result"` // success, failure, error
	Details   map[string]interface{} `json:"details,omitempty"`
}

// KeyManagementRequest represents a key management request
type KeyManagementRequest struct {
	Algorithm string            `json:"algorithm"`
	Purpose   string            `json:"purpose"` // encryption, signing, authentication
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// EnclaveRequest represents an enclave creation request
type EnclaveRequest struct {
	Type       string            `json:"type"`
	MemorySize int64             `json:"memory_size"`
	CPUCount   int               `json:"cpu_count"`
	Metadata   map[string]string `json:"metadata,omitempty"`
}

// SecretRequest represents a secret storage request
type SecretRequest struct {
	EnclaveID string            `json:"enclave_id"`
	Name      string            `json:"name"`
	Type      string            `json:"type"`
	Value     string            `json:"value"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

// NewSecurityService creates a new security service
func NewSecurityService() *SecurityService {
	service := &SecurityService{
		pqcKeys:            make(map[string]*pqc.PQCKeyPair),
		confidentialService: confidential.NewConfidentialComputeService(),
		policies:           make(map[string]*SecurityPolicy),
		auditLog:           make([]*AuditEntry, 0),
	}

	// Initialize default policies
	service.initializeDefaultPolicies()
	return service
}

// initializeDefaultPolicies creates default security policies
func (s *SecurityService) initializeDefaultPolicies() {
	// Default encryption policy
	encryptionPolicy := &SecurityPolicy{
		ID:          "default-encryption",
		Name:        "Default Encryption Policy",
		Description: "Requires encryption for all sensitive data",
		Rules: []SecurityRule{
			{
				ID:        "encrypt-sensitive-data",
				Type:      "encryption",
				Condition: "$.data_type == 'sensitive'",
				Action:    "encrypt",
				Parameters: map[string]interface{}{
					"algorithm": "kyber",
					"key_size":  256,
				},
				Priority: 1,
			},
		},
		Enabled:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Default access control policy
	accessPolicy := &SecurityPolicy{
		ID:          "default-access-control",
		Name:        "Default Access Control Policy",
		Description: "Controls access to resources based on user roles",
		Rules: []SecurityRule{
			{
				ID:        "admin-only-access",
				Type:      "access_control",
				Condition: "$.resource_type == 'admin'",
				Action:    "require_role",
				Parameters: map[string]interface{}{
					"required_role": "admin",
				},
				Priority: 1,
			},
		},
		Enabled:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	s.policies[encryptionPolicy.ID] = encryptionPolicy
	s.policies[accessPolicy.ID] = accessPolicy
}

// GeneratePQCKey generates a new PQC key pair
func (s *SecurityService) GeneratePQCKey(req KeyManagementRequest) (*pqc.PQCKeyPair, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	keyPair, err := pqc.GeneratePQCKeyPair(req.Algorithm)
	if err != nil {
		s.logAuditEvent("key_generation", "system", "", "generate_pqc_key", "failure", map[string]interface{}{
			"algorithm": req.Algorithm,
			"error":     err.Error(),
		})
		return nil, err
	}

	// Store key pair
	keyID := pqc.GenerateKeyID(keyPair.PublicKey)
	s.pqcKeys[keyID] = keyPair

	s.logAuditEvent("key_generation", "system", "", "generate_pqc_key", "success", map[string]interface{}{
		"algorithm": req.Algorithm,
		"key_id":    keyID,
	})

	return keyPair, nil
}

// GetPQCKey retrieves a PQC key pair
func (s *SecurityService) GetPQCKey(keyID string) (*pqc.PQCKeyPair, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	keyPair, exists := s.pqcKeys[keyID]
	if !exists {
		return nil, fmt.Errorf("key %s not found", keyID)
	}

	s.logAuditEvent("key_access", "system", "", "get_pqc_key", "success", map[string]interface{}{
		"key_id": keyID,
	})

	return keyPair, nil
}

// ListPQCKeys returns all PQC key pairs
func (s *SecurityService) ListPQCKeys() []*pqc.PQCKeyPair {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	keys := make([]*pqc.PQCKeyPair, 0, len(s.pqcKeys))
	for _, key := range s.pqcKeys {
		keys = append(keys, key)
	}
	return keys
}

// CreateEnclave creates a new secure enclave
func (s *SecurityService) CreateEnclave(req EnclaveRequest) (*confidential.Enclave, error) {
	enclave, err := s.confidentialService.CreateEnclave(req.Type, req.MemorySize, req.CPUCount)
	if err != nil {
		s.logAuditEvent("enclave_creation", "system", "", "create_enclave", "failure", map[string]interface{}{
			"type":        req.Type,
			"memory_size": req.MemorySize,
			"error":       err.Error(),
		})
		return nil, err
	}

	s.logAuditEvent("enclave_creation", "system", "", "create_enclave", "success", map[string]interface{}{
		"enclave_id":  enclave.ID,
		"type":        req.Type,
		"memory_size": req.MemorySize,
	})

	return enclave, nil
}

// GetEnclave retrieves an enclave
func (s *SecurityService) GetEnclave(enclaveID string) (*confidential.Enclave, error) {
	enclave, err := s.confidentialService.GetEnclave(enclaveID)
	if err != nil {
		s.logAuditEvent("enclave_access", "system", enclaveID, "get_enclave", "failure", map[string]interface{}{
			"error": err.Error(),
		})
		return nil, err
	}

	s.logAuditEvent("enclave_access", "system", enclaveID, "get_enclave", "success", nil)
	return enclave, nil
}

// ListEnclaves returns all enclaves
func (s *SecurityService) ListEnclaves() []*confidential.Enclave {
	return s.confidentialService.ListEnclaves()
}

// StoreSecret stores a secret in an enclave
func (s *SecurityService) StoreSecret(req SecretRequest) (*confidential.Secret, error) {
	secret, err := s.confidentialService.StoreSecret(req.EnclaveID, req.Name, req.Type, []byte(req.Value), req.Metadata)
	if err != nil {
		s.logAuditEvent("secret_storage", "system", req.EnclaveID, "store_secret", "failure", map[string]interface{}{
			"secret_name": req.Name,
			"error":       err.Error(),
		})
		return nil, err
	}

	s.logAuditEvent("secret_storage", "system", req.EnclaveID, "store_secret", "success", map[string]interface{}{
		"secret_id":   secret.ID,
		"secret_name": req.Name,
	})

	return secret, nil
}

// RetrieveSecret retrieves a secret from an enclave
func (s *SecurityService) RetrieveSecret(secretID string) ([]byte, error) {
	value, err := s.confidentialService.RetrieveSecret(secretID)
	if err != nil {
		s.logAuditEvent("secret_retrieval", "system", "", "retrieve_secret", "failure", map[string]interface{}{
			"secret_id": secretID,
			"error":     err.Error(),
		})
		return nil, err
	}

	s.logAuditEvent("secret_retrieval", "system", "", "retrieve_secret", "success", map[string]interface{}{
		"secret_id": secretID,
	})

	return value, nil
}

// CreatePolicy creates a new security policy
func (s *SecurityService) CreatePolicy(policy *SecurityPolicy) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	policy.ID = fmt.Sprintf("policy-%d", len(s.policies)+1)
	policy.CreatedAt = time.Now()
	policy.UpdatedAt = time.Now()

	s.policies[policy.ID] = policy

	s.logAuditEvent("policy_creation", "system", "", "create_policy", "success", map[string]interface{}{
		"policy_id":   policy.ID,
		"policy_name": policy.Name,
	})

	return nil
}

// GetPolicy retrieves a security policy
func (s *SecurityService) GetPolicy(policyID string) (*SecurityPolicy, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	policy, exists := s.policies[policyID]
	if !exists {
		return nil, fmt.Errorf("policy %s not found", policyID)
	}

	return policy, nil
}

// ListPolicies returns all security policies
func (s *SecurityService) ListPolicies() []*SecurityPolicy {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	policies := make([]*SecurityPolicy, 0, len(s.policies))
	for _, policy := range s.policies {
		policies = append(policies, policy)
	}
	return policies
}

// GetAuditLog returns the audit log
func (s *SecurityService) GetAuditLog() []*AuditEntry {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	return s.auditLog
}

// logAuditEvent logs an audit event
func (s *SecurityService) logAuditEvent(event, user, resource, action, result string, details map[string]interface{}) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	entry := &AuditEntry{
		ID:        fmt.Sprintf("audit-%d", len(s.auditLog)+1),
		Timestamp: time.Now(),
		Event:     event,
		User:      user,
		Resource:  resource,
		Action:    action,
		Result:    result,
		Details:   details,
	}

	s.auditLog = append(s.auditLog, entry)

	// Keep only last 1000 entries
	if len(s.auditLog) > 1000 {
		s.auditLog = s.auditLog[len(s.auditLog)-1000:]
	}
}

// HTTP handlers
func (s *SecurityService) handleGeneratePQCKey(w http.ResponseWriter, r *http.Request) {
	var req KeyManagementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	keyPair, err := s.GeneratePQCKey(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(keyPair)
}

func (s *SecurityService) handleGetPQCKey(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	keyID := vars["id"]

	keyPair, err := s.GetPQCKey(keyID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(keyPair)
}

func (s *SecurityService) handleListPQCKeys(w http.ResponseWriter, r *http.Request) {
	keys := s.ListPQCKeys()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(keys)
}

func (s *SecurityService) handleCreateEnclave(w http.ResponseWriter, r *http.Request) {
	var req EnclaveRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	enclave, err := s.CreateEnclave(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(enclave)
}

func (s *SecurityService) handleGetEnclave(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	enclaveID := vars["id"]

	enclave, err := s.GetEnclave(enclaveID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(enclave)
}

func (s *SecurityService) handleListEnclaves(w http.ResponseWriter, r *http.Request) {
	enclaves := s.ListEnclaves()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(enclaves)
}

func (s *SecurityService) handleStoreSecret(w http.ResponseWriter, r *http.Request) {
	var req SecretRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	secret, err := s.StoreSecret(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(secret)
}

func (s *SecurityService) handleRetrieveSecret(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	secretID := vars["id"]

	value, err := s.RetrieveSecret(secretID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"value": string(value)})
}

func (s *SecurityService) handleCreatePolicy(w http.ResponseWriter, r *http.Request) {
	var policy SecurityPolicy
	if err := json.NewDecoder(r.Body).Decode(&policy); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := s.CreatePolicy(&policy); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(policy)
}

func (s *SecurityService) handleGetPolicy(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	policyID := vars["id"]

	policy, err := s.GetPolicy(policyID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(policy)
}

func (s *SecurityService) handleListPolicies(w http.ResponseWriter, r *http.Request) {
	policies := s.ListPolicies()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(policies)
}

func (s *SecurityService) handleGetAuditLog(w http.ResponseWriter, r *http.Request) {
	auditLog := s.GetAuditLog()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(auditLog)
}

func (s *SecurityService) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	// Create security service
	service := NewSecurityService()

	// Set up HTTP router
	router := mux.NewRouter()
	api := router.PathPrefix("/v1/security").Subrouter()

	// PQC key management endpoints
	api.HandleFunc("/keys", service.handleGeneratePQCKey).Methods("POST")
	api.HandleFunc("/keys", service.handleListPQCKeys).Methods("GET")
	api.HandleFunc("/keys/{id}", service.handleGetPQCKey).Methods("GET")

	// Enclave management endpoints
	api.HandleFunc("/enclaves", service.handleCreateEnclave).Methods("POST")
	api.HandleFunc("/enclaves", service.handleListEnclaves).Methods("GET")
	api.HandleFunc("/enclaves/{id}", service.handleGetEnclave).Methods("GET")

	// Secret management endpoints
	api.HandleFunc("/secrets", service.handleStoreSecret).Methods("POST")
	api.HandleFunc("/secrets/{id}", service.handleRetrieveSecret).Methods("GET")

	// Policy management endpoints
	api.HandleFunc("/policies", service.handleCreatePolicy).Methods("POST")
	api.HandleFunc("/policies", service.handleListPolicies).Methods("GET")
	api.HandleFunc("/policies/{id}", service.handleGetPolicy).Methods("GET")

	// Audit log endpoint
	api.HandleFunc("/audit", service.handleGetAuditLog).Methods("GET")

	// Health check
	router.HandleFunc("/health", service.handleHealth).Methods("GET")

	// Start server
	log.Println("Starting Security service on :8089")
	log.Fatal(http.ListenAndServe(":8089", router))
}
