import argparse
import json
import math
import os
from datetime import datetime, timezone
import requests

# Live 2026-27 UCL Standings baseline (after MD4) for seeded/fallback lambda estimation
CLUB_RATES = {
    "PSG": (20, 5), "Real Madrid": (13, 7), "Arsenal": (8, 3), "Como 1907": (19, 6),
    "FC Barcelona": (14, 6), "Aston Villa": (12, 6), "Man City": (12, 7), "Liverpool": (14, 10),
    "Club Brugge": (11, 7), "Sporting CP": (8, 4), "Real Betis": (8, 6), "Borussia Dortmund": (7, 5),
    "Bayern Munich": (12, 5), "VfB Stuttgart": (7, 4), "Inter Milan": (8, 6), "LASK": (10, 9),
    "Man United": (8, 8), "Galatasaray": (8, 9), "Fenerbahçe": (6, 11), "AS Roma": (10, 8),
    "Shakhtar Donetsk": (4, 4), "Viking FK": (9, 10), "Atlético Madrid": (4, 5), "PSV": (3, 4),
    "Bodø/Glimt": (4, 9), "FC Porto": (6, 7), "SSC Napoli": (6, 11), "Villarreal": (8, 14),
    "RB Leipzig": (5, 11), "AEK Athens": (5, 11), "Sabah FK": (4, 10), "Feyenoord": (4, 11),
    "RC Lens": (4, 16), "Slavia Prague": (5, 9), "LOSC Lille": (4, 10), "Slovan Bratislava": (1, 17),
}

SEEDED_MD5 = [
    ("ucl-2627-md5-01", "Galatasaray", "Aston Villa", "2026-11-24T17:45:00Z"),
    ("ucl-2627-md5-02", "Bodø/Glimt", "LASK", "2026-11-24T17:45:00Z"),
    ("ucl-2627-md5-03", "Arsenal", "Borussia Dortmund", "2026-11-24T20:00:00Z"),
    ("ucl-2627-md5-04", "Real Madrid", "PSV", "2026-11-24T20:00:00Z"),
    ("ucl-2627-md5-05", "Man City", "SSC Napoli", "2026-11-24T20:00:00Z"),
    ("ucl-2627-md5-06", "Feyenoord", "FC Porto", "2026-11-24T20:00:00Z"),
    ("ucl-2627-md5-07", "RB Leipzig", "RC Lens", "2026-11-24T20:00:00Z"),
    ("ucl-2627-md5-08", "Como 1907", "AEK Athens", "2026-11-24T20:00:00Z"),
    ("ucl-2627-md5-09", "Slovan Bratislava", "Real Betis", "2026-11-24T20:00:00Z"),
    ("ucl-2627-md5-10", "Slavia Prague", "Villarreal", "2026-11-25T17:45:00Z"),
    ("ucl-2627-md5-11", "Sabah FK", "FC Barcelona", "2026-11-25T17:45:00Z"),
    ("ucl-2627-md5-12", "PSG", "AS Roma", "2026-11-25T20:00:00Z"),
    ("ucl-2627-md5-13", "Inter Milan", "VfB Stuttgart", "2026-11-25T20:00:00Z"),
    ("ucl-2627-md5-14", "Sporting CP", "Man United", "2026-11-25T20:00:00Z"),
    ("ucl-2627-md5-15", "Club Brugge", "Liverpool", "2026-11-25T20:00:00Z"),
    ("ucl-2627-md5-16", "Atlético Madrid", "Viking FK", "2026-11-25T20:00:00Z"),
    ("ucl-2627-md5-17", "LOSC Lille", "Bayern Munich", "2026-11-25T20:00:00Z"),
    ("ucl-2627-md5-18", "Shakhtar Donetsk", "Fenerbahçe", "2026-11-25T20:00:00Z"),
]

AVG_GF = sum(v[0] for v in CLUB_RATES.values()) / (len(CLUB_RATES) * 4.0)


def poisson_pmf(k: int, lam: float) -> float:
    return (lam ** k) * math.exp(-lam) / math.factorial(k)


def estimate_lambdas(home: str, away: str) -> tuple[float, float]:
    h_gf, h_ga = CLUB_RATES.get(home, (6, 6))
    a_gf, a_ga = CLUB_RATES.get(away, (6, 6))
    lh = max(0.45, min(3.60, ((h_gf / 4.0) * (a_ga / 4.0) / AVG_GF) * 1.12))
    la = max(0.40, min(3.40, ((a_gf / 4.0) * (h_ga / 4.0) / AVG_GF) * 0.92))
    return round(lh, 2), round(la, 2)


