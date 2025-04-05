import { ethers } from "ethers";

export async function connectWallet() {
  if (window.ethereum) {
    console.log("window.ethereum", window.ethereum);
    try {
   
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log("provider", provider);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      // Get the signer (await the asynchronous call)
      const signer = await provider.getSigner();
      return { provider, signer, account: accounts[0] };
    } catch (error) {
      console.error("User denied account access", error);
      throw new Error("User denied account access");
    }
  } else {
    throw new Error("MetaMask not found. Please install it.");
  }
}
