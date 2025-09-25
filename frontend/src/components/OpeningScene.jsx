// frontend/src/components/OpeningScene.jsx
import React from 'react';
import './../styles.css';

export default function OpeningScene({ onBegin }) {
  return (
    <div className="opening-scene-container">
      <div className="opening-scene-box">
        <h1>Mission: First Dawn in Piraeus</h1>
        <p>
          You are <strong>Nico Stavrakos</strong>, the secret, bastard son of the King of Athens. While the rightful heirs live in luxury, you have been raised in the shadows, trained in the arts of manipulation, combat, and deception.
        </p>
        <p>
          Your mission: <strong>infiltrate the Royal Court</strong> and uncover the secrets that protect its power. Your ultimate goal is not just knowledge, but the throne you believe is your birthright.
        </p>
        <p className="controls-text">
          <strong>Controls:</strong> Use <strong>WASD</strong> to navigate. Press <strong>X</strong> to interact with people and landmarks.
        </p>
        <button onClick={onBegin} className="begin-button">
          Begin Mission
        </button>
      </div>
    </div>
  );
}