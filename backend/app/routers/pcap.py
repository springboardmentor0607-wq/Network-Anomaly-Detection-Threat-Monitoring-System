from fastapi import APIRouter, HTTPException
from app.database.mongodb import pcap_analysis_collection

router = APIRouter(
    prefix="/pcap",
    tags=["PCAP Analysis"]
)


# ============================================================
# GET ALL PCAP ANALYSES
# ============================================================

@router.get("/analyses")
def get_pcap_analyses():

    analyses = list(
        pcap_analysis_collection.find({})
        .sort("created_at", -1)
        .limit(50)
    )

    for analysis in analyses:

        analysis["_id"] = str(
            analysis["_id"]
        )

    return {
        "total": len(analyses),
        "analyses": analyses
    }


# ============================================================
# GET LATEST PCAP ANALYSIS
# ============================================================

@router.get("/latest")
def get_latest_pcap():

    analysis = pcap_analysis_collection.find_one(
        {},
        sort=[("created_at", -1)]
    )

    if not analysis:

        raise HTTPException(
            status_code=404,
            detail="No PCAP analysis found"
        )

    analysis["_id"] = str(
        analysis["_id"]
    )

    return analysis