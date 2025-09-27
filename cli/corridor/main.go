package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

// CorridorRequest represents a corridor allocation request
type CorridorRequest struct {
    CorridorType      string    `json:"corridor_type"`
    Lanes             int       `json:"lanes"`
    LambdaNm          []int     `json:"lambda_nm"`
    MinGbps           int       `json:"min_gbps"`
    LatencyBudgetNs   int       `json:"latency_budget_ns"`
    ReachMm           int       `json:"reach_mm"`
    Mode              string    `json:"mode"`
    QoS               QoSConfig `json:"qos"`
    AttestationRequired bool    `json:"attestation_required"`
    AttestationTicket  string    `json:"attestation_ticket,omitempty"`
}

// QoSConfig represents QoS settings
type QoSConfig struct {
	PFC      bool   `json:"pfc"`
	Priority string `json:"priority"`
}

// CorridorResponse represents a corridor allocation response
type CorridorResponse struct {
	ID              string    `json:"id"`
	CorridorType    string    `json:"corridor_type"`
	Lanes           int       `json:"lanes"`
	LambdaNm        []int     `json:"lambda_nm"`
	MinGbps         int       `json:"min_gbps"`
	LatencyBudgetNs int       `json:"latency_budget_ns"`
	ReachMm         int       `json:"reach_mm"`
	Mode            string    `json:"mode"`
	QoS             QoSConfig `json:"qos"`
	AttestationRequired bool  `json:"attestation_required"`
	AchievableGbps  int       `json:"achievable_gbps"`
	BER             float64   `json:"ber"`
	EyeMargin       string    `json:"eye_margin"`
	CreatedAt       time.Time `json:"created_at"`
	Status          string    `json:"status"`
}

// TelemetryData represents corridor telemetry
type TelemetryData struct {
	BER                float64 `json:"ber"`
	TempC              float64 `json:"temp_c"`
	PowerPjPerBit      float64 `json:"power_pj_per_bit"`
	Drift              string  `json:"drift"`
	UtilizationPercent float64 `json:"utilization_percent"`
	ErrorCount         int     `json:"error_count"`
}

// RecalibrateRequest represents a recalibration request
type RecalibrateRequest struct {
	TargetBER      float64 `json:"target_ber"`
	AmbientProfile string  `json:"ambient_profile"`
}

