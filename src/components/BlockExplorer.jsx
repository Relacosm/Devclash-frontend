import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const BlockExplorer = ({ provider }) => {
  const [blocks, setBlocks] = useState([]);

  const fetchRecentBlocks = async () => {
    try {
      const latestBlockNumber = await provider.getBlockNumber();
      const blockList = [];

      for (let i = latestBlockNumber; i > Math.max(0, latestBlockNumber - 10); i--) {
        const block = await provider.getBlock(i);
        blockList.push(block);
      }

      setBlocks(blockList);
    } catch (error) {
      console.error("Error fetching blocks:", error);
    }
  };

  useEffect(() => {
    fetchRecentBlocks();
  }, [provider]);

  return (
    <div className="card">
      <h3>Recent Blocks</h3>
      {blocks.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Block Number</th>
              <th>Timestamp</th>
              <th>Transactions</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.number}>
                <td>{block.number}</td>
                <td>{new Date(block.timestamp * 1000).toLocaleString()}</td>
                <td>{block.transactions.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Loading blocks...</p>
      )}
    </div>
  );
};

export default BlockExplorer;
