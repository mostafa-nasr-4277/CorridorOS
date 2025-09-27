package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// MetricsService manages telemetry and metrics collection
type MetricsService struct {
	// Prometheus metrics
	corridorAllocations prometheus.Gauge
	corridorBandwidth   prometheus.Gauge
	corridorLatency     prometheus.Histogram
	ffmAllocations      prometheus.Gauge
	ffmBandwidth        prometheus.Gauge
	ffmLatency          prometheus.Histogram
	translationCount    prometheus.Counter
	attestationCount    prometheus.Counter
	errorCount          prometheus.Counter

	// Custom metrics storage
	metrics     map[string]interface{}
	metricsMutex sync.RWMutex
}

// MetricData represents a custom metric
type MetricData struct {
	Name      string                 `json:"name"`
	Value     float64                `json:"value"`
	Labels    map[string]string      `json:"labels"`
	Timestamp time.Time              `json:"timestamp"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// MetricsQuery represents a metrics query
type MetricsQuery struct {
	MetricName string            `json:"metric_name"`
	Labels     map[string]string `json:"labels,omitempty"`
	StartTime  time.Time         `json:"start_time,omitempty"`
	EndTime    time.Time         `json:"end_time,omitempty"`
	Aggregation string           `json:"aggregation,omitempty"` // sum, avg, min, max, count
}

// MetricsResponse represents a metrics response
type MetricsResponse struct {
	MetricName string      `json:"metric_name"`
	Data       []MetricData `json:"data"`
	Summary    interface{} `json:"summary,omitempty"`
}

// NewMetricsService creates a new metrics service
func NewMetricsService() *MetricsService {
	service := &MetricsService{
		metrics: make(map[string]interface{}),
	}

	// Initialize Prometheus metrics
	service.corridorAllocations = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "corridoros_corridor_allocations_total",
		Help: "Total number of active corridor allocations",
	})

	service.corridorBandwidth = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "corridoros_corridor_bandwidth_gbps",
		Help: "Total corridor bandwidth in Gbps",
	})

	service.corridorLatency = prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    "corridoros_corridor_latency_seconds",
		Help:    "Corridor latency distribution",
		Buckets: prometheus.ExponentialBuckets(0.000001, 2, 20), // 1μs to 1s
	})

	service.ffmAllocations = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "corridoros_ffm_allocations_total",
		Help: "Total number of active FFM allocations",
	})

	service.ffmBandwidth = prometheus.NewGauge(prometheus.GaugeOpts{
		Name: "corridoros_ffm_bandwidth_gbps",
		Help: "Total FFM bandwidth in Gbps",
	})

	service.ffmLatency = prometheus.NewHistogram(prometheus.HistogramOpts{
		Name:    "corridoros_ffm_latency_seconds",
		Help:    "FFM latency distribution",
		Buckets: prometheus.ExponentialBuckets(0.0000001, 2, 20), // 100ns to 100ms
	})

	service.translationCount = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "corridoros_translations_total",
		Help: "Total number of binary translations",
	})

	service.attestationCount = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "corridoros_attestations_total",
		Help: "Total number of device attestations",
	})

	service.errorCount = prometheus.NewCounter(prometheus.CounterOpts{
		Name: "corridoros_errors_total",
		Help: "Total number of errors",
	})

	// Register metrics
	prometheus.MustRegister(service.corridorAllocations)
	prometheus.MustRegister(service.corridorBandwidth)
	prometheus.MustRegister(service.corridorLatency)
	prometheus.MustRegister(service.ffmAllocations)
	prometheus.MustRegister(service.ffmBandwidth)
	prometheus.MustRegister(service.ffmLatency)
	prometheus.MustRegister(service.translationCount)
	prometheus.MustRegister(service.attestationCount)
	prometheus.MustRegister(service.errorCount)

	return service
}

// RecordMetric records a custom metric
func (s *MetricsService) RecordMetric(metric MetricData) {
	s.metricsMutex.Lock()
	defer s.metricsMutex.Unlock()

	key := fmt.Sprintf("%s_%s", metric.Name, metric.Timestamp.Format("2006-01-02T15:04:05"))
	s.metrics[key] = metric
}

// QueryMetrics queries metrics based on criteria
func (s *MetricsService) QueryMetrics(query MetricsQuery) (*MetricsResponse, error) {
	s.metricsMutex.RLock()
	defer s.metricsMutex.RUnlock()

	var matchingMetrics []MetricData

	for _, value := range s.metrics {
		if metric, ok := value.(MetricData); ok {
			// Check metric name
			if query.MetricName != "" && metric.Name != query.MetricName {
				continue
			}

			// Check time range
			if !query.StartTime.IsZero() && metric.Timestamp.Before(query.StartTime) {
				continue
			}
			if !query.EndTime.IsZero() && metric.Timestamp.After(query.EndTime) {
				continue
			}

			// Check labels
			matches := true
			for key, value := range query.Labels {
				if metric.Labels[key] != value {
					matches = false
					break
				}
			}

			if matches {
				matchingMetrics = append(matchingMetrics, metric)
			}
		}
	}

	// Apply aggregation if specified
	var summary interface{}
	if query.Aggregation != "" {
		summary = s.aggregateMetrics(matchingMetrics, query.Aggregation)
	}

	return &MetricsResponse{
		MetricName: query.MetricName,
		Data:       matchingMetrics,
		Summary:    summary,
	}, nil
}

// aggregateMetrics applies aggregation to metrics
func (s *MetricsService) aggregateMetrics(metrics []MetricData, aggregation string) interface{} {
	if len(metrics) == 0 {
		return nil
	}

	switch aggregation {
	case "sum":
		sum := 0.0
		for _, metric := range metrics {
			sum += metric.Value
		}
		return sum

	case "avg":
		sum := 0.0
		for _, metric := range metrics {
			sum += metric.Value
		}
		return sum / float64(len(metrics))

	case "min":
		min := metrics[0].Value
		for _, metric := range metrics {
			if metric.Value < min {
				min = metric.Value
			}
		}
		return min

	case "max":
		max := metrics[0].Value
		for _, metric := range metrics {
			if metric.Value > max {
				max = metric.Value
			}
		}
		return max

	case "count":
		return len(metrics)

	default:
		return nil
	}
}

// GetSystemMetrics returns system-wide metrics
func (s *MetricsService) GetSystemMetrics() map[string]interface{} {
	s.metricsMutex.RLock()
	defer s.metricsMutex.RUnlock()

	return map[string]interface{}{
		"corridor_allocations": s.corridorAllocations,
		"corridor_bandwidth":   s.corridorBandwidth,
		"ffm_allocations":      s.ffmAllocations,
		"ffm_bandwidth":        s.ffmBandwidth,
		"translation_count":    s.translationCount,
		"attestation_count":    s.attestationCount,
		"error_count":          s.errorCount,
		"custom_metrics_count": len(s.metrics),
	}
}

// UpdateCorridorMetrics updates corridor-related metrics
func (s *MetricsService) UpdateCorridorMetrics(allocations int, bandwidth float64, latency float64) {
	s.corridorAllocations.Set(float64(allocations))
	s.corridorBandwidth.Set(bandwidth)
	s.corridorLatency.Observe(latency)
}

// UpdateFFMMetrics updates FFM-related metrics
func (s *MetricsService) UpdateFFMMetrics(allocations int, bandwidth float64, latency float64) {
	s.ffmAllocations.Set(float64(allocations))
	s.ffmBandwidth.Set(bandwidth)
	s.ffmLatency.Observe(latency)
}

// IncrementTranslationCount increments translation counter
func (s *MetricsService) IncrementTranslationCount() {
	s.translationCount.Inc()
}

// IncrementAttestationCount increments attestation counter
func (s *MetricsService) IncrementAttestationCount() {
	s.attestationCount.Inc()
}

// IncrementErrorCount increments error counter
func (s *MetricsService) IncrementErrorCount() {
	s.errorCount.Inc()
}

// HTTP handlers
func (s *MetricsService) handleRecordMetric(w http.ResponseWriter, r *http.Request) {
	var metric MetricData
	if err := json.NewDecoder(r.Body).Decode(&metric); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	metric.Timestamp = time.Now()
	s.RecordMetric(metric)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(metric)
}

func (s *MetricsService) handleQueryMetrics(w http.ResponseWriter, r *http.Request) {
	var query MetricsQuery
	if err := json.NewDecoder(r.Body).Decode(&query); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	response, err := s.QueryMetrics(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (s *MetricsService) handleGetSystemMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := s.GetSystemMetrics()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func (s *MetricsService) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	// Create metrics service
	service := NewMetricsService()

	// Set up HTTP router
	router := mux.NewRouter()
	api := router.PathPrefix("/v1/metrics").Subrouter()

	// Metrics endpoints
	api.HandleFunc("/record", service.handleRecordMetric).Methods("POST")
	api.HandleFunc("/query", service.handleQueryMetrics).Methods("POST")
	api.HandleFunc("/system", service.handleGetSystemMetrics).Methods("GET")

	// Prometheus metrics endpoint
	router.Handle("/metrics", promhttp.Handler())

	// Health check
	router.HandleFunc("/health", service.handleHealth).Methods("GET")

	// Start server
	log.Println("Starting Metrics service on :8088")
	log.Fatal(http.ListenAndServe(":8088", router))
}