// RecalibrateResponse represents recalibration response
type RecalibrateResponse struct {
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

var (
    corrdURL = "http://localhost:8080"
    verbose  bool
    attTicket string
)

func main() {
	var rootCmd = &cobra.Command{
		Use:   "corridor",
		Short: "CorridorOS Photonic Corridor Management CLI",
		Long:  "Manage photonic corridors, monitor performance, and calibrate optical lanes",
	}

	// Global flags
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")
    rootCmd.PersistentFlags().StringVar(&corrdURL, "url", "http://localhost:8080", "CorridorOS corrd service URL")
    rootCmd.PersistentFlags().StringVar(&attTicket, "attestation-ticket", "", "Attestation ticket ID (when --attestation is set)")

	// Add subcommands
	rootCmd.AddCommand(allocCmd)
	rootCmd.AddCommand(lanesAllocCmd)
	rootCmd.AddCommand(listCmd)
	rootCmd.AddCommand(getCmd)
	rootCmd.AddCommand(telemetryCmd)
	rootCmd.AddCommand(calibrateCmd)
	rootCmd.AddCommand(watchCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

var allocCmd = &cobra.Command{
	Use:   "alloc",
	Short: "Allocate a new photonic corridor",
	Long:  "Allocate a new photonic corridor with specified parameters",
	Run:   runAlloc,
}

var lanesAllocCmd = &cobra.Command{
	Use:   "lanes-alloc",
	Short: "Allocate photonic lanes with wavelength specification",
	Long:  "Allocate photonic corridor lanes starting from a specific wavelength",
	Run:   runLanesAlloc,
}

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List all corridors",
	Long:  "List all allocated corridors",
	Run:   runList,
}

var getCmd = &cobra.Command{
	Use:   "get <corridor_id>",
	Short: "Get corridor details",
	Long:  "Get detailed information about a specific corridor",
	Args:  cobra.ExactArgs(1),
	Run:   runGet,
}

var telemetryCmd = &cobra.Command{
	Use:   "telemetry <corridor_id>",
	Short: "Get corridor telemetry",
	Long:  "Get real-time telemetry data for a corridor",
	Args:  cobra.ExactArgs(1),
	Run:   runTelemetry,
}

var calibrateCmd = &cobra.Command{
	Use:   "calibrate <corridor_id>",
	Short: "Calibrate corridor",
	Long:  "Calibrate corridor using HELIOPASS",
	Args:  cobra.ExactArgs(1),
	Run:   runCalibrate,
}

var watchCmd = &cobra.Command{
	Use:   "watch <corridor_id>",
	Short: "Watch corridor telemetry",
	Long:  "Continuously monitor corridor telemetry",
	Args:  cobra.ExactArgs(1),
	Run:   runWatch,
}

func init() {
	// Allocation command flags
	allocCmd.Flags().String("type", "SiCorridor", "Corridor type (SiCorridor, CarbonCorridor)")
	allocCmd.Flags().Int("lanes", 8, "Number of lanes")
	allocCmd.Flags().String("lambda", "1550-1557", "Wavelength range (e.g., 1550-1557)")
	allocCmd.Flags().Int("min-gbps", 400, "Minimum bandwidth in Gbps")
	allocCmd.Flags().Int("latency-ns", 250, "Latency budget in nanoseconds")
	allocCmd.Flags().Int("reach-mm", 75, "Reach in millimeters")
	allocCmd.Flags().String("mode", "waveguide", "Transmission mode")
	allocCmd.Flags().Bool("pfc", true, "Enable Priority Flow Control")
	allocCmd.Flags().String("priority", "gold", "QoS priority (gold, silver, bronze)")
	allocCmd.Flags().Bool("attestation", true, "Require attestation")

	// Lanes allocation command flags
	lanesAllocCmd.Flags().String("type", "SiCorridor", "Corridor type (SiCorridor, CarbonCorridor)")
	lanesAllocCmd.Flags().Int("lanes", 8, "Number of lanes")
	lanesAllocCmd.Flags().Int("lambda-start", 1550, "Starting wavelength in nm")
	lanesAllocCmd.Flags().Int("min-gbps", 400, "Minimum bandwidth in Gbps")
	lanesAllocCmd.Flags().Int("latency-ns", 250, "Latency budget in nanoseconds")
	lanesAllocCmd.Flags().Int("reach-mm", 75, "Reach in millimeters")
	lanesAllocCmd.Flags().String("mode", "waveguide", "Transmission mode")
	lanesAllocCmd.Flags().Bool("pfc", true, "Enable Priority Flow Control")
	lanesAllocCmd.Flags().String("priority", "gold", "QoS priority (gold, silver, bronze)")
	lanesAllocCmd.Flags().Bool("attestation", true, "Require attestation")

	// Calibrate command flags
	calibrateCmd.Flags().Float64("target-ber", 1e-12, "Target BER")
	calibrateCmd.Flags().String("ambient", "lab_default", "Ambient profile")
}

func runAlloc(cmd *cobra.Command, args []string) {
	corridorType, _ := cmd.Flags().GetString("type")
	lanes, _ := cmd.Flags().GetInt("lanes")
	lambdaStr, _ := cmd.Flags().GetString("lambda")
	minGbps, _ := cmd.Flags().GetInt("min-gbps")
	latencyNs, _ := cmd.Flags().GetInt("latency-ns")
	reachMm, _ := cmd.Flags().GetInt("reach-mm")
	mode, _ := cmd.Flags().GetString("mode")
	pfc, _ := cmd.Flags().GetBool("pfc")
	priority, _ := cmd.Flags().GetString("priority")
    attestation, _ := cmd.Flags().GetBool("attestation")

	// Parse lambda range
	lambdaNm := parseLambdaRange(lambdaStr)

    req := CorridorRequest{
        CorridorType: corridorType,
        Lanes:        lanes,
        LambdaNm:     lambdaNm,
        MinGbps:      minGbps,
        LatencyBudgetNs: latencyNs,
        ReachMm:      reachMm,
        Mode:         mode,
        QoS: QoSConfig{
            PFC:      pfc,
            Priority: priority,
        },
        AttestationRequired: attestation,
        AttestationTicket:  attTicket,
    }

	resp, err := allocateCorridor(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error allocating corridor: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Corridor allocated successfully!\n")
	fmt.Printf("ID: %s\n", resp.ID)
	fmt.Printf("Type: %s\n", resp.CorridorType)
	fmt.Printf("Lanes: %d\n", resp.Lanes)
	fmt.Printf("Wavelengths: %v nm\n", resp.LambdaNm)
	fmt.Printf("Achievable Bandwidth: %d Gbps\n", resp.AchievableGbps)
	fmt.Printf("BER: %.2e\n", resp.BER)
	fmt.Printf("Eye Margin: %s\n", resp.EyeMargin)
	fmt.Printf("Status: %s\n", resp.Status)
}

func runLanesAlloc(cmd *cobra.Command, args []string) {
	corridorType, _ := cmd.Flags().GetString("type")
	lanes, _ := cmd.Flags().GetInt("lanes")
	lambdaStart, _ := cmd.Flags().GetInt("lambda-start")
	minGbps, _ := cmd.Flags().GetInt("min-gbps")
	latencyNs, _ := cmd.Flags().GetInt("latency-ns")
	reachMm, _ := cmd.Flags().GetInt("reach-mm")
	mode, _ := cmd.Flags().GetString("mode")
	pfc, _ := cmd.Flags().GetBool("pfc")
	priority, _ := cmd.Flags().GetString("priority")
	attestation, _ := cmd.Flags().GetBool("attestation")

	// Generate wavelength range starting from lambda-start
	lambdaNm := make([]int, lanes)
	for i := 0; i < lanes; i++ {
		lambdaNm[i] = lambdaStart + i
	}

	req := CorridorRequest{
		CorridorType: corridorType,
		Lanes:        lanes,
		LambdaNm:     lambdaNm,
		MinGbps:      minGbps,
		LatencyBudgetNs: latencyNs,
		ReachMm:      reachMm,
		Mode:         mode,
		QoS: QoSConfig{
			PFC:      pfc,
			Priority: priority,
		},
		AttestationRequired: attestation,
		AttestationTicket:  attTicket,
	}

	resp, err := allocateCorridor(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error allocating corridor lanes: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Photonic lanes allocated successfully!\n")
	fmt.Printf("ID: %s\n", resp.ID)
	fmt.Printf("Type: %s\n", resp.CorridorType)
	fmt.Printf("Lanes: %d\n", resp.Lanes)
	fmt.Printf("Wavelengths: %v nm (starting from %d nm)\n", resp.LambdaNm, lambdaStart)
	fmt.Printf("Achievable Bandwidth: %d Gbps\n", resp.AchievableGbps)
	fmt.Printf("BER: %.2e\n", resp.BER)
	fmt.Printf("Eye Margin: %s\n", resp.EyeMargin)
	fmt.Printf("Status: %s\n", resp.Status)
}

func runList(cmd *cobra.Command, args []string) {
	corridors, err := listCorridors()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error listing corridors: %v\n", err)
		os.Exit(1)
	}

	if len(corridors) == 0 {
		fmt.Println("No corridors found")
		return
	}

	fmt.Printf("%-12s %-12s %-6s %-15s %-8s %-10s %-8s\n", 
		"ID", "Type", "Lanes", "Wavelengths", "Gbps", "Status", "Created")
	fmt.Println(strings.Repeat("-", 80))

	for _, corridor := range corridors {
		lambdaStr := fmt.Sprintf("%d-%d", corridor.LambdaNm[0], corridor.LambdaNm[len(corridor.LambdaNm)-1])
		fmt.Printf("%-12s %-12s %-6d %-15s %-8d %-10s %-8s\n",
			corridor.ID,
			corridor.CorridorType,
			corridor.Lanes,
			lambdaStr,
			corridor.AchievableGbps,
			corridor.Status,
			corridor.CreatedAt.Format("15:04:05"))
	}
}

func runGet(cmd *cobra.Command, args []string) {
	corridorID := args[0]
	corridor, err := getCorridor(corridorID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting corridor: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Corridor Details:\n")
	fmt.Printf("  ID: %s\n", corridor.ID)
	fmt.Printf("  Type: %s\n", corridor.CorridorType)
	fmt.Printf("  Lanes: %d\n", corridor.Lanes)
	fmt.Printf("  Wavelengths: %v nm\n", corridor.LambdaNm)
	fmt.Printf("  Min Bandwidth: %d Gbps\n", corridor.MinGbps)
	fmt.Printf("  Achievable Bandwidth: %d Gbps\n", corridor.AchievableGbps)
	fmt.Printf("  Latency Budget: %d ns\n", corridor.LatencyBudgetNs)
	fmt.Printf("  Reach: %d mm\n", corridor.ReachMm)
	fmt.Printf("  Mode: %s\n", corridor.Mode)
	fmt.Printf("  QoS Priority: %s\n", corridor.QoS.Priority)
	fmt.Printf("  PFC: %t\n", corridor.QoS.PFC)
	fmt.Printf("  Attestation Required: %t\n", corridor.AttestationRequired)
	fmt.Printf("  BER: %.2e\n", corridor.BER)
	fmt.Printf("  Eye Margin: %s\n", corridor.EyeMargin)
	fmt.Printf("  Status: %s\n", corridor.Status)
	fmt.Printf("  Created: %s\n", corridor.CreatedAt.Format("2006-01-02 15:04:05"))
}

func runTelemetry(cmd *cobra.Command, args []string) {
	corridorID := args[0]
	telemetry, err := getTelemetry(corridorID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting telemetry: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Telemetry for %s:\n", corridorID)
	fmt.Printf("  BER: %.2e\n", telemetry.BER)
	fmt.Printf("  Temperature: %.1f°C\n", telemetry.TempC)
	fmt.Printf("  Power: %.2f pJ/bit\n", telemetry.PowerPjPerBit)
	fmt.Printf("  Drift: %s\n", telemetry.Drift)
	fmt.Printf("  Utilization: %.1f%%\n", telemetry.UtilizationPercent)
	fmt.Printf("  Error Count: %d\n", telemetry.ErrorCount)
}

func runCalibrate(cmd *cobra.Command, args []string) {
	corridorID := args[0]
	targetBER, _ := cmd.Flags().GetFloat64("target-ber")
	ambient, _ := cmd.Flags().GetString("ambient")

	req := RecalibrateRequest{
		TargetBER:      targetBER,
		AmbientProfile: ambient,
	}

	resp, err := calibrateCorridor(corridorID, req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error calibrating corridor: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Calibration completed for %s:\n", corridorID)
	fmt.Printf("  Status: %s\n", resp.Status)
	fmt.Printf("  Converged: %t\n", resp.Converged)
	fmt.Printf("  Convergence Time: %d ms\n", resp.ConvergenceTimeMs)
	fmt.Printf("  Final BER: %.2e\n", resp.FinalBER)
	fmt.Printf("  Final Eye Margin: %.2f UI\n", resp.FinalEyeMargin)
	fmt.Printf("  Power Savings: %.1f%%\n", resp.PowerSavings)
	fmt.Printf("  Bias Voltages: %v mV\n", resp.BiasVoltages)
	fmt.Printf("  Lambda Shifts: %v nm\n", resp.LambdaShifts)
}

func runWatch(cmd *cobra.Command, args []string) {
	corridorID := args[0]
	
	fmt.Printf("Watching telemetry for corridor %s (Ctrl+C to stop)...\n", corridorID)
	
	for {
		telemetry, err := getTelemetry(corridorID)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error getting telemetry: %v\n", err)
			time.Sleep(5 * time.Second)
			continue
		}

		fmt.Printf("\r[%s] BER: %.2e | Temp: %.1f°C | Power: %.2f pJ/bit | Util: %.1f%% | Errors: %d",
			time.Now().Format("15:04:05"),
			telemetry.BER,
			telemetry.TempC,
			telemetry.PowerPjPerBit,
			telemetry.UtilizationPercent,
			telemetry.ErrorCount)

		time.Sleep(2 * time.Second)
	}
}

// HTTP client functions
func allocateCorridor(req CorridorRequest) (*CorridorResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(corrdURL+"/v1/corridors", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var corridor CorridorResponse
	err = json.Unmarshal(body, &corridor)
	return &corridor, err
}

func listCorridors() ([]CorridorResponse, error) {
	resp, err := http.Get(corrdURL + "/v1/corridors")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var corridors []CorridorResponse
	err = json.Unmarshal(body, &corridors)
	return corridors, err
}

func getCorridor(id string) (*CorridorResponse, error) {
	resp, err := http.Get(corrdURL + "/v1/corridors/" + id)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var corridor CorridorResponse
	err = json.Unmarshal(body, &corridor)
	return &corridor, err
}

func getTelemetry(id string) (*TelemetryData, error) {
	resp, err := http.Get(corrdURL + "/v1/corridors/" + id + "/telemetry")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var telemetry TelemetryData
	err = json.Unmarshal(body, &telemetry)
	return &telemetry, err
}

func calibrateCorridor(id string, req RecalibrateRequest) (*RecalibrateResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(corrdURL+"/v1/corridors/"+id+"/recalibrate", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	var recalResp RecalibrateResponse
	err = json.Unmarshal(body, &recalResp)
	return &recalResp, err
}

// Helper functions
func parseLambdaRange(lambdaStr string) []int {
	parts := strings.Split(lambdaStr, "-")
	if len(parts) != 2 {
		return []int{1550, 1551, 1552, 1553, 1554, 1555, 1556, 1557} // default
	}

	start, err1 := strconv.Atoi(parts[0])
	end, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil {
		return []int{1550, 1551, 1552, 1553, 1554, 1555, 1556, 1557} // default
	}

	var lambdas []int
	for i := start; i <= end; i++ {
		lambdas = append(lambdas, i)
	}
	return lambdas
}