def compute_poisson_metrics(lh: float, la: float) -> dict:
    p_home = p_draw = p_away = p_btts = 0.0
    overs = [0.0, 0.0, 0.0, 0.0, 0.0]  # 0.5, 1.5, 2.5, 3.5, 4.5
    for h in range(9):
        ph = poisson_pmf(h, lh)
        for a in range(9):
            p = ph * poisson_pmf(a, la)
            if h > a:
                p_home += p
            elif h == a:
                p_draw += p
            else:
                p_away += p
            if h > 0 and a > 0:
                p_btts += p
            total = h + a
            for idx in range(5):
                if total > idx:
                    overs[idx] += p
    return {
        "lambda_home": lh,
        "lambda_away": la,
        "prob_home": round(p_home * 100, 2),
        "prob_draw": round(p_draw * 100, 2),
        "prob_away": round(p_away * 100, 2),
        "over_05": round(overs[0] * 100, 2),
        "over_15": round(overs[1] * 100, 2),
        "over_25": round(overs[2] * 100, 2),
        "over_35": round(overs[3] * 100, 2),
        "over_45": round(overs[4] * 100, 2),
        "btts_yes": round(p_btts * 100, 2),
    }


def fetch_fixtures() -> list[dict]:
    api_key = os.getenv("API_FOOTBALL_KEY", "").strip()
    if api_key:
        try:
            r = requests.get(
                "https://v3.football.api-sports.io/fixtures",
                headers={"x-apisports-key": api_key},
                params={"league": 2, "season": 2026, "next": 18},
                timeout=12,
            )
            r.raise_for_status()
            rows = r.json().get("response", [])
            if rows:
                return [
                    {
                        "external_id": f"apifb-{item['fixture']['id']}",
                        "competition": item["league"]["name"],
                        "matchday": 5,
                        "home_team": item["teams"]["home"]["name"],
                        "away_team": item["teams"]["away"]["name"],
                        "kickoff_at": item["fixture"]["date"],
                        "status": item["fixture"]["status"]["short"],
                    }
                    for item in rows
                ]
        except Exception as exc:
            print(f"[WARN] API-Football fetch failed ({exc}); using seeded MD5 slate.")

    return [
        {
            "external_id": ext_id,
            "competition": "UEFA Champions League",
            "matchday": 5,
            "home_team": h,
            "away_team": a,
            "kickoff_at": ko,
            "status": "SCHEDULED",
        }
        for ext_id, h, a, ko in SEEDED_MD5
    ]


def generate_bias_audit(home: str, away: str, metrics: dict) -> str:
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        try:
            r = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "temperature": 0.25,
                    "max_tokens": 110,
                    "messages": [
                        {
                            "role": "system",
                            "content": "Write 2 crisp bullet points flagging Poisson model blind spots (rotation, travel, card variance) in under 45 words.",
                        },
                        {
                            "role": "user",
                            "content": f"{home} vs {away} | 1X2: {metrics['prob_home']}/{metrics['prob_draw']}/{metrics['prob_away']}% | O2.5: {metrics['over_25']}%",
                        },
                    ],
                },
                timeout=10,
            )
            if r.ok:
                txt = r.json()["choices"][0]["message"]["content"].strip()
                if txt:
                    return txt
        except Exception:
            pass

    return (
        f"Verify late lineup rotation before T-15m lock for {home} vs {away}. "
        f"Poisson independence can under-price red-card or high-press variance (O2.5: {metrics['over_25']}%)."
    )


def upsert_to_supabase(records: list[tuple[dict, dict]]) -> None:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }

    fixtures_payload = [fx for fx, _ in records]
    r_fx = requests.post(
        f"{url}/rest/v1/fixtures?on_conflict=external_id",
        headers=headers,
        json=fixtures_payload,
        timeout=15,
    )
    r_fx.raise_for_status()
    id_map = {row["external_id"]: row["id"] for row in r_fx.json()}

    now_iso = datetime.now(timezone.utc).isoformat()
    analytics_payload = []
    for fx, metrics in records:
        fid = id_map.get(fx["external_id"])
        if fid:
            analytics_payload.append({"fixture_id": fid, **metrics, "updated_at": now_iso})

    r_an = requests.post(
        f"{url}/rest/v1/match_analytics?on_conflict=fixture_id",
        headers=headers,
        json=analytics_payload,
        timeout=15,
    )
    r_an.raise_for_status()
    print(f"[OK] Upserted {len(fixtures_payload)} fixtures and {len(analytics_payload)} analytics rows to Supabase.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Syndicate Poisson/xG Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Compute and print sample JSON without writing to Supabase")
    args = parser.parse_args()

    fixtures = fetch_fixtures()
    records = []
    for fx in fixtures:
        lh, la = estimate_lambdas(fx["home_team"], fx["away_team"])
        metrics = compute_poisson_metrics(lh, la)
        metrics["ai_bias_audit"] = generate_bias_audit(fx["home_team"], fx["away_team"], metrics)
        records.append((fx, metrics))

    if args.dry_run or not (os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY")):
        print(f"[DRY-RUN] Computed {len(records)} fixtures. Sample output:")
        print(json.dumps({"fixture": records[0][0], "analytics": records[0][1]}, indent=2))
        return

    upsert_to_supabase(records)


if __name__ == "__main__":
    main()
