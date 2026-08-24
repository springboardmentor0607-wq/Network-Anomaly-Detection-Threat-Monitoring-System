import asyncio
import logging
from unittest.mock import AsyncMock, MagicMock

import pandas as pd

from app.api.network import get_network_analytics, get_network_traffic
from app.auth.handler import get_password_hash, verify_password
from app.services.network_monitoring import (
    combine_dataset_frames,
    get_cached_dataset_state,
    initialize_network_dataset_cache,
    load_dataset_frames,
    process_dataset_frame,
    query_traffic_page,
    reset_network_dataset_cache,
)


def _make_mock_request():
    """Return a minimal mock FastAPI Request suitable for unit tests."""
    req = MagicMock()
    req.headers = {}
    req.method = "GET"
    req.url = MagicMock()
    req.url.path = "/test"
    return req


def test_load_dataset_frames_discovers_csvs_and_skips_unreadable_files(tmp_path, caplog):
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    (data_dir / "first.csv").write_text(
        "source_ip,destination_ip,protocol,packet_size,traffic_label\n"
        " 1.1.1.1 , 2.2.2.2 , tcp , 1200 , BENIGN \n"
        "1.1.1.1,2.2.2.2,tcp,1200,BENIGN\n"
        "\n",
        encoding="utf-8",
    )
    nested_dir = data_dir / "nested"
    nested_dir.mkdir()
    (nested_dir / "second.csv").write_text("protocol,packet_size\nTCP,1200\n", encoding="utf-8")
    (data_dir / "broken.csv").write_bytes(b"\x00\xff")

    caplog.set_level(logging.INFO, logger="netshield.backend.network")

    frames, loaded_files, failed_files = load_dataset_frames(data_dir)

    assert len(frames) == 2
    assert len(loaded_files) == 2
    assert failed_files == ["broken.csv"]
    assert all(isinstance(frame, pd.DataFrame) for frame in frames)
    assert frames[0].shape[0] == 2
    assert frames[1].shape[0] == 1
    assert "filename=first.csv" in caplog.text
    assert "rows=" in caplog.text
    assert "columns=" in caplog.text


def test_password_hashing_and_verification_are_compatible():
    password = "StrongPassword123!"
    hashed_password = get_password_hash(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("wrong-password", hashed_password)


def test_network_dataset_cache_initializes_only_once(monkeypatch):
    reset_network_dataset_cache()
    calls = []

    def fake_load_dataset_frames(*args, **kwargs):
        calls.append(1)
        frame = pd.DataFrame(
            {
                "source_ip": ["1.1.1.1"],
                "destination_ip": ["2.2.2.2"],
                "protocol": ["TCP"],
                "packet_size": [100],
                "traffic_label": ["BENIGN"],
            }
        )
        return [frame], [], []

    monkeypatch.setattr("app.services.network_monitoring.load_dataset_frames", fake_load_dataset_frames)

    first_state = initialize_network_dataset_cache()
    second_state = initialize_network_dataset_cache()
    cached_state = get_cached_dataset_state()

    assert len(calls) == 1
    assert first_state["status"] == "ready"
    assert second_state["status"] == "ready"
    assert cached_state["combined"].loc[0, "source_ip"] == "1.1.1.1"


def test_network_traffic_endpoint_filters_by_protocol_and_threat_level(monkeypatch):
    records = [
        {"source_ip": "1.1.1.1", "destination_ip": "2.2.2.2", "protocol": "TCP", "traffic_label": "BENIGN", "threat_level": "Low"},
        {"source_ip": "3.3.3.3", "destination_ip": "4.4.4.4", "protocol": "UDP", "traffic_label": "ATTACK", "threat_level": "High"},
    ]

    async def mock_query_traffic_page(**kwargs):
        return records, len(records), "ready"

    monkeypatch.setattr(
        "app.api.network.query_traffic_page",
        mock_query_traffic_page,
    )
    # Patch out the audit logger so it doesn't require a real DB connection
    monkeypatch.setattr(
        "app.api.network.log_audit_event",
        AsyncMock(return_value=None),
    )

    response = asyncio.run(
        get_network_traffic(
            request=_make_mock_request(),
            current_user={},
            page=1,
            limit=100,
            search="",
            protocol="udp",
            threat_level="high",
        )
    )

    assert response["total_records"] == 2
    assert len(response["data"]) == 2


def test_network_analytics_includes_high_threat_and_unique_ip_counts(monkeypatch):
    analytics = {
        "total_traffic": 3,
        "normal_traffic": 1,
        "attack_traffic": 2,
        "high_threat_alerts": 1,
        "unique_source_ips": 2,
        "unique_destination_ips": 3,
        "protocol_distribution": [],
        "threat_level_distribution": [],
        "traffic_label_distribution": [],
        "top_10_source_ips": [],
        "top_10_destination_ips": [],
        "packet_size_distribution": [],
        "average_packet_size": 0,
        "minimum_packet_size": 0,
        "maximum_packet_size": 0,
    }

    # Patch ensure_dataset_loaded_async to return 'ready' immediately
    monkeypatch.setattr(
        "app.api.network.ensure_dataset_loaded_async",
        AsyncMock(return_value="ready"),
    )
    monkeypatch.setattr("app.api.network.get_cached_analytics", lambda: analytics)
    # Patch out the audit logger so it doesn't require a real DB connection
    monkeypatch.setattr(
        "app.api.network.log_audit_event",
        AsyncMock(return_value=None),
    )

    response = asyncio.run(
        get_network_analytics(
            request=_make_mock_request(),
            current_user={},
        )
    )

    assert response["total_traffic"] == 3
    assert response["normal_traffic"] == 1
    assert response["attack_traffic"] == 2
    assert response["high_threat_alerts"] == 1
    assert response["unique_source_ips"] == 2
    assert response["unique_destination_ips"] == 3


def test_common_schema_mapping_and_combination(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    (data_dir / "first.csv").write_text(
        "Source IP,Destination IP,Protocol,Packet Size,Traffic Label,Service\n"
        "1.1.1.1,2.2.2.2,tcp,1200,BENIGN,HTTP\n",
        encoding="utf-8",
    )
    (data_dir / "second.csv").write_text(
        "src_ip,dst_ip,src_port,dst_port,proto,packet_length,attack_cat\n"
        "3.3.3.3,4.4.4.4,443,80,HTTP,1500,DOS\n",
        encoding="utf-8",
    )

    frames, _, _ = load_dataset_frames(data_dir)
    processed_frames = [process_dataset_frame(frame) for frame in frames]
    combined = combine_dataset_frames(processed_frames)

    assert len(frames) == 2
    assert set(
        [
            "timestamp",
            "source_ip",
            "destination_ip",
            "source_port",
            "destination_port",
            "protocol",
            "packet_size",
            "traffic_label",
            "attack_category",
            "threat_level",
        ]
    ).issubset(combined.columns)
    assert combined.loc[0, "source_ip"] == "1.1.1.1"
    assert combined.loc[0, "protocol"] == "TCP"
    assert combined.loc[1, "source_port"] == 443
    assert combined.loc[1, "packet_size"] == 1500
