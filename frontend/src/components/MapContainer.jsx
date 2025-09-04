// frontend/src/components/MapContainer.jsx
import React, { useState } from "react";
import MapView from "./MapView";
import InfoPanel from "./InfoPanel";

export default function MapContainer() {
  const [selectedArea, setSelectedArea] = useState(null);
  const [playerInfo, setPlayerInfo] = useState({ name: "Nico", pos: [400, 300] });

  const handleTalkRequest = (data) => {
    setSelectedArea(data);
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div style={{ flex: 1, height: "100vh" }}>
        <MapView onTalkRequest={handleTalkRequest} />
      </div>
      <InfoPanel selectedArea={selectedArea} playerInfo={playerInfo} />
    </div>
  );
}