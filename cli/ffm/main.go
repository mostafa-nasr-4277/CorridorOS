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

// BandwidthAdjustRequest represents a bandwidth adjustment request
type BandwidthAdjustRequest struct {
	FloorGBs uint64 `json:"floor_GBs"`
}

// LatencyClassAdjustRequest represents a latency class adjustment request
type LatencyClassAdjustRequest struct {
	Target string `json:"target"`
}

var (
    memqosdURL = "http://localhost:8081"
    verbose    bool
    ffmAttReq  bool
    ffmAttTicket string
)

func main() {
	var rootCmd = &cobra.Command{
		Use:   "ffm",
		Short: "CorridorOS Free-Form Memory Management CLI",
		Long:  "Manage Free-Form Memory allocations with QoS guarantees",
	}

	// Global flags
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")
    rootCmd.PersistentFlags().StringVar(&memqosdURL, "url", "http://localhost:8081", "CorridorOS memqosd service URL")
    rootCmd.PersistentFlags().BoolVar(&ffmAttReq, "attestation", false, "Require attestation for allocation")
    rootCmd.PersistentFlags().StringVar(&ffmAttTicket, "attestation-ticket", "", "Attestation ticket ID (used when --attestation is true)")

	// Add subcommands
	rootCmd.AddCommand(allocCmd)
	rootCmd.AddCommand(ffmAllocCmd)
	rootCmd.AddCommand(listCmd)
	rootCmd.AddCommand(getCmd)
	rootCmd.AddCommand(telemetryCmd)
	rootCmd.AddCommand(bandwidthCmd)
	rootCmd.AddCommand(migrateCmd)
	rootCmd.AddCommand(statCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

var allocCmd = &cobra.Command{
	Use:   "alloc <size>",
	Short: "Allocate FFM memory",
	Long:  "Allocate Free-Form Memory with specified properties",
	Args:  cobra.ExactArgs(1),
	Run:   runAlloc,
}

var ffmAllocCmd = &cobra.Command{
	Use:   "ffm-alloc",
	Short: "Allocate FFM memory with specific parameters",
	Long:  "Allocate Free-Form Memory using specific byte count and tier specification",
	Run:   runFFMAlloc,
}

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List all FFM allocations",
	Long:  "List all active FFM allocations",
	Run:   runList,
}

var getCmd = &cobra.Command{
	Use:   "get <allocation_id>",
	Short: "Get allocation details",
	Long:  "Get detailed information about a specific allocation",
	Args:  cobra.ExactArgs(1),
	Run:   runGet,
}

var telemetryCmd = &cobra.Command{
	Use:   "telemetry <allocation_id>",
	Short: "Get allocation telemetry",
	Long:  "Get real-time telemetry data for an allocation",
	Args:  cobra.ExactArgs(1),
	Run:   runTelemetry,
}

var bandwidthCmd = &cobra.Command{
	Use:   "bandwidth <allocation_id> <gbps>",
	Short: "Adjust bandwidth floor",
	Long:  "Adjust the bandwidth floor for an allocation",
	Args:  cobra.ExactArgs(2),
	Run:   runBandwidth,
}

var migrateCmd = &cobra.Command{
	Use:   "migrate <allocation_id> <tier>",
	Short: "Migrate allocation to different tier",
	Long:  "Migrate allocation to different latency tier (T0, T1, T2, T3)",
	Args:  cobra.ExactArgs(2),
	Run:   runMigrate,
}

var statCmd = &cobra.Command{
	Use:   "stat <allocation_id>",
	Short: "Show allocation statistics",
	Long:  "Show detailed statistics for an allocation",
	Args:  cobra.ExactArgs(1),
	Run:   runStat,
}

func init() {
	// Allocation command flags
	allocCmd.Flags().String("tier", "T2", "Latency tier (T0=HBM, T1=DRAM, T2=CXL, T3=persistent)")
	allocCmd.Flags().Uint64("bw-floor", 150, "Bandwidth floor in Gbps")
	allocCmd.Flags().String("persistence", "none", "Persistence level (none, write-back, write-through)")
	allocCmd.Flags().Bool("shareable", true, "Allow sharing between processes")
	allocCmd.Flags().String("domain", "default", "Security domain")

	// FFM allocation command flags
	ffmAllocCmd.Flags().Uint64("bytes", 274877906944, "Bytes to allocate (default: 256GB)")
	ffmAllocCmd.Flags().String("tier", "T2", "Latency tier (T0=HBM, T1=DRAM, T2=CXL, T3=persistent)")
	ffmAllocCmd.Flags().Uint64("bw-floor", 150, "Bandwidth floor in Gbps")
	ffmAllocCmd.Flags().String("persistence", "none", "Persistence level (none, write-back, write-through)")
	ffmAllocCmd.Flags().Bool("shareable", true, "Allow sharing between processes")
	ffmAllocCmd.Flags().String("domain", "default", "Security domain")
}

func runAlloc(cmd *cobra.Command, args []string) {
	sizeStr := args[0]
	tier, _ := cmd.Flags().GetString("tier")
	bwFloor, _ := cmd.Flags().GetUint64("bw-floor")
	persistence, _ := cmd.Flags().GetString("persistence")
	shareable, _ := cmd.Flags().GetBool("shareable")
	domain, _ := cmd.Flags().GetString("domain")

	// Parse size
	bytes, err := parseSize(sizeStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing size: %v\n", err)
		os.Exit(1)
	}

    req := AllocationRequest{
        Bytes:          bytes,
        LatencyClass:   tier,
        BandwidthFloor: bwFloor,
        Persistence:    persistence,
        Shareable:      shareable,
        SecurityDomain: domain,
        AttestationRequired: ffmAttReq,
        AttestationTicket:   ffmAttTicket,
    }

	handle, err := allocateFFM(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error allocating FFM: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("FFM allocated successfully!\n")
	fmt.Printf("ID: %s\n", handle.ID)
	fmt.Printf("Size: %s\n", formatBytes(handle.Bytes))
	fmt.Printf("Tier: %s\n", handle.LatencyClass)
	fmt.Printf("Bandwidth Floor: %d Gbps\n", handle.BandwidthFloor)
	fmt.Printf("Persistence: %s\n", handle.Persistence)
	fmt.Printf("Shareable: %t\n", handle.Shareable)
	fmt.Printf("Security Domain: %s\n", handle.SecurityDomain)
	fmt.Printf("File Descriptors: %v\n", handle.FileDescriptors)
	fmt.Printf("Policy Lease TTL: %d seconds\n", handle.PolicyLeaseTTL)
}

func runFFMAlloc(cmd *cobra.Command, args []string) {
	bytes, _ := cmd.Flags().GetUint64("bytes")
	tier, _ := cmd.Flags().GetString("tier")
	bwFloor, _ := cmd.Flags().GetUint64("bw-floor")
	persistence, _ := cmd.Flags().GetString("persistence")
	shareable, _ := cmd.Flags().GetBool("shareable")
	domain, _ := cmd.Flags().GetString("domain")

	req := AllocationRequest{
		Bytes:          bytes,
		LatencyClass:   tier,
		BandwidthFloor: bwFloor,
		Persistence:    persistence,
		Shareable:      shareable,
		SecurityDomain: domain,
		AttestationRequired: ffmAttReq,
		AttestationTicket:   ffmAttTicket,
	}

	handle, err := allocateFFM(req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error allocating FFM: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Free-Form Memory allocated successfully!\n")
	fmt.Printf("ID: %s\n", handle.ID)
	fmt.Printf("Size: %s (%d bytes)\n", formatBytes(handle.Bytes), handle.Bytes)
	fmt.Printf("Tier: %s\n", handle.LatencyClass)
	fmt.Printf("Bandwidth Floor: %d Gbps\n", handle.BandwidthFloor)
	fmt.Printf("Persistence: %s\n", handle.Persistence)
	fmt.Printf("Shareable: %t\n", handle.Shareable)
	fmt.Printf("Security Domain: %s\n", handle.SecurityDomain)
	fmt.Printf("File Descriptors: %v\n", handle.FileDescriptors)
	fmt.Printf("Policy Lease TTL: %d seconds\n", handle.PolicyLeaseTTL)
}

func runList(cmd *cobra.Command, args []string) {
	allocations, err := listFFM()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error listing allocations: %v\n", err)
		os.Exit(1)
	}

	if len(allocations) == 0 {
		fmt.Println("No FFM allocations found")
		return
	}

	fmt.Printf("%-12s %-8s %-12s %-8s %-8s %-12s %-8s\n", 
		"ID", "Tier", "Size", "Bw Floor", "Achieved", "Domain", "Created")
	fmt.Println(strings.Repeat("-", 80))

	for _, alloc := range allocations {
		fmt.Printf("%-12s %-8s %-12s %-8d %-8d %-12s %-8s\n",
			alloc.ID,
			alloc.LatencyClass,
			formatBytes(alloc.Bytes),
			alloc.BandwidthFloor,
			alloc.AchievedBandwidth,
			alloc.SecurityDomain,
			alloc.CreatedAt.Format("15:04:05"))
	}
}

func runGet(cmd *cobra.Command, args []string) {
	allocationID := args[0]
	alloc, err := getFFM(allocationID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting allocation: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("FFM Allocation Details:\n")
	fmt.Printf("  ID: %s\n", alloc.ID)
	fmt.Printf("  Size: %s\n", formatBytes(alloc.Bytes))
	fmt.Printf("  Tier: %s\n", alloc.LatencyClass)
	fmt.Printf("  Bandwidth Floor: %d Gbps\n", alloc.BandwidthFloor)
	fmt.Printf("  Achieved Bandwidth: %d Gbps\n", alloc.AchievedBandwidth)
	fmt.Printf("  Persistence: %s\n", alloc.Persistence)
	fmt.Printf("  Shareable: %t\n", alloc.Shareable)
	fmt.Printf("  Security Domain: %s\n", alloc.SecurityDomain)
	fmt.Printf("  File Descriptors: %v\n", alloc.FileDescriptors)
	fmt.Printf("  Policy Lease TTL: %d seconds\n", alloc.PolicyLeaseTTL)
	fmt.Printf("  Moved Pages: %d\n", alloc.MovedPages)
	fmt.Printf("  Tail P99: %.2f ms\n", alloc.TailP99Ms)
	fmt.Printf("  Created: %s\n", alloc.CreatedAt.Format("2006-01-02 15:04:05"))
}

func runTelemetry(cmd *cobra.Command, args []string) {
	allocationID := args[0]
	telemetry, err := getTelemetry(allocationID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting telemetry: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Telemetry for %s:\n", allocationID)
	fmt.Printf("  Achieved Bandwidth: %d Gbps\n", telemetry.AchievedGBs)
	fmt.Printf("  Moved Pages: %d\n", telemetry.MovedPages)
	fmt.Printf("  Tail P99: %.2f ms\n", telemetry.TailP99Ms)
	fmt.Printf("  Temperature: %.1f°C\n", telemetry.Temperature)
	fmt.Printf("  Power: %.1f W\n", telemetry.PowerW)
	fmt.Printf("  Utilization: %.1f%%\n", telemetry.Utilization)
}

func runBandwidth(cmd *cobra.Command, args []string) {
	allocationID := args[0]
	gbpsStr := args[1]

	gbps, err := strconv.ParseUint(gbpsStr, 10, 64)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing bandwidth: %v\n", err)
		os.Exit(1)
	}

	req := BandwidthAdjustRequest{
		FloorGBs: gbps,
	}

	err = adjustBandwidth(allocationID, req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error adjusting bandwidth: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Bandwidth floor adjusted to %d Gbps for allocation %s\n", gbps, allocationID)
}

func runMigrate(cmd *cobra.Command, args []string) {
	allocationID := args[0]
	tier := args[1]

	// Validate tier
	validTiers := []string{"T0", "T1", "T2", "T3"}
	valid := false
	for _, t := range validTiers {
		if tier == t {
			valid = true
			break
		}
	}
	if !valid {
		fmt.Fprintf(os.Stderr, "Invalid tier: %s. Valid tiers: %v\n", tier, validTiers)
		os.Exit(1)
	}

	req := LatencyClassAdjustRequest{
		Target: tier,
	}

	err := migrateTier(allocationID, req)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error migrating tier: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Allocation %s migrated to tier %s\n", allocationID, tier)
}

func runStat(cmd *cobra.Command, args []string) {
	allocationID := args[0]
	
	// Get allocation details
	alloc, err := getFFM(allocationID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting allocation: %v\n", err)
		os.Exit(1)
	}

	// Get telemetry
	telemetry, err := getTelemetry(allocationID)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error getting telemetry: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("FFM Statistics for %s:\n", allocationID)
	fmt.Printf("  Size: %s\n", formatBytes(alloc.Bytes))
	fmt.Printf("  Tier: %s\n", alloc.LatencyClass)
	fmt.Printf("  Bandwidth Floor: %d Gbps\n", alloc.BandwidthFloor)
	fmt.Printf("  Achieved Bandwidth: %d Gbps (%.1f%% of floor)\n", 
		telemetry.AchievedGBs, float64(telemetry.AchievedGBs)/float64(alloc.BandwidthFloor)*100)
	fmt.Printf("  Moved Pages: %d\n", telemetry.MovedPages)
	fmt.Printf("  Tail P99: %.2f ms\n", telemetry.TailP99Ms)
	fmt.Printf("  Temperature: %.1f°C\n", telemetry.Temperature)
	fmt.Printf("  Power: %.1f W\n", telemetry.PowerW)
	fmt.Printf("  Utilization: %.1f%%\n", telemetry.Utilization)
	fmt.Printf("  Created: %s\n", alloc.CreatedAt.Format("2006-01-02 15:04:05"))
	fmt.Printf("  Age: %s\n", time.Since(alloc.CreatedAt).Round(time.Second))
}

// HTTP client functions
func allocateFFM(req AllocationRequest) (*FFMHandle, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := http.Post(memqosdURL+"/v1/ffm/alloc", "application/json", bytes.NewBuffer(jsonData))
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

	var handle FFMHandle
	err = json.Unmarshal(body, &handle)
	return &handle, err
}

func listFFM() ([]FFMHandle, error) {
	resp, err := http.Get(memqosdURL + "/v1/ffm/")
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

	var allocations []FFMHandle
	err = json.Unmarshal(body, &allocations)
	return allocations, err
}

func getFFM(id string) (*FFMHandle, error) {
	resp, err := http.Get(memqosdURL + "/v1/ffm/" + id)
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

	var handle FFMHandle
	err = json.Unmarshal(body, &handle)
	return &handle, err
}

func getTelemetry(id string) (*TelemetryResponse, error) {
	resp, err := http.Get(memqosdURL + "/v1/ffm/" + id + "/telemetry")
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

	var telemetry TelemetryResponse
	err = json.Unmarshal(body, &telemetry)
	return &telemetry, err
}

func adjustBandwidth(id string, req BandwidthAdjustRequest) error {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequest("PATCH", memqosdURL+"/v1/ffm/"+id+"/bandwidth", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func migrateTier(id string, req LatencyClassAdjustRequest) error {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequest("PATCH", memqosdURL+"/v1/ffm/"+id+"/latency_class", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// Helper functions
func parseSize(sizeStr string) (uint64, error) {
	sizeStr = strings.ToUpper(sizeStr)
	
	var multiplier uint64 = 1
	var numStr string
	
	if strings.HasSuffix(sizeStr, "B") {
		numStr = sizeStr[:len(sizeStr)-1]
	} else if strings.HasSuffix(sizeStr, "K") || strings.HasSuffix(sizeStr, "KB") {
		multiplier = 1024
		if strings.HasSuffix(sizeStr, "KB") {
			numStr = sizeStr[:len(sizeStr)-2]
		} else {
			numStr = sizeStr[:len(sizeStr)-1]
		}
	} else if strings.HasSuffix(sizeStr, "M") || strings.HasSuffix(sizeStr, "MB") {
		multiplier = 1024 * 1024
		if strings.HasSuffix(sizeStr, "MB") {
			numStr = sizeStr[:len(sizeStr)-2]
		} else {
			numStr = sizeStr[:len(sizeStr)-1]
		}
	} else if strings.HasSuffix(sizeStr, "G") || strings.HasSuffix(sizeStr, "GB") {
		multiplier = 1024 * 1024 * 1024
		if strings.HasSuffix(sizeStr, "GB") {
			numStr = sizeStr[:len(sizeStr)-2]
		} else {
			numStr = sizeStr[:len(sizeStr)-1]
		}
	} else if strings.HasSuffix(sizeStr, "T") || strings.HasSuffix(sizeStr, "TB") {
		multiplier = 1024 * 1024 * 1024 * 1024
		if strings.HasSuffix(sizeStr, "TB") {
			numStr = sizeStr[:len(sizeStr)-2]
		} else {
			numStr = sizeStr[:len(sizeStr)-1]
		}
	} else {
		numStr = sizeStr
	}
	
	num, err := strconv.ParseUint(numStr, 10, 64)
	if err != nil {
		return 0, err
	}
	
	return num * multiplier, nil
}

func formatBytes(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
