import { ethers } from "ethers";
import LandRegistryABI from "../../../artifacts/contracts/LandRegistry.sol/LandRegistry.json"; // Ensure you have the ABI JSON file


const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export function getLandRegistryContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, LandRegistryABI.abi, signer);
}
