// frontend/src/components/InfoPanel.jsx
import React from "react";

export default function InfoPanel({ selectedArea, playerInfo }) {
  return (
    <div style={{
      width: "280px",
      height: "100vh",
      background: "#0f1724",
      color: "#fff",
      padding: "12px",
      boxShadow: "-8px 0 24px rgba(0,0,0,0.6)",
      zIndex: 20,
      position: "relative",
      overflowY: "auto"
    }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Living Worlds — Map</h2>
      
      {playerInfo && (
        <div style={{
          background: "rgba(255,255,255,0.04)",
          padding: "8px",
          borderRadius: "6px",
          marginBottom: "12px"
        }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Player Info</h3>
          <p style={{ margin: "4px 0", fontSize: "12px" }}>Name: {playerInfo.name}</p>
          <p style={{ margin: "4px 0", fontSize: "12px" }}>
            Position: ({Math.round(playerInfo.pos[0])}, {Math.round(playerInfo.pos[1])})
          </p>
        </div>
      )}

      {selectedArea && (
        <div style={{
          background: "rgba(255,255,255,0.04)",
          padding: "8px",
          borderRadius: "6px",
          marginBottom: "12px"
        }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Selected Area</h3>
          <p style={{ margin: "4px 0", fontSize: "12px" }}>{selectedArea.name}</p>
          <p style={{ margin: "4px 0", fontSize: "12px" }}>Type: {selectedArea.type || 'Unknown'}</p>
        </div>
      )}

      <div style={{
        background: "rgba(255,255,255,0.04)",
        padding: "8px",
        borderRadius: "6px"
      }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Controls</h3>
        <p style={{ margin: "4px 0", fontSize: "12px" }}>WASD - Move player</p>
        <p style={{ margin: "4px 0", fontSize: "12px" }}>Click areas to select</p>
      </div>
    </div>
  );
}