import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import LandRegistryABI from "./LandRegistry.json"

const LandRegistry = () => {
  // State variables
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lands, setLands] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Form state for land registration
  const [formData, setFormData] = useState({
    location: '',
    area: '',
    surveyNumber: '',
    price: '',
    documentHash: '',
    imageHash: '',
  });

  // Form state for land transfer
  const [transferForm, setTransferForm] = useState({
    landId: '',
    newOwner: '',
  });

  // Search state
  const [searchParams, setSearchParams] = useState({
    location: '',
    area: '',
    surveyNumber: '',
    pincode: '',
    priceRange: { min: '', max: '' },
    hasDocuments: 'any'
  });
  const [activeFilter, setActiveFilter] = useState('location');
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);

  // Contract address - replace with your deployed contract address
  const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your actual contract address

  // Connect wallet and initialize contract
  const connectWallet = async () => {
    try {
      setLoading(true);
      console.log("Connecting wallet...");
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Accounts:", accounts);
      
      // Using ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log("Signer obtained");
      
      const landRegistryContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        LandRegistryABI.abi,
        signer
      );
      console.log("Contract instance created");
      
      setAccount(accounts[0]);
      setContract(landRegistryContract);
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAccounts) => {
        setAccount(newAccounts[0]);
        window.location.reload();
      });
  
      // Fetch initial data
      await fetchLands();
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setErrorMessage("Failed to connect wallet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize app on mount
  useEffect(() => {
    const init = async () => {
      // Check for saved theme preference
      const savedTheme = localStorage.getItem('blockland-theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      
      // Always set loading to false, regardless of MetaMask status
      setLoading(false);
      
      if (!window.ethereum) {
        setErrorMessage("Please install MetaMask to use this application");
      }
    };

    init();
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('blockland-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('blockland-theme', 'light');
    }
  };

  // Improved land fetch function with better error handling and data transformation
  const fetchLands = async () => {
    if (!contract) return;
    
    try {
      console.log("Fetching lands...");
      const allLands = await contract.getAllLands();
      console.log("Raw lands data:", allLands);
      
      // Transform the data to work with arrays returned by ethers v6
      const formattedLands = allLands.map(land => {
        return {
          id: land[0],
          location: land[1],
          area: land[2],
          surveyNumber: land[3],
          owner: land[4],
          price: land[5],
          isVerified: land[6],
          documentHash: land[7],
          imageHash: land[8]
        };
      });
      
      console.log("Formatted lands data:", formattedLands);
      setLands(formattedLands);
    } catch (error) {
      console.error("Error fetching lands:", error);
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      setErrorMessage("Failed to fetch lands data: " + error.message);
    }
  };

  // Handle form input changes
  const handleInputChange = (e, formSetter, formState) => {
    const { name, value, type, checked } = e.target;
    formSetter({
      ...formState,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Register land with improved error handling and price handling
  const handleRegisterLand = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    try {
      setLoading(true);
      setErrorMessage(''); // Clear any previous errors
      
      console.log("Submitting with data:", formData);
      
      // Convert values to appropriate formats
      const areaValue = BigInt(formData.area);
      
      // Make sure price is a string and not empty before parsing
      const priceString = formData.price.toString();
      const priceValue = ethers.parseEther(
        priceString === '' ? '0' : priceString
      );
      
      console.log("Converted values:", {
        area: areaValue.toString(),
        price: priceValue.toString()
      });
      
      const tx = await contract.registerLand(
        formData.location,
        areaValue,
        formData.surveyNumber,
        priceValue,
        formData.documentHash || "",  // Provide default empty string
        formData.imageHash || "",     // Provide default empty string
        { 
          gasLimit: 500000  // Explicitly set gas limit
        }
      );
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      setSuccessMessage("Land registered successfully!");
      setFormData({
        location: '',
        area: '',
        surveyNumber: '',
        price: '',
        documentHash: '',
        imageHash: '',
      });
      
      // Refresh lands data
      await fetchLands();
    } catch (error) {
      console.error("Error registering land:", error);
      // Extract most useful error message
      let errorMsg = "Failed to register land. ";
      
      if (error.reason) {
        errorMsg += error.reason;
      } else if (error.message) {
        errorMsg += error.message;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Updated transfer land function with better error handling
  const handleTransferLand = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    try {
      setLoading(true);
      setErrorMessage(''); // Clear previous errors
      
      console.log(`Transferring land ${transferForm.landId} to ${transferForm.newOwner}`);
      
      const tx = await contract.transferLand(
        transferForm.landId, 
        transferForm.newOwner,
        { gasLimit: 300000 }
      );
      
      console.log("Transfer transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Transfer transaction confirmed");
      
      setSuccessMessage("Land transferred successfully!");
      setTransferForm({
        landId: '',
        newOwner: '',
      });
      
      // Refresh lands data
      await fetchLands();
    } catch (error) {
      console.error("Error transferring land:", error);
      let errorMsg = "Failed to transfer land. ";
      
      if (error.reason) {
        errorMsg += error.reason;
      } else if (error.message) {
        errorMsg += error.message;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Mock IPFS upload function
  const uploadToIPFS = async (file) => {
    console.log("Mock uploading file:", file.name);
    return `ipfs-hash-${Math.random().toString(36).substring(2, 15)}`;
  };

  // File upload handling
  const handleFileUpload = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      console.log(`Uploading ${fileType}:`, file.name);
      
      // In a real app, you'd upload to IPFS and get back a hash
      const ipfsHash = await uploadToIPFS(file);
      console.log(`${fileType} uploaded with hash:`, ipfsHash);
      
      setFormData(prev => ({
        ...prev,
        [fileType === 'document' ? 'documentHash' : 'imageHash']: ipfsHash
      }));
      
      setSuccessMessage(`${fileType} uploaded successfully!`);
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      setErrorMessage(`Failed to upload ${fileType}. ${error.message}`);
    }
  };

  // Handle search input changes
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'min' || name === 'max') {
      setSearchParams({
        ...searchParams,
        priceRange: {
          ...searchParams.priceRange,
          [name]: value
        }
      });
    } else {
      setSearchParams({
        ...searchParams,
        [name]: value
      });
    }
  };

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!isAdvancedSearch && !searchParams[activeFilter].trim()) {
      setSearchError(`Please enter a value for ${activeFilter}`);
      return;
    }

    setIsSearchLoading(true);
    setSearchError(null);

    try {
      // For demo purposes, we'll filter the lands data we already have
      // In a production app, you might want to call a contract method instead
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      let results = [...lands];
      const filterValue = searchParams[activeFilter].toLowerCase();

      if (!isAdvancedSearch) {
        if (activeFilter === 'area') {
          results = results.filter(land => 
            land.area.toString().includes(filterValue)
          );
        } else if (activeFilter === 'price') {
          results = results.filter(land => 
            formatEthValue(land.price).includes(filterValue)
          );
        } else if (activeFilter === 'surveyNumber') {
          results = results.filter(land =>
            land.surveyNumber.toLowerCase().includes(filterValue)
          );
        } else {
          results = results.filter(land =>
            String(land[activeFilter]).toLowerCase().includes(filterValue)
          );
        }
      } else {
        if (searchParams.location) {
          results = results.filter(land => 
            land.location.toLowerCase().includes(searchParams.location.toLowerCase())
          );
        }

        if (searchParams.area) {
          const targetArea = parseInt(searchParams.area);
          results = results.filter(land => {
            const landArea = parseInt(land.area.toString());
            return landArea <= targetArea + 200 && landArea >= targetArea - 200;
          });
        }

        if (searchParams.surveyNumber) {
          results = results.filter(land => 
            land.surveyNumber.toLowerCase().includes(searchParams.surveyNumber.toLowerCase())
          );
        }

        if (searchParams.priceRange.min) {
          const minPrice = ethers.parseEther(searchParams.priceRange.min.toString());
          results = results.filter(land => land.price >= minPrice);
        }

        if (searchParams.priceRange.max) {
          const maxPrice = ethers.parseEther(searchParams.priceRange.max.toString());
          results = results.filter(land => land.price <= maxPrice);
        }

        if (searchParams.hasDocuments !== 'any') {
          const hasDocs = searchParams.hasDocuments === 'yes';
          results = results.filter(land => (land.documentHash && land.documentHash !== "") === hasDocs);
        }
      }

      if (results.length === 0) {
        setSearchError('No matching land records found');
      }

      setSearchResults(results);
    } catch (err) {
      setSearchError('Failed to search land records. Please try again.');
      console.error(err);
    } finally {
      setIsSearchLoading(false);
    }
  };

  // Reset search form
  const resetSearch = () => {
    setSearchParams({
      location: '',
      area: '',
      surveyNumber: '',
      pincode: '',
      priceRange: { min: '', max: '' },
      hasDocuments: 'any'
    });
    setSearchResults([]);
    setSearchError(null);
  };

  // Format ETH values correctly with better error handling
  const formatEthValue = (value) => {
    try {
      if (!value) return "0";
      return ethers.formatEther(value);
    } catch (error) {
      console.error("Error formatting ETH value:", error);
      return "0";
    }
  };

  // Clear messages after timeout
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Helper to format addresses
  const shortenAddress = (address) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
  };

  // Helper function to handle different land data formats
  const formatLandData = (land) => {
    // Check if land is an array (ethers v6 format) or object
    if (Array.isArray(land)) {
      return {
        id: land[0],
        location: land[1],
        area: land[2],
        surveyNumber: land[3],
        owner: land[4],
        price: land[5],
        isVerified: land[6],
        documentHash: land[7],
        imageHash: land[8]
      };
    }
    return land;
  };

  // Render search results
  const renderSearchResults = () => {
    if (isSearchLoading) return <div className="loading">Searching...</div>;
    if (searchError) return <div className="message error">{searchError}</div>;
    if (searchResults.length === 0) return null;

    return (
      <div className="search-results">
        <h3>Search Results ({searchResults.length} properties found)</h3>
        <div className="lands-grid">
          {searchResults.map((land, index) => {
            const landData = formatLandData(land);
            return (
              <div key={index} className="land-card">
                <div className="land-image">
                  {landData.imageHash ? (
                    <img src={`https://ipfs.io/ipfs/${landData.imageHash}`} alt="Land" />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                </div>
                <div className="land-info">
                  <h4>ID: {landData.id.toString()} - {landData.location}</h4>
                  <p><strong>Area:</strong> {landData.area.toString()} sq.m</p>
                  <p><strong>Price:</strong> {formatEthValue(landData.price)} ETH</p>
                  <p><strong>Owner:</strong> {shortenAddress(landData.owner)}</p>
                  <p><strong>Survey #:</strong> {landData.surveyNumber}</p>
                  {landData.documentHash && (
                    <a href={`https://ipfs.io/ipfs/${landData.documentHash}`} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Documents
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard">
            <h2>Your Land Registry Dashboard</h2>
            <div className="stats-cards">
              <div className="stat-card">
                <h3>Total Lands</h3>
                <p className="stat-value">{lands.length}</p>
              </div>
              <div className="stat-card">
                <h3>Your Lands</h3>
                <p className="stat-value">
                  {lands.filter(land => land.owner.toLowerCase() === account.toLowerCase()).length}
                </p>
              </div>
            </div>

            <h3>All Registered Lands</h3>
            <div className="lands-grid">
              {lands.map((land, index) => {
                const landData = formatLandData(land);
                return (
                  <div key={index} className="land-card">
                    <div className="land-image">
                      {landData.imageHash ? (
                        <img src={`https://ipfs.io/ipfs/${landData.imageHash}`} alt="Land" />
                      ) : (
                        <div className="placeholder-image">No Image</div>
                      )}
                    </div>
                    <div className="land-info">
                      <h4>ID: {landData.id.toString()} - {landData.location}</h4>
                      <p><strong>Area:</strong> {landData.area.toString()} sq.m</p>
                      <p><strong>Price:</strong> {formatEthValue(landData.price)} ETH</p>
                      <p><strong>Owner:</strong> {shortenAddress(landData.owner)}</p>
                      <p><strong>Survey #:</strong> {landData.surveyNumber}</p>
                      {landData.documentHash && (
                        <a href={`https://ipfs.io/ipfs/${landData.documentHash}`} target="_blank" rel="noopener noreferrer" className="document-link">
                          View Documents
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              {lands.length === 0 && <p>No lands registered yet or failed to fetch land data.</p>}
            </div>
          </div>
        );
        
      case 'register':
        return (
          <div className="register-land">
            <h2>Register New Land</h2>
            <p>Complete the form below to register your land on the blockchain.</p>
            
            <form onSubmit={handleRegisterLand} className="form">
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange(e, setFormData, formData)}
                  placeholder="e.g. 123 Blockchain St, Crypto City"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="area">Area (in square meters)</label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={(e) => handleInputChange(e, setFormData, formData)}
                  placeholder="e.g. 500"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="surveyNumber">Survey Number</label>
                <input
                  type="text"
                  id="surveyNumber"
                  name="surveyNumber"
                  value={formData.surveyNumber}
                  onChange={(e) => handleInputChange(e, setFormData, formData)}
                  placeholder="e.g. SUR-12345"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">Price (in ETH)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange(e, setFormData, formData)}
                  placeholder="e.g. 10"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="documents">Land Documents</label>
                <input
                  type="file"
                  id="documents"
                  onChange={(e) => handleFileUpload(e, 'document')}
                  accept=".pdf,.doc,.docx"
                />
                <small>Upload ownership documents (PDF or DOC)</small>
                {formData.documentHash && (
                  <div className="upload-success">Document hash: {shortenAddress(formData.documentHash)}</div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="image">Land Image</label>
                <input
                  type="file"
                  id="image"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  accept="image/*"
                />
                <small>Upload a photograph of the land</small>
                {formData.imageHash && (
                  <div className="upload-success">Image hash: {shortenAddress(formData.imageHash)}</div>
                )}
              </div>
              
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Processing...' : 'Register Land'}
              </button>
            </form>
          </div>
        );
        
      case 'transfer':
        return (
          <div className="transfer-land">
            <h2>Transfer Land Ownership</h2>
            <p>Transfer your land to a new owner.</p>
            
            <form onSubmit={handleTransferLand} className="form">
              <div className="form-group">
                <label htmlFor="landId">Land ID</label>
                <input
                  type="number"
                  id="landId"
                  name="landId"
                  value={transferForm.landId}
                  onChange={(e) => handleInputChange(e, setTransferForm, transferForm)}
                  placeholder="Enter land ID"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newOwner">New Owner Address</label>
                <input
                  type="text"
                  id="newOwner"
                  name="newOwner"
                  value={transferForm.newOwner}
                  onChange={(e) => handleInputChange(e, setTransferForm, transferForm)}
                  placeholder="e.g. 0x..."
                  required
                />
              </div>
              
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Processing...' : 'Transfer Ownership'}
              </button>
            </form>
            
            <div className="my-lands">
              <h3>Your Lands</h3>
              <div className="lands-grid">
                {lands
                  .filter(land => land.owner.toLowerCase() === account.toLowerCase())
                  .map((land, index) => {
                    const landData = formatLandData(land);
                    return (
                      <div key={index} className="land-card">
                        <div className="land-info">
                          <h4>ID: {landData.id.toString()} - {landData.location}</h4>
                          <p><strong>Area:</strong> {landData.area.toString()} sq.m</p>
                          <button 
                            className="btn small"
                            onClick={() => setTransferForm({
                              landId: landData.id.toString(),
                              newOwner: ''
                            })}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {lands.filter(land => land.owner.toLowerCase() === account.toLowerCase()).length === 0 && 
                  <p>You don't own any lands yet.</p>
                }
              </div>
            </div>
          </div>
        );

      case 'search':
  return (
    <div className="search-land">
      <h2>Land Registry Search</h2>
      <div className="search-toggle" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          className={!isAdvancedSearch ? 'btn small active' : 'btn small'} 
          onClick={() => setIsAdvancedSearch(false)}
        >
          Simple Search
        </button>
        <button 
          className={isAdvancedSearch ? 'btn small active' : 'btn small'} 
          onClick={() => setIsAdvancedSearch(true)}
        >
          Advanced Search
        </button>
      </div>

      <form onSubmit={handleSearch} className="form">
      {!isAdvancedSearch ? (
        <div className="simple-search">
          <div className="form-row" style={{ marginBottom: '15px' }}>
            <div className="form-group">
              <label>Filter Type</label>
              <select 
                value={activeFilter} 
                onChange={(e) => setActiveFilter(e.target.value)}
                className="filter-select"
              >
                <option value="location">Location</option>
                <option value="area">Area</option>
                <option value="surveyNumber">Survey Number</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{activeFilter.replace(/([A-Z])/g, ' $1').toLowerCase().charAt(0).toUpperCase() + activeFilter.replace(/([A-Z])/g, ' $1').toLowerCase().slice(1)}</label>
              <input
                type={activeFilter === 'area' || (activeFilter === 'price') ? 'number' : 'text'}
                name={activeFilter}
                value={searchParams[activeFilter]}
                onChange={handleSearchInputChange}
                placeholder={`Enter ${activeFilter.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                step={activeFilter === 'price' ? "0.01" : undefined}
              />
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="button" onClick={resetSearch} className="btn">Reset</button>
            <button type="submit" className="btn primary" disabled={isSearchLoading} style={{ marginLeft: '10px' }}>
              {isSearchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      ) : (
        <div className="advanced-search">
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                name="location" 
                value={searchParams.location} 
                onChange={handleSearchInputChange} 
                placeholder="City, State" 
              />
            </div>
            <div className="form-group">
              <label>Area (sq. m)</label>
              <input 
                type="number" 
                name="area" 
                value={searchParams.area} 
                onChange={handleSearchInputChange} 
                placeholder="Approximate area" 
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Survey Number</label>
              <input 
                type="text" 
                name="surveyNumber" 
                value={searchParams.surveyNumber} 
                onChange={handleSearchInputChange} 
                placeholder="SUR-XXX/XX" 
              />
            </div>
            <div className="form-group">
              <label>Documents Available</label>
              <select 
                name="hasDocuments" 
                value={searchParams.hasDocuments} 
                onChange={handleSearchInputChange}
              >
                <option value="any">Any</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group price-range">
              <label>Price Range (ETH)</label>
              <div className="range-inputs">
                <input 
                  type="number" 
                  name="min" 
                  value={searchParams.priceRange.min} 
                  onChange={handleSearchInputChange} 
                  placeholder="Min" 
                  step="0.01"
                />
                <span>to</span>
                <input 
                  type="number" 
                  name="max" 
                  value={searchParams.priceRange.max} 
                  onChange={handleSearchInputChange} 
                  placeholder="Max" 
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="button" onClick={resetSearch} className="btn">Reset</button>
            <button type="submit" className="btn primary" disabled={isSearchLoading} style={{ marginLeft: '10px' }}>
              {isSearchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      )}
      </form>

      {renderSearchResults()}
    </div>
  );
        
      default:
        return <div>Page not found</div>;
    }
  };

  // Theme toggle icon based on current mode
  const ThemeIcon = () => (
    darkMode ? (
      <svg className="icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path>
      </svg>
    ) : (
      <svg className="icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
      </svg>
    )
  );

  return (
    <div className="land-registry-app">
      <header className="header">
        <div className="logo">
          <h1></h1>
        </div>
        <div className="wallet-info">
          <button onClick={toggleDarkMode} className="theme-toggle">
            <ThemeIcon />
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          {account ? (
            <>
              <span className="address">{shortenAddress(account)}</span>
              <span className="status connected">Connected</span>
            </>
          ) : (
            <button onClick={connectWallet} className="btn connect">Connect Wallet</button>
          )}
        </div>
      </header>
      
      {account && (
        <nav className="nav-tabs">
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeTab === 'register' ? 'active' : ''} 
            onClick={() => setActiveTab('register')}
          >
            Register Land
          </button>
          <button 
            className={activeTab === 'transfer' ? 'active' : ''} 
            onClick={() => setActiveTab('transfer')}
          >
            Transfer Land
          </button>
          <button 
            className={activeTab === 'search' ? 'active' : ''} 
            onClick={() => setActiveTab('search')}
          >
            Search Land
          </button>
        </nav>
      )}
      
      <main className="main-content">
        {errorMessage && <div className="message error">{errorMessage}</div>}
        {successMessage && <div className="message success">{successMessage}</div>}
        {loading && !account ? (
          <div className="loading-screen">
            <div className="spinner"></div>
            <p>Loading Zameen...</p>
          </div>
        ) : (
          !account ? (
            <div className="welcome">
              <h2>Welcome to Zameen</h2>
              <p>A secure and transparent blockchain-based land registry system</p>
              <div className="features">
                <div className="feature">
                  <i className="icon secure"></i>
                  <h3>Secure</h3>
                  <p>Blockchain-backed security for your land records</p>
                </div>
                <div className="feature">
                  <i className="icon transparent"></i>
                  <h3>Transparent</h3>
                  <p>Clear, immutable ownership history</p>
                </div>
                <div className="feature">
                  <i className="icon efficient"></i>
                  <h3>Efficient</h3>
                  <p>Quick transfers without middlemen</p>
                </div>
              </div>
              <button onClick={connectWallet} className="btn hero-btn">
                Connect Wallet to Get Started
              </button>
            </div>
          ) : renderContent()
        )}
      </main>
      
      <footer className="footer">
        <p>© 2025 Zameen • Secured by Blockchain Technology</p>
      </footer>
    </div>
  );
};

export default LandRegistry;
