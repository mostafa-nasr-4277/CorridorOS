package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// CalibrationRequest represents a HELIOPASS calibration request
type CalibrationRequest struct {
	CorridorID       string    `json:"corridor_id"`
	TargetBER        float64   `json:"target_ber"`
	AmbientProfile   string    `json:"ambient_profile"`
	CurrentBER       float64   `json:"current_ber"`
	CurrentEyeMargin float64   `json:"current_eye_margin"`
	Temperature      float64   `json:"temperature_c"`
	LambdaCount      int       `json:"lambda_count"`
}

// CalibrationResponse represents the calibration results
type CalibrationResponse struct {
	Status            string    `json:"status"`
	Converged         bool      `json:"converged"`
	BiasVoltages      []float64 `json:"bias_voltages_mv"`
	LambdaShifts      []float64 `json:"lambda_shifts_nm"`
	LaserPowerAdjust  []float64 `json:"laser_power_adjust_db"`
	ConvergenceTimeMs int64     `json:"convergence_time_ms"`
	FinalBER          float64   `json:"final_ber"`
	FinalEyeMargin    float64   `json:"final_eye_margin"`
	PowerSavings      float64   `json:"power_savings_percent"`
}

// AmbientProfile represents environmental conditions
type AmbientProfile struct {
	Name           string  `json:"name"`
	Temperature    float64 `json:"temperature_c"`
	Humidity       float64 `json:"humidity_percent"`
	VibrationRMS   float64 `json:"vibration_rms_um"`
	EMINoise       float64 `json:"emi_noise_db"`
	DriftRate      float64 `json:"drift_rate_nm_per_hour"`
	StabilityClass string  `json:"stability_class"`
}

// HELIOPASSService manages optical calibration
type HELIOPASSService struct {
	profiles map[string]AmbientProfile
}

// NewHELIOPASSService creates a new HELIOPASS service
func NewHELIOPASSService() *HELIOPASSService {
	profiles := map[string]AmbientProfile{
		"lab_default": {
			Name:           "Laboratory Default",
			Temperature:    22.0,
			Humidity:       45.0,
			VibrationRMS:   0.1,
			EMINoise:       -80.0,
			DriftRate:      0.001,
			StabilityClass: "excellent",
		},
		"field_noise_low": {
			Name:           "Field Low Noise",
			Temperature:    25.0,
			Humidity:       60.0,
			VibrationRMS:   1.0,
			EMINoise:       -70.0,
			DriftRate:      0.01,
			StabilityClass: "good",
		},
		"field_noise_high": {
			Name:           "Field High Noise",
			Temperature:    30.0,
			Humidity:       80.0,
			VibrationRMS:   5.0,
			EMINoise:       -60.0,
			DriftRate:      0.1,
			StabilityClass: "fair",
		},
		"datacenter": {
			Name:           "Data Center",
			Temperature:    24.0,
			Humidity:       50.0,
			VibrationRMS:   0.5,
			EMINoise:       -75.0,
			DriftRate:      0.005,
			StabilityClass: "excellent",
		},
	}

	return &HELIOPASSService{
		profiles: profiles,
	}
}

// Calibrate performs HELIOPASS calibration
func (s *HELIOPASSService) Calibrate(req CalibrationRequest) (*CalibrationResponse, error) {
	start := time.Now()

	// Get ambient profile
	profile, exists := s.profiles[req.AmbientProfile]
	if !exists {
		return nil, fmt.Errorf("unknown ambient profile: %s", req.AmbientProfile)
	}

	// Simulate calibration algorithm
	// This is a simplified version - real HELIOPASS would use sophisticated optimization

	// Initialize with current values
	currentBER := req.CurrentBER
	targetBER := req.TargetBER
	lambdaCount := req.LambdaCount
	if lambdaCount == 0 {
		lambdaCount = 8 // Default
	}

	// Generate initial bias voltages (typical range: 0.8-1.5V)
	biasVoltages := make([]float64, lambdaCount)
	for i := range biasVoltages {
		biasVoltages[i] = 1.2 + (rand.Float64()-0.5)*0.2
	}

	// Generate lambda shifts (typical range: ±0.1nm)
	lambdaShifts := make([]float64, lambdaCount)
	for i := range lambdaShifts {
		lambdaShifts[i] = (rand.Float64() - 0.5) * 0.02
	}

	// Generate laser power adjustments (typical range: ±2dB)
	laserPowerAdjust := make([]float64, lambdaCount)
	for i := range laserPowerAdjust {
		laserPowerAdjust[i] = (rand.Float64() - 0.5) * 0.5
	}

	// Simulate convergence process
	converged := false
	iterations := 0
	maxIterations := 20

	for !converged && iterations < maxIterations {
		iterations++

		// Simulate BER improvement
		improvement := math.Exp(-float64(iterations) * 0.2)
		currentBER = targetBER + (currentBER-targetBER)*improvement

		// Check convergence
		if currentBER <= targetBER*1.1 { // 10% tolerance
			converged = true
		}

		// Add some randomness to simulate real-world behavior
		if rand.Float64() < 0.1 {
			// Random perturbation
			for i := range biasVoltages {
				biasVoltages[i] += (rand.Float64() - 0.5) * 0.01
			}
		}
	}

	// Calculate final metrics
	convergenceTime := time.Since(start)
	finalEyeMargin := 0.8 + rand.Float64()*0.4 // 0.8-1.2 UI
	powerSavings := rand.Float64() * 15.0 // 0-15% power savings

	// Apply ambient profile effects
	driftFactor := 1.0 + profile.DriftRate*convergenceTime.Hours()
	for i := range lambdaShifts {
		lambdaShifts[i] *= driftFactor
	}

	// Temperature compensation
	tempFactor := 1.0 + (req.Temperature-profile.Temperature)*0.001
	for i := range biasVoltages {
		biasVoltages[i] *= tempFactor
	}

	status := "converged"
	if !converged {
		status = "partial_convergence"
	}

	return &CalibrationResponse{
		Status:            status,
		Converged:         converged,
		BiasVoltages:      biasVoltages,
		LambdaShifts:      lambdaShifts,
		LaserPowerAdjust:  laserPowerAdjust,
		ConvergenceTimeMs: convergenceTime.Milliseconds(),
		FinalBER:          currentBER,
		FinalEyeMargin:    finalEyeMargin,
		PowerSavings:      powerSavings,
	}, nil
}

// GetProfiles returns available ambient profiles
func (s *HELIOPASSService) GetProfiles() map[string]AmbientProfile {
	return s.profiles
}

// HTTP handlers
func (s *HELIOPASSService) handleCalibrate(w http.ResponseWriter, r *http.Request) {
	var req CalibrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	response, err := s.Calibrate(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *HELIOPASSService) handleGetProfiles(w http.ResponseWriter, r *http.Request) {
	profiles := s.GetProfiles()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profiles)
}

func (s *HELIOPASSService) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	// Create HELIOPASS service
	service := NewHELIOPASSService()

	// Set up HTTP router
	router := mux.NewRouter()
	api := router.PathPrefix("/v1/heliopass").Subrouter()

	// API endpoints
	api.HandleFunc("/calibrate", service.handleCalibrate).Methods("POST")
	api.HandleFunc("/profiles", service.handleGetProfiles).Methods("GET")
	api.HandleFunc("/health", service.handleHealth).Methods("GET")

	// Health check
	router.HandleFunc("/health", service.handleHealth).Methods("GET")

	// Start server
	log.Println("Starting HELIOPASS service on :8082")
	log.Fatal(http.ListenAndServe(":8082", router))
}
