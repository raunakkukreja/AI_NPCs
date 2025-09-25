// frontend/src/components/ReportScreen.jsx
import React, { useEffect, useState } from "react";

/*
  ReportScreen:
  - shows mission header
  - lists playerInteractions passed from App
  - fetches /api/gossip to compute gossip reach (which NPCs hold which gossip items)
  - a Finalize Report button that marks submission locally and tries to POST to /api/submit (optional)
*/

export default function ReportScreen({ onHideReport, playerInteractions = [] }) {
  const [gossipNetwork, setGossipNetwork] = useState(null);
  const [loadingGossip, setLoadingGossip] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    async function fetchGossip() {
      setLoadingGossip(true);
      try {
        const res = await fetch("/api/gossip");
        if (!res.ok) throw new Error("No gossip endpoint");
        const data = await res.json();
        setGossipNetwork(data);
      } catch (err) {
        console.warn("Could not fetch gossip network:", err.message);
        setGossipNetwork(null);
      } finally {
        setLoadingGossip(false);
      }
    }
    fetchGossip();
  }, []);

  // compute gossip holders summary
  const computeGossipSummary = (network) => {
    if (!network) return [];
    // network is { npcId: [gossipItems...] }
    // build map gossipId -> holders
    const map = {}; // gossipId -> {summary, holders: [npcIds], sources: []}
    for (const [npcId, items] of Object.entries(network)) {
      for (const it of (items || [])) {
        const gid = it.id || it.summary || JSON.stringify(it).slice(0,40);
        if (!map[gid]) map[gid] = { summary: it.summary || it.text || "(no summary)", holders: new Set(), sources: new Set() };
        map[gid].holders.add(npcId);
        if (it.source) map[gid].sources.add(it.source);
      }
    }
    // convert sets to arrays
    return Object.entries(map).map(([gid, val]) => ({
      id: gid,
      summary: val.summary,
      holders: Array.from(val.holders),
      sources: Array.from(val.sources)
    }));
  };

  const gossipSummary = computeGossipSummary(gossipNetwork);

  const handleFinalize = async () => {
    // local finalize
    setSubmitted(true);
    setSubmitError(null);

    // optional: POST to server to mark mission submitted if you implement endpoint later
    try {
      await fetch("/api/submit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interactions: playerInteractions, timestamp: Date.now() })
      });
    } catch (err) {
      // don't fail the UI if server not present
      setSubmitError("Could not contact server to persist report (optional).");
      console.warn("submit-report failed:", err.message);
    }
  };

  return (
    <div style={{
      position: "fixed", left: 0, top: 0, right: 0, bottom: 0,
      background: "linear-gradient(#071022, #021018)",
      color: "#fff", padding: 24, overflow: "auto", zIndex: 9999
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", background: "rgba(0,0,0,0.6)", padding: 20, borderRadius: 10 }}>
        <h1>Mission Report — First Dawn in Piraeus</h1>
        <p>You are about to submit the report compiled from your conversations and observations. Below is a summary of important lines and gossip reach detected so far.</p>

        <section style={{ marginTop: 18 }}>
          <h2>Collected Interactions ({playerInteractions.length})</h2>
          {playerInteractions.length === 0 && <div style={{ color: "#ddd" }}>No interactions recorded yet.</div>}
          <div style={{ display: "grid", gap: 10 }}>
            {playerInteractions.map((it) => (
              <div key={it.id} style={{ background: "rgba(255,255,255,0.03)", padding: 10, borderRadius: 6 }}>
                <div style={{ fontSize: 12, color: "#bbb" }}>{new Date(it.timestamp).toLocaleString()}</div>
                <div><strong>NPC</strong>: {it.npcName || it.npcId}</div>
                <div style={{ marginTop: 6 }}><strong>You</strong>: {it.playerMessage}</div>
                <div style={{ marginTop: 6 }}><strong>NPC replied</strong>: {it.npcResponse}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          <h2>Gossip Reach</h2>
          {loadingGossip && <div>Loading gossip network...</div>}
          {!loadingGossip && gossipSummary.length === 0 && <div style={{ color: "#ddd" }}>No gossip detected or backend endpoint unavailable.</div>}
          {!loadingGossip && gossipSummary.length > 0 && (
            <div>
              {gossipSummary.map(g => (
                <div key={g.id} style={{ background: "rgba(255,255,255,0.02)", padding: 10, borderRadius: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: 13 }}><strong>Gossip:</strong> {g.summary}</div>
                  <div style={{ fontSize: 12, color: "#ccc", marginTop: 6 }}>
                    Known by: {g.holders.join(", ")}
                  </div>
                  {g.sources && g.sources.length > 0 && <div style={{ fontSize: 12, color: "#bbb", marginTop: 6 }}>Origin(s): {g.sources.join(", ")}</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
          <button onClick={() => onHideReport()} style={{ padding: "8px 12px", borderRadius: 6, background: "#333", color: "#fff", border: "none" }}>Back</button>
          {!submitted ? (
            <button onClick={handleFinalize} style={{ padding: "8px 12px", borderRadius: 6, background: "#0ea5a0", color: "#042021", border: "none", fontWeight: 700 }}>
              Finalize Report
            </button>
          ) : (
            <div style={{ color: "#8ef2d0", alignSelf: "center" }}>
              Report finalized ✔
              {submitError && <div style={{ color: "#ffb4b4", marginTop: 6 }}>{submitError}</div>}
            </div>
          )}
        </div>

        <div style={{ marginTop: 18, fontSize: 13, color: "#aaa" }}>
          Note: Finalize Report currently stores submission locally in your browser session. If you want server-side persistence, add a POST endpoint `/api/submit-report` in the backend to save the submission.
        </div>
      </div>
    </div>
  );
}
