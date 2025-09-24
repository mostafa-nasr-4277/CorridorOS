# RFC-0001: CorridorOS v4.0 Architecture and API Specification

**Status:** Draft  
**Authors:** CorridorOS Team  
**Date:** 2024-01-15  
**Version:** 4.0.0  

## Abstract

CorridorOS is a production-grade operating system that treats photonic interconnects and pooled memory as first-class resources. This RFC defines the architecture, APIs, and implementation details for CorridorOS v4.0, which provides photonic corridor management, free-form memory allocation with QoS guarantees, and comprehensive security features.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [API Specifications](#api-specifications)
5. [Security Model](#security-model)
6. [Implementation Details](#implementation-details)
7. [Deployment Guide](#deployment-guide)
8. [Future Roadmap](#future-roadmap)

## Introduction

### Background

Modern computing systems face increasing challenges in memory bandwidth, interconnect latency, and power efficiency. Traditional operating systems treat memory and interconnects as static resources, leading to suboptimal utilization and performance bottlenecks. CorridorOS addresses these challenges by:

- Treating photonic interconnects as first-class OS resources with QoS guarantees
- Providing free-form memory allocation with bandwidth floors and tier migration
- Implementing comprehensive security with measured boot and attestation
- Supporting both current hardware and future photonic technologies

### Goals

**Primary Goals:**
- Make photonic interconnect a first-class OS resource
- Deliver free-form memory (FFM) on CXL 3.x with property-based allocation
- Provide compatibility (RISC-V native + dynamic x86/x64 translation)
- Implement confidential compute and attestation

**Non-Goals (Gen-1):**
- No optical ALUs or photonic CPU claims
- No "3-4-qubit" speedups beyond QRNG
- No hazardous cooling requirements

## Architecture Overview

### System Architecture

```
Application Layer
┌────────────────────────────────────────────────────────────────┐
│  Applications / Services / ML Stacks / Databases / CorridorLabs │
│  (Physics Decoder, Synchrony Analytics, HELIOPASS UI)          │
└────────────────────────────────────────────────────────────────┘

CorridorOS User-Space Services (L2/L1/L0 Control Plane)
┌────────────────────────────────────────────────────────────────┐
│  corrd   : Photonic Corridors (SiCorridor & CarbonCorridor)    │
│  memqosd : Free-Form Memory (FFM) on CXL (tiers & QoS)         │
│  fabmand : Fabric Manager API (CXL 3.x, PBR/GIM, paths)         │
│  heliopassd : Optical calibration (bias/λ; drift/eye/BER)       │
│  attestd : Root of Trust, measured boot, SPDM attestation      │
│  compatd : Dynamic x86/x64 translation & profiles              │
│  metricsd : Telemetry export (Prometheus/OpenTelemetry)        │
└────────────────────────────────────────────────────────────────┘

Kernel & Drivers (Linux LTS)
┌────────────────────────────────────────────────────────────────┐
│  CXL core / cxl_mem / DAX / ndctl / daxctl                     │
│  PCIe 6/7; device QoS (QTG) where supported                    │
│  I2C/MDIO for photonic control (vendor libs)                    │
│  Security: IMA, LSMs, eBPF for audit                           │
└────────────────────────────────────────────────────────────────┘

Hardware (Gen-1 Realistic)
┌────────────────────────────────────────────────────────────────┐
│  CPU: RISC-V (RVV) or x86 host; HBM/DDR5 local                 │
│  CXL 3.x Type-3 DRAM pools (hot-plug)                          │
│  Optical I/O dev kits (Si/SiN; CPO/optical chiplets)           │
│  Optional graphene-on-Si/SiN test PICs (lab lane)              │
└────────────────────────────────────────────────────────────────┘
```

### Core Primitives

- **Corridor**: A reserved photonic path with type, wavelength plan, QoS, and reach
- **WavelengthSet**: Collection of lanes (λ₁…λₙ) with per-lane state
- **MemoryBundle**: FFM allocation handle with bytes, tier policy, bandwidth floor, persistence
- **Policy**: Constraints over time (e.g., min 150 GB/s 20:00–08:00)
- **AttestationTicket**: Device/firmware provenance bound to allocations/corridors

## Core Components

### 1. Photonic Corridor Management (corrd)

**Purpose:** Manage photonic interconnects as first-class OS resources

**Key Features:**
- Reserve and monitor optical lanes with QoS guarantees
- Support SiCorridor and CarbonCorridor types
- Real-time BER/eye margin monitoring
- HELIOPASS integration for calibration

**API Endpoints:**
- `POST /v1/corridors` - Allocate corridor
- `GET /v1/corridors/{id}` - Get corridor details
- `GET /v1/corridors/{id}/telemetry` - Get telemetry
- `POST /v1/corridors/{id}/recalibrate` - Recalibrate corridor

### 2. Free-Form Memory (memqosd)

**Purpose:** Property-based memory allocation with QoS enforcement

**Key Features:**
- Tier-based allocation (T0=HBM, T1=DRAM, T2=CXL, T3=persistent)
- Bandwidth floor guarantees
- Live migration between tiers
- CXL 3.x integration

**API Endpoints:**
- `POST /v1/ffm/alloc` - Allocate memory
- `GET /v1/ffm/{id}` - Get allocation details
- `GET /v1/ffm/{id}/telemetry` - Get telemetry
- `PATCH /v1/ffm/{id}/bandwidth` - Adjust bandwidth
- `PATCH /v1/ffm/{id}/latency_class` - Migrate tier

### 3. Fabric Manager (fabmand)

**Purpose:** CXL 3.x fabric management and path programming

**Key Features:**
- Device discovery and management
- Path programming (PBR/GIM)
- QoS configuration
- Device attestation

**API Endpoints:**
- `GET /v1/fabman/devices` - List devices
- `POST /v1/fabman/paths` - Create path
- `POST /v1/fabman/attest` - Attest device
- `GET /v1/fabman/attest/{ticket_id}` - Verify attestation

### 4. HELIOPASS Calibration (heliopassd)

**Purpose:** Optical lane calibration and optimization

**Key Features:**
- Bias voltage optimization
- Wavelength drift compensation
- Power efficiency optimization
- Ambient profile support

**API Endpoints:**
- `POST /v1/heliopass/calibrate` - Calibrate corridor
- `GET /v1/heliopass/profiles` - Get ambient profiles

### 5. Attestation Service (attestd)

**Purpose:** Security and measured boot

**Key Features:**
- Measured boot (TPM/DTM)
- SPDM device attestation
- PQC signature support
- Attestation ticket management

**API Endpoints:**
- `POST /v1/attest/device` - Attest device
- `GET /v1/attest/{attestation_id}` - Get attestation
- `GET /v1/attest/measured-boot/{device_id}` - Get measured boot data
- `POST /v1/attest/spdm` - SPDM attestation

## API Specifications

### Photonic Corridor API

#### Allocate Corridor

```http
POST /v1/corridors
Content-Type: application/json

{
  "corridor_type": "SiCorridor" | "CarbonCorridor",
  "lanes": 8,
  "lambda_nm": [1550, 1551, 1552, 1553, 1554, 1555, 1556, 1557],
  "min_gbps": 400,
  "latency_budget_ns": 250,
  "reach_mm": 75,
  "mode": "waveguide",
  "qos": {
    "pfc": true,
    "priority": "gold"
  },
  "attestation_required": true
}
```

**Response:**
```json
{
  "id": "cor-7af3",
  "corridor_type": "SiCorridor",
  "lanes": 8,
  "lambda_nm": [1550, 1551, 1552, 1553, 1554, 1555, 1556, 1557],
  "min_gbps": 400,
  "latency_budget_ns": 250,
  "reach_mm": 75,
  "mode": "waveguide",
  "qos": {
    "pfc": true,
    "priority": "gold"
  },
  "attestation_required": true,
  "achievable_gbps": 416,
  "ber": 1.0e-12,
  "eye_margin": "ok",
  "created_at": "2024-01-15T10:30:00Z",
  "status": "active"
}
```

#### Get Telemetry

```http
GET /v1/corridors/{id}/telemetry
```

**Response:**
```json
{
  "ber": 1.1e-12,
  "temp_c": 47.5,
  "power_pj_per_bit": 0.9,
  "drift": "low",
  "utilization_percent": 85.3,
  "error_count": 0
}
```

### Free-Form Memory API

#### Allocate Memory

```http
POST /v1/ffm/alloc
Content-Type: application/json

{
  "bytes": 274877906944,
  "latency_class": "T2",
  "bandwidth_floor_GBs": 150,
  "persistence": "none",
  "shareable": true,
  "security_domain": "tenantA"
}
```

**Response:**
```json
{
  "id": "ffm-9c2e",
  "bytes": 274877906944,
  "latency_class": "T2",
  "bandwidth_floor_GBs": 150,
  "persistence": "none",
  "shareable": true,
  "security_domain": "tenantA",
  "created_at": "2024-01-15T10:30:00Z",
  "policy_lease_ttl_s": 3600,
  "fds": ["/proc/12345/fd/37"],
  "achieved_GBs": 135,
  "moved_pages": 0,
  "tail_p99_ms": 2.1
}
```

#### Adjust Bandwidth

```http
PATCH /v1/ffm/{id}/bandwidth
Content-Type: application/json

{
  "floor_GBs": 180
}
```

### Fabric Manager API

#### List Devices

```http
GET /v1/fabman/devices
```

**Response:**
```json
[
  {
    "id": "cxl-dev-001",
    "type": "Type-3",
    "vendor_id": "0x8086",
    "device_id": "0x0b5a",
    "serial_number": "SN123456789",
    "firmware_version": "1.2.3",
    "capacity_bytes": 274877906944,
    "latency_ns": 100,
    "bandwidth_gbps": 64,
    "status": "active",
    "last_seen": "2024-01-15T10:30:00Z",
    "attestation_ticket": "attest-123456"
  }
]
```

#### Create Path

```http
POST /v1/fabman/paths
Content-Type: application/json

{
  "source_device": "cxl-dev-001",
  "target_device": "cxl-dev-002",
  "path_type": "PBR",
  "bandwidth_gbps": 64,
  "latency_ns": 200,
  "qos": {
    "priority": "gold",
    "min_bandwidth_gbps": 50,
    "max_latency_ns": 300,
    "pfc": true,
    "ecn": false
  }
}
```

## Security Model

### Measured Boot

- TPM/DTM integration for platform integrity
- PCR measurements for firmware and configuration
- Secure boot chain validation

### Device Attestation

- SPDM protocol for device attestation
- PQC signatures (Kyber/Dilithium)
- Attestation ticket binding

### Memory Protection

- Memory encryption at rest
- Confidential compute (TEE)
- Access control per security domain

### Network Security

- TLS 1.3 for all API communications
- mTLS for inter-service communication
- Certificate pinning for device attestation

## Implementation Details

### Technology Stack

**Languages:**
- Rust (corrd daemon)
- Go (memqosd, fabmand, heliopassd, attestd)
- C++ (kernel modules)

**Dependencies:**
- Linux LTS kernel (6.12+)
- CXL 3.x support
- Prometheus/OpenTelemetry
- gRPC/HTTP REST APIs

### Performance Characteristics

**Photonic Corridors:**
- Latency: <250ns (target)
- Bandwidth: 400+ Gbps per corridor
- BER: <1e-12
- Power: <1 pJ/bit

**Free-Form Memory:**
- T0 (HBM): <100ns latency, 500+ GB/s
- T1 (DRAM): <200ns latency, 200+ GB/s
- T2 (CXL): <500ns latency, 100+ GB/s
- T3 (Persistent): <1μs latency, 50+ GB/s

### Monitoring and Observability

- Prometheus metrics export
- Grafana dashboards
- OpenTelemetry tracing
- Structured logging (JSON)

## Deployment Guide

### Prerequisites

- Linux LTS with CXL 3.x support
- RISC-V or x86 host
- CXL Type-3 DRAM pools
- Optical I/O dev kits (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/corridoros/corridoros.git
cd corridoros

# Build all components
make build

# Install systemd services
sudo make install

# Start services
sudo systemctl start corrd memqosd fabmand heliopassd attestd
```

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f corrd
```

### Configuration

Configuration files are located in `/etc/corridoros/`:

- `corrd.conf` - Photonic corridor settings
- `memqosd.conf` - Memory QoS configuration
- `fabmand.conf` - Fabric manager settings
- `heliopassd.conf` - Calibration parameters
- `attestd.conf` - Security settings

## Future Roadmap

### Phase 1 (0-90 days)
- MVP-A: FFM QoS with bandwidth reservation
- MVP-B: SiCorridor control and monitoring
- MVP-C: CorridorLabs bundle with simulations
- Security baseline implementation

### Phase 2 (3-6 months)
- CarbonCorridor test PIC integration
- FFM predictive policies
- Persistent tier integration
- Advanced monitoring

### Phase 3 (6-12 months)
- Co-packaged optics pilots
- Operator UX improvements
- Early adopter deployments
- Performance optimizations

## Conclusion

CorridorOS v4.0 provides a solid foundation for photonic computing and advanced memory management. The architecture is designed to be both practical for current hardware and extensible for future technologies. The comprehensive API and security model enable real-world deployments while maintaining the flexibility to evolve with the technology.

## References

1. CXL 3.0 Specification
2. SPDM 1.2.0 Specification
3. TPM 2.0 Specification
4. IEEE 802.3 Ethernet Standards
5. ITU-T G.694.1 DWDM Grid
6. NIST Post-Quantum Cryptography Standards

---

**End of RFC-0001**
