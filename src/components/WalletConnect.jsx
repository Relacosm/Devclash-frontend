// src/components/WalletConnect.js
import React, { useState } from "react";
import { connectWallet } from "../utils/web3";
import { FaWallet } from "react-icons/fa";  // MetaMask-like wallet icon

const WalletConnect = ({ onConnect }) => {
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      const walletData = await connectWallet();
      onConnect(walletData);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a3d2e", // Dark green background
        fontFamily: "'Roboto', sans-serif",
        color: "#fff",
        padding: "0 20px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            color: "#fff",
            marginBottom: "10px",
          }}
        >
          Connect Your Wallet
        </h1>
        <p style={{ fontSize: "16px", color: "#a1d1c9" }}>
          Securely connect your MetaMask wallet to get started.
        </p>
      </div>

      <button
        onClick={handleConnect}
        style={{
          padding: "12px 28px",
          fontSize: "18px",
          backgroundColor: "#1a6d46", // Darker green for button
          color: "white",
          border: "none",
          borderRadius: "50px",
          boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          transition: "all 0.3s ease-in-out",
          transform: "scale(1)",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#155a3b"; // Slightly darker on hover
          e.target.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#1a6d46";
          e.target.style.transform = "scale(1)";
        }}
      >
        <FaWallet size={22} /> {/* Wallet Icon */}
        Connect MetaMask
      </button>

      {error && (
        <p
          style={{
            color: "#e74c3c",
            marginTop: "20px",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default WalletConnect;
