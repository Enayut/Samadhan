"""Seed corpus definition for the SAMAADHAN advisory retrieval layer.

This mirrors the 18-document corpus in ``data/rag/RAG_CORPUS.md`` (which stays the
human-readable manifest). Bundled documents are physically present in the data pack and
are indexed from their PDF text; URL-only documents are registered with metadata and,
if a plain-text copy exists under ``data/rag/text/``, indexed from that too.
"""
from __future__ import annotations

from pathlib import Path

# ---- Corpus entry -------------------------------------------------------------


class CorpusDocument:
    """One corpus row. ``bundled_rel`` is relative to the repo `data/` dir."""

    __slots__ = (
        "doc_id",
        "tier",
        "title",
        "source_class",
        "origin",  # URL or local note
        "bundled_rel",  # path relative to data/ when bundled, else None
        "why_relevant",
        "domain",
        "mine_relevance",
        "concepts",
    )

    def __init__(
        self,
        doc_id: str,
        tier: int,
        title: str,
        source_class: str,
        origin: str,
        bundled_rel: str | None,
        why_relevant: str,
        domain: str,
        mine_relevance: list[str],
        concepts: list[str],
    ) -> None:
        self.doc_id = doc_id
        self.tier = tier
        self.title = title
        self.source_class = source_class
        self.origin = origin
        self.bundled_rel = bundled_rel
        self.why_relevant = why_relevant
        self.domain = domain
        self.mine_relevance = mine_relevance
        self.concepts = concepts

    @property
    def bundled(self) -> bool:
        return self.bundled_rel is not None


# ---- Corpus (18 docs, ordered as RAG_CORPUS.md) -------------------------------

CORPUS: list[CorpusDocument] = [
    # Tier 1 — statutory & regulatory
    CorpusDocument(
        doc_id="cmr-2017",
        tier=1,
        title="Coal Mines Regulations, 2017 (gazette text)",
        source_class="REAL PUBLIC",
        origin="IELRC gazette mirror (URL in data/regulatory/MANIFEST.md)",
        bundled_rel="regulatory/Coal_Mines_Regulations_2017_gazette_text.pdf",
        why_relevant="Statutory backbone; every compliance task cites a regulation from this text.",
        domain="Safety/Labour/Production",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["slope", "spoil bank", "dump", "HEMM", "transport", "registers",
                  "medical examination", "safety appliances"],
    ),
    CorpusDocument(
        doc_id="circ-02-2020-slopes",
        tier=1,
        title="DGMS(Tech) Circular No. 02 of 2020 — Systematic Monitoring of Slopes in OC Mines",
        source_class="REAL OFFICIAL",
        origin="https://www.dgms.gov.in/ (bundled)",
        bundled_rel="regulatory/DGMS_Tech_Circular_02_of_2020_Slope_Monitoring_OC.pdf",
        why_relevant="Hero instrument: generates the weekly slope-monitoring obligation (MINE-001/002/003).",
        domain="Safety",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003"],
        concepts=["slope monitoring", "prism", "extensometer", "radar", "dump slope",
                  "highwall", "monitoring frequency"],
    ),
    CorpusDocument(
        doc_id="mines-rules-1955",
        tier=1,
        title="Mines Rules, 1955 (gazette text)",
        source_class="REAL PUBLIC",
        origin="IELRC gazette mirror (URL in data/regulatory/MANIFEST.md)",
        bundled_rel="regulatory/Mines_Rules_1955_gazette_text.pdf",
        why_relevant="Attendance registers, PPE/safety apparel, leave and medical rules.",
        domain="Labour/Safety",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["attendance register", "muster", "safety apparel", "footwear", "helmet", "medical"],
    ),
    CorpusDocument(
        doc_id="mines-act-1952",
        tier=1,
        title="The Mines Act, 1952 (DGMS-hosted)",
        source_class="REAL OFFICIAL",
        origin="https://www.dgms.gov.in/ (bundled)",
        bundled_rel="regulatory/Mines_Act_1952_official.pdf",
        why_relevant="Sections 47/48 — hours of work and register of persons employed.",
        domain="Labour",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["register of persons employed", "hours of work", "attendance"],
    ),
    CorpusDocument(
        doc_id="dgms-alert-23-2026",
        tier=1,
        title="DGMS Safety Alert 23/2026 (Kusmunda)",
        source_class="REAL OFFICIAL",
        origin="https://www.dgms.gov.in/ (bundled)",
        bundled_rel="regulatory/DGMS_Safety_Alert_23-2026_Kusmunda.pdf",
        why_relevant="Real alert PDF example; dumper/berm hazard class exercised in intake demos.",
        domain="Safety",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003"],
        concepts=["dump edge", "berm", "dumper", "overturn", "safe operating limit", "seat belt"],
    ),
    # Tier 2 — statistics, risk & accountability evidence
    CorpusDocument(
        doc_id="dgms-annual-report-2024",
        tier=2,
        title="DGMS Annual Report 2024",
        source_class="REAL OFFICIAL",
        origin="https://www.dgms.gov.in/ (bundled)",
        bundled_rel="regulatory/DGMS_Annual_Report_2024.pdf",
        why_relevant="Accident statistics (Table 17) and inspection activity used as cited context.",
        domain="Safety",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["fatal accidents", "fatalities", "accident rate", "inspections", "enforcement"],
    ),
    CorpusDocument(
        doc_id="dgms-risk-rating-index",
        tier=2,
        title="DGMS National Risk Rating Index",
        source_class="REAL OFFICIAL",
        origin="https://www.dgms.gov.in/ (bundled)",
        bundled_rel="regulatory/DGMS_National_Risk_Rating_Index.pdf",
        why_relevant="Official mine risk-rating methodology the advisory analytics aligns to.",
        domain="Safety",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["risk rating", "hazard index", "mine categorization"],
    ),
    CorpusDocument(
        doc_id="moc-pib-csis-aug2023",
        tier=2,
        title="MoC PIB — Measures in place to Ensure Coal Mines Safety (Aug 2023)",
        source_class="REAL OFFICIAL",
        origin="PIB release (URL in data/regulatory/MANIFEST.md)",
        bundled_rel="regulatory/MoC_PIB_Safety_Measures_Aug2023.pdf",
        why_relevant="Shows CSIS monitors safety parameters — the reporting-vs-enforcement gap evidence.",
        domain="Safety/Labour",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["CSIS", "safety monitoring", "parameters", "portal"],
    ),
    CorpusDocument(
        doc_id="thewire-mss-alerts",
        tier=2,
        title="The Wire — MSS alerts analysis (Jan 2026)",
        source_class="REAL PUBLIC",
        origin="https://m.thewire.in/article/business/a-system-to-identify-illegal-mining-raises-hundreds-of-alerts-governments-sleep-on-half-of-them",
        bundled_rel=None,
        why_relevant="958 alerts / 491 acted / 13% follow-up — detection vs enforcement context.",
        domain="Safety/Environment",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["mining surveillance", "satellite alerts", "action taken", "follow-up"],
    ),
    CorpusDocument(
        doc_id="dataful-accidents-2020-24",
        tier=2,
        title="Dataful Insights — coal mine accidents 2020-24",
        source_class="REAL PUBLIC",
        origin="https://insights.dataful.in/articles/telangana-accounted-for-nearly-two-thirds-of-serious-coal-mine-accidents",
        bundled_rel=None,
        why_relevant="195 fatal accidents / 226 deaths / 770 injuries across 2020-24.",
        domain="Safety",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["fatal accidents", "serious injuries", "deaths", "state-wise"],
    ),
    # Tier 3 — operator/company & area documents
    CorpusDocument(
        doc_id="ccl-annual-report-2024-25",
        tier=3,
        title="CCL Annual Report 2024-25",
        source_class="REAL OFFICIAL",
        origin="CCL official annual-report page (bundled)",
        bundled_rel="mine_documents/CCL_Annual_Report_2024-25.pdf",
        why_relevant="Area/company production, mines, safety statistics and governance reporting.",
        domain="Production/Safety/Environment",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["Magadh", "Amrapali", "Piparwar", "North Karanpura", "production MT", "safety"],
    ),
    CorpusDocument(
        doc_id="cil-brsr-fy2024-25",
        tier=3,
        title="CIL BRSR FY 2024-25",
        source_class="REAL OFFICIAL",
        origin="CIL sustainability reporting (bundled)",
        bundled_rel="regulatory/CIL_BRSR_FY2024-25.pdf",
        why_relevant="Group sustainability/compliance backbone (NCMSR/CSIS).",
        domain="Labour/Environment/Governance",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["compliance", "reporting", "NCMSR", "CSIS", "sustainability"],
    ),
    CorpusDocument(
        doc_id="amrapali-ocp-expansion-ec",
        tier=3,
        title="Amrapali OCP Expansion Phase-I project report",
        source_class="REAL OFFICIAL",
        origin="PARIVESH — URL in data/environment/MANIFEST.md",
        bundled_rel=None,
        why_relevant="Real EC project document for MINE-005 (Amrapali).",
        domain="Environment",
        mine_relevance=["MINE-005"],
        concepts=["environmental clearance", "MTPA", "expansion", "EC conditions"],
    ),
    CorpusDocument(
        doc_id="ashok-ocp-expansion-fc",
        tier=3,
        title="Ashok OCP expansion project report",
        source_class="REAL OFFICIAL",
        origin="PARIVESH / forest clearance — URL in data/environment/MANIFEST.md",
        bundled_rel=None,
        why_relevant="Real project document for MINE-002 (Ashok).",
        domain="Environment",
        mine_relevance=["MINE-002"],
        concepts=["forest clearance", "expansion", "North Karanpura"],
    ),
    CorpusDocument(
        doc_id="ccl-environment-forest-page",
        tier=3,
        title="CCL Environment & Forest page (EC/CTO/six-monthly compliance)",
        source_class="REAL OFFICIAL",
        origin="https://www.centralcoalfields.in/sutbs/envrfrst.php",
        bundled_rel=None,
        why_relevant="Compliance-reporting cadence the platform automates.",
        domain="Environment",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["environmental clearance", "consent to operate", "six-monthly compliance"],
    ),
    CorpusDocument(
        doc_id="moc-production-supplies",
        tier=3,
        title="Ministry of Coal — Production and Supplies",
        source_class="REAL OFFICIAL",
        origin="https://coal.gov.in/major-statistics/production-and-supplies",
        bundled_rel=None,
        why_relevant="Real production statistics magnitudes.",
        domain="Production",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["production MT", "despatch", "subsidiary"],
    ),
    CorpusDocument(
        doc_id="pib-north-karanpura-2022",
        tier=3,
        title="PIB (Aug 2022) — North Karanpura production outlook",
        source_class="REAL OFFICIAL",
        origin="https://www.pib.gov.in/PressReleasePage.aspx?PRID=1855791",
        bundled_rel=None,
        why_relevant="~85 MT from North Karanpura by FY25 (area scale context).",
        domain="Production",
        mine_relevance=["MINE-001", "MINE-002", "MINE-003", "MINE-004", "MINE-005"],
        concepts=["North Karanpura", "CCL production", "coal"],
    ),
    CorpusDocument(
        doc_id="piparwar-area-context",
        tier=3,
        title="Piparwar Area — geographic/company context",
        source_class="REAL PUBLIC",
        origin="https://en.wikipedia.org/wiki/Piparwar_Area · https://www.gem.wiki/Magadh_Coal_Mine",
        bundled_rel=None,
        why_relevant="Geographic/company context for the five-mine operational area.",
        domain="Context",
        mine_relevance=["MINE-001", "MINE-003"],
        concepts=["Piparwar OCP", "Ashoka", "Ray-Bachra", "Magadh", "Chatra", "Hazaribagh"],
    ),
]

DOC_BY_ID: dict[str, CorpusDocument] = {doc.doc_id: doc for doc in CORPUS}

# Optional plain-text copies: data/rag/text/<doc_id>.txt — used for URL-only docs
# (and as a pdftotext cache for bundled docs) when present.
TEXT_CACHE_DIR_NAME = "text"


def text_cache_dir(data_dir: Path) -> Path:
    return data_dir / "rag" / TEXT_CACHE_DIR_NAME


def corpus_root(data_dir: Path) -> Path:
    return data_dir / "rag"
