# NetShield Dataset Column Mapping Documentation

## Overview
This document describes the column mapping strategy for UNSW-NB15 and CICIDS2017 datasets in NetShield's backend network monitoring service.

## Dataset Support

### UNSW-NB15 Dataset
- **Files**: `UNSW-NB15_1.csv`, `UNSW-NB15_2.csv`, `UNSW-NB15_3.csv`
- **Format**: 49 columns, no header row (header-less CSV)
- **Encoding**: UTF-8 with BOM marker
- **Records**: Approx. 2.5M flows across 3 files

#### Column Assignment (position → name)
```
0: srcip                   # Source IP Address
1: sport                   # Source Port
2: dstip                   # Destination IP Address
3: dsport                  # Destination Port
4: proto                   # Protocol (tcp, udp, icmp)
5: state                   # Connection State (CON, FIN, etc.)
6: dur                     # Flow Duration (seconds)
7: sbytes                  # Source to Destination Bytes
8: dbytes                  # Destination to Source Bytes
9-13: sttl, dttl, sloss, dloss, service
14-19: sload, dload, spkts, dpkts, swin, dwin
...
28: stime                  # Start Time (Unix Epoch)
29: ltime                  # Last Time (Unix Epoch)
...
46: attack_cat             # Attack Category (label)
47: label                  # Additional Label (often empty)
48: confidence             # Confidence Score
```

### CICIDS2017 Dataset
- **Files**: `Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv`, etc.
- **Format**: 79 columns with header row
- **Flow-Based Features**: Bidirectional packet/byte statistics
- **Records**: ~400K flows per day file

#### Limitations & Fallback Strategy
| Required Field | CICIDS2017 | Fallback Strategy |
|---|---|---|
| Source IP | ❌ Missing | Generated (192.168.x.x) |
| Source Port | ❌ Missing | Generated (ephemeral range) |
| Destination IP | ❌ Missing | Default (10.0.0.1) |
| Protocol | ✓ Partial | Inferred from dest port |
| Timestamp | ❌ Missing | Generated (sequence-based) |

## Common Schema Columns

All datasets map to a standardized schema with 15 fields:

### Directly Mapped Fields (13)
1. **timestamp** - Packet/Flow timestamp (Unix epoch or generated)
2. **source_ip** - Source IP address
3. **destination_ip** - Destination IP address
4. **source_port** - Source port number (integer)
5. **destination_port** - Destination port number (integer)
6. **protocol** - Protocol name (TCP, UDP, DNS, HTTP, HTTPS, SSH, FTP)
7. **packet_size** - Average packet size (bytes) - from mean calculations
8. **flow_duration** - Flow duration (seconds)
9. **total_packets** - Total packet count in flow
10. **total_bytes** - Total bytes in flow
11. **traffic_label** - Traffic classification label
12. **attack_category** - Attack type (if any)
13. **threat_level** - Computed threat severity (Low, Medium, High)

### Computed Fields (2)
14. **prediction** - Predicted traffic type
   - Values: `Normal`, `Attack`, `Anomaly`, `Unknown`
   - Derived from traffic_label and threat_level
   
15. **confidence** - Confidence score (0.0-1.0)
   - High threats: 0.95
   - Medium threats: 0.75
   - Low threats: 0.85
   - Unknown: 0.5

## Implementation Details

### UNSW-NB15 Processing
```python
# Read with assigned column names
df = pd.read_csv(file, header=None, names=UNSW_NB15_COLUMNS)

# Key mappings in _map_to_common_schema()
source_ip ← srcip
source_port ← sport
destination_ip ← dstip
destination_port ← dsport
protocol ← proto (standardized to uppercase)
flow_duration ← dur
total_packets ← spkts + dpkts
total_bytes ← sbytes (or sbytes + dbytes)
timestamp ← stime (Unix epoch)
traffic_label ← attack_cat (numeric: 0-10)
```

### CICIDS2017 Processing
```python
# Read with default pandas header parsing
df = pd.read_csv(file)

# Column lookups in _map_to_common_schema()
destination_port ← ' Destination Port'
flow_duration ← ' Flow Duration'
total_packets ← ' Total Fwd Packets' + ' Total Backward Packets'
total_bytes ← 'Total Length of Fwd Packets' + ' Total Length of Bwd Packets'
traffic_label ← ' Label'

# Fallback generation for missing fields
source_ip ← _generate_synthetic_ips_ports(index) → "192.168.x.x"
source_port ← _generate_synthetic_ips_ports(index) → ephemeral range
destination_ip ← "10.0.0.1" (default server)
protocol ← _infer_protocol_from_port(dest_port)
timestamp ← sequence_based (base_epoch + index + duration_offset)
```

### Synthetic IP Generation (CICIDS2017)
For deterministic reproducibility, synthetic IPs are generated from row index:
```
source_ip = f"192.168.{(index//256)%256}.{index%256}"
source_port = 49152 + (index % 16384)  # Ephemeral range
```

### Protocol Inference (Port-Based)
```
Port 53 → DNS
Port 80, 8080 → HTTP
Port 443 → HTTPS
Port 22 → SSH
Port 21 → FTP
Others → TCP (default)
```

### Threat Level Assignment
Based on traffic_label keyword matching:
- **High Risk**: 'ddos', 'dos', 'portscan', 'bot', 'exploit', 'worm', 'bruteforce', 'infiltration'
- **Medium Risk**: 'suspicious', 'unknown', 'anomaly'
- **Low Risk**: 'benign', 'normal', 'BENIGN'
- **Default**: Low

### Prediction Generation
- Normal: For labels '0', 'benign', 'normal'
- Attack: For labels '1', 'attack' or keyword-matched attacks
- Anomaly: For suspicious/unknown
- Unknown: For unrecognized labels

## Missing Column Handling

The mapping gracefully handles missing columns:
1. **Attempt exact match** - Compare against known column names
2. **Attempt normalized match** - Remove spaces/underscores/hyphens, compare case-insensitive
3. **Use fallback value** - Generate/default value if not found:
   - `source_ip`: Synthetic generation
   - `source_port`: Synthetic generation
   - `destination_ip`: Hardcoded default (10.0.0.1)
   - `protocol`: Port-based inference
   - `timestamp`: Sequence-based generation

## Data Quality Features

### Preprocessing Steps
1. Normalize whitespace (remove leading/trailing spaces)
2. Replace blank strings with NA
3. Remove completely empty rows
4. Remove duplicate rows
5. Convert numeric strings to proper numeric types (threshold: 80%)
6. Remove completely empty columns

### Validation
- All numeric fields converted with `errors='coerce'` for safe handling
- String fields trimmed and validated for empty content
- Protocol names standardized to uppercase
- Threat levels validated against known keywords

## Performance Considerations

### Row Sampling
- UNSW-NB15: Max 80,000 rows per file (default)
- CICIDS2017: Max 80,000 rows per file (default)
- Combined limit: 500,000 rows total

### Vectorized Operations
- All DataFrame operations use vectorized pandas methods
- No Python row loops for performance
- String operations use `.str` accessor
- Type conversions use numpy ufuncs

## Example Usage

```python
from app.services.network_monitoring import (
    _read_csv_file,
    _map_to_common_schema,
    process_dataset_frame
)

# Load dataset
unsw_file = Path('data/UNSW-NB15_1.csv')
df = _read_csv_file(unsw_file)

# Process and map
mapped = _map_to_common_schema(df)

# Access mapped fields
print(mapped[['source_ip', 'destination_ip', 'protocol', 'threat_level', 'prediction']])
```

## Testing

Run dataset mapping tests:
```bash
cd backend
python -c "
from app.services.network_monitoring import _read_csv_file, process_dataset_frame
from pathlib import Path

# Test UNSW-NB15
unsw = _read_csv_file(Path('app/data/UNSW-NB15_1.csv'), nrows=5)
mapped = process_dataset_frame(unsw)
print('UNSW-NB15 mapped columns:', mapped.columns.tolist())

# Test CICIDS2017
cicids = _read_csv_file(Path('app/data/Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'), nrows=5)
mapped = process_dataset_frame(cicids)
print('CICIDS2017 mapped columns:', mapped.columns.tolist())
"
```

## Future Enhancements

- [ ] Add timestamp parsing for human-readable formats
- [ ] Support additional dataset formats (KDD99, NSL-KDD, etc.)
- [ ] Implement ML-based attack category inference
- [ ] Add geographic IP enrichment for source/destination
- [ ] Cache dataset metadata for faster loading
