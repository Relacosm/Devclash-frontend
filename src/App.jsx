// src/App.js
import React, { useState } from "react";
import WalletConnect from "./components/WalletConnect";
import Dashboard from "./components/Dashboard";

function App() {
  const [walletData, setWalletData] = useState(null);

  return (
    <div className="App" style={{
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
    }}>
      {!walletData ? (
        <WalletConnect onConnect={setWalletData} />
      ) : (
        <Dashboard signer={walletData.signer} account={walletData.account} />
      )}
    </div>
  );
}

export default App;
