import React, { useState, useEffect } from "react";
import { getLandRegistryContract } from "../services/landRegistryService";
import { create } from "ipfs-http-client";
import "../App.css";
import { FaLandmark, FaSearch, FaSync, FaFileAlt, FaImage, FaExchangeAlt, 
         FaMapMarkerAlt, FaMoon, FaSun, FaUpload, FaHistory, FaChartBar, 
         FaUserAlt, FaHome, FaRedo, FaPlusCircle, FaClipboard } from 'react-icons/fa';

const ipfs = create({ url: "http://127.0.0.1:5001/api/v0" });

const Dashboard = ({ signer, account }) => {
  const [landAddress, setLandAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [area, setArea] = useState("");
  const [owner, setOwner] = useState(account);
  const [surveyNumber, setSurveyNumber] = useState("");
  const [landType, setLandType] = useState("");
  const [documentCID, setDocumentCID] = useState("");
  const [landImageCID, setLandImageCID] = useState("");
  const [lands, setLands] = useState([]);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchSurveyNumber, setSearchSurveyNumber] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [transferLandId, setTransferLandId] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [isFileHovered, setIsFileHovered] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);

  const contract = getLandRegistryContract(signer);

  const truncateAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const uploadToIPFS = async (file) => {
    try {
      const added = await ipfs.add(file);
      return added.path;
    } catch (error) {
      console.error("Error uploading file to IPFS:", error);
      throw error;
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const cid = await uploadToIPFS(file);
      setDocumentCID(cid);
      
      // Modern toast notification instead of alert
      showNotification("Document uploaded successfully");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const cid = await uploadToIPFS(file);
      setLandImageCID(cid);
      
      // Modern toast notification instead of alert
      showNotification("Image uploaded successfully");
    }
  };

  // Toast notification function
  const showNotification = (message) => {
    const notification = document.createElement("div");
    notification.className = "toast-notification";
    notification.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">✓</div>
        <div class="toast-message">${message}</div>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const registerLand = async () => {
    try {
      const tx = await contract.registerLand(
        landAddress,
        pincode,
        area,
        owner,
        surveyNumber,
        landType,
        documentCID,
        landImageCID
      );
      await tx.wait();
      showNotification("Land registered successfully");
      getMyLands();
    } catch (error) {
      console.error("Error registering land:", error);
      showNotification("Failed to register land");
    }
  };

  const getMyLands = async () => {
    try {
      const landsData = await contract.getLandsByOwner(account);
      setLands(landsData);
    } catch (error) {
      console.error("Error fetching lands:", error);
    }
  };

  const searchLand = async () => {
    try {
      const results = await contract.searchLand(searchAddress, searchSurveyNumber);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching lands:", error);
    }
  };

  const transferOwnership = async () => {
    try {
      const tx = await contract.transferOwnership(transferLandId, newOwnerAddress);
      await tx.wait();
      showNotification("Ownership transferred successfully");
      getMyLands();
    } catch (error) {
      console.error("Error transferring ownership:", error);
      showNotification("Failed to transfer ownership");
    }
  };

  const fetchTransactions = async () => {
    try {
      const landRegisteredFilter = contract.filters.LandRegistered();
      const ownershipTransferredFilter = contract.filters.OwnershipTransferred();

      const landRegisteredEvents = await contract.queryFilter(landRegisteredFilter, "earliest", "latest");
      const ownershipTransferredEvents = await contract.queryFilter(ownershipTransferredFilter, "earliest", "latest");

      const allEvents = [
        ...landRegisteredEvents.map(event => ({ type: 'LandRegistered', data: event.args })),
        ...ownershipTransferredEvents.map(event => ({ type: 'OwnershipTransferred', data: event.args }))
      ];

      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      setTransactions(allEvents);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    if (account) {
      getMyLands();
      fetchTransactions();
      setOwner(account);
    }
    const intervalId = setInterval(fetchTransactions, 5000);

    return () => clearInterval(intervalId);
  }, [account]);

  const renderDashboardContent = () => {
    return (
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome to your Land Registry Dashboard</h2>
          <p>Track, manage, and transfer your land records securely on the blockchain</p>
        </div>
        
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">
              <FaHome />
            </div>
            <div className="stat-details">
              <h3>Total Lands</h3>
              <div className="stat-value">{lands ? lands.length : 0}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaUserAlt />
            </div>
            <div className="stat-details">
              <h3>Your Lands</h3>
              <div className="stat-value">{lands ? lands.length : 0}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaHistory />
            </div>
            <div className="stat-details">
              <h3>Transactions</h3>
              <div className="stat-value">{transactions ? transactions.length : 0}</div>
            </div>
          </div>
          
        </div>
        
        <div className="lands-section">
          <div className="section-header">
            <h3>Your Registered Lands</h3>
            <button className="refresh-btn" onClick={getMyLands}>
              <FaRedo /> Refresh
            </button>
          </div>
          
          {lands && lands.length > 0 ? (
            <div className="responsive-table">
              <table className="lands-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Address</th>
                    <th>Survey Number</th>
                    <th>Area</th>
                    <th>Owner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lands.map((land, index) => (
                    <tr key={index}>
                      <td><span className="land-id">{land.id.toString()}</span></td>
                      <td>{land.landAddress}</td>
                      <td>{land.surveyNumber}</td>
                      <td>{land.area.toString()} sq ft</td>
                      <td>
                        <span className="owner-address">{truncateAddress(land.owner)}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view-btn" title="View Details">
                            <FaSearch />
                          </button>
                          <button className="action-btn transfer-btn" title="Transfer Ownership"
                                  onClick={() => {
                                    setActiveTab('transfer');
                                    setTransferLandId(land.id.toString());
                                  }}>
                            <FaExchangeAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><FaHome /></div>
              <p>No lands registered yet</p>
              <button className="cta-button" onClick={() => setActiveTab('register')}>
                <FaPlusCircle /> Register New Land
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRegisterLandContent = () => {
    return (
      <div className="register-land-form">
        <div className="form-header">
          <h2><FaPlusCircle /> Register New Land</h2>
          <p>Add a new land record to the blockchain with verified ownership</p>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Land Address</label>
            <div className="input-with-icon">
              <FaMapMarkerAlt className="input-icon" />
              <input
                type="text"
                placeholder="Enter complete address"
                value={landAddress}
                onChange={(e) => setLandAddress(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Pincode</label>
            <input
              type="number"
              placeholder="Enter pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Area (in sq. feet)</label>
            <input
              type="number"
              placeholder="Enter area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Survey Number</label>
            <input
              type="text"
              placeholder="Enter survey number"
              value={surveyNumber}
              onChange={(e) => setSurveyNumber(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Land Type</label>
            <select
              value={landType}
              onChange={(e) => setLandType(e.target.value)}
            >
              <option value="">Select type</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
        </div>
        
        <div className="upload-section">
          <div 
            className={`file-upload ${isFileHovered ? 'hovered' : ''} ${documentCID ? 'has-file' : ''}`}
            onDragEnter={() => setIsFileHovered(true)}
            onDragLeave={() => setIsFileHovered(false)}
            onDragOver={(e) => e.preventDefault()}
          >
            <label>
              <input
                type="file"
                onChange={handleDocumentUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-content">
                <FaFileAlt className="upload-icon" />
                <div className="upload-text">
                  {documentCID ? (
                    <>
                      <span className="file-name">Document Uploaded</span>
                      <span className="cid">{documentCID.substring(0, 15)}...</span>
                    </>
                  ) : (
                    <>
                      <span className="title">Land Documents</span>
                      <span className="subtitle">Drag files here or click to browse</span>
                    </>
                  )}
                </div>
              </div>
            </label>
          </div>
          
          <div 
            className={`file-upload ${isImageHovered ? 'hovered' : ''} ${landImageCID ? 'has-file' : ''}`}
            onDragEnter={() => setIsImageHovered(true)}
            onDragLeave={() => setIsImageHovered(false)}
            onDragOver={(e) => e.preventDefault()}
          >
            <label>
              <input
                type="file"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-content">
                <FaImage className="upload-icon" />
                <div className="upload-text">
                  {landImageCID ? (
                    <>
                      <span className="file-name">Image Uploaded</span>
                      <span className="cid">{landImageCID.substring(0, 15)}...</span>
                    </>
                  ) : (
                    <>
                      <span className="title">Land Images</span>
                      <span className="subtitle">Drag images here or click to browse</span>
                    </>
                  )}
                </div>
              </div>
            </label>
          </div>
        </div>
        
        <button onClick={registerLand} className="register-btn">
          <FaPlusCircle /> Register Land
        </button>
      </div>
    );
  };

  const renderTransferLandContent = () => {
    return (
      <div className="transfer-land-form">
        <div className="form-header">
          <h2><FaExchangeAlt /> Transfer Land Ownership</h2>
          <p>Transfer ownership of your land to another wallet address securely on the blockchain</p>
        </div>
        
        {lands && lands.length > 0 ? (
          <div className="transfer-content">
            <div className="transfer-form">
              <div className="form-group">
                <label>Select Land ID to Transfer</label>
                <select
                  value={transferLandId}
                  onChange={(e) => setTransferLandId(e.target.value)}
                >
                  <option value="">Select Land ID</option>
                  {lands.map((land) => (
                    <option key={land.id.toString()} value={land.id.toString()}>
                      ID: {land.id.toString()} - {land.landAddress}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>New Owner Address</label>
                <div className="input-with-icon">
                  <FaUserAlt className="input-icon" />
                  <input
                    type="text"
                    placeholder="Enter wallet address of new owner"
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                  />
                </div>
                <button className="clipboard-btn" title="Paste from clipboard" 
                        onClick={() => navigator.clipboard.readText().then(text => setNewOwnerAddress(text))}>
                  <FaClipboard />
                </button>
              </div>
              
              <button 
                onClick={transferOwnership} 
                className="transfer-btn"
                disabled={!transferLandId || !newOwnerAddress}
              >
                <FaExchangeAlt /> Transfer Ownership
              </button>
            </div>
            
            <div className="your-lands">
              <div className="section-header">
                <h3>Your Lands</h3>
                <div className="lands-count">{lands.length} properties</div>
              </div>
              
              <div className="lands-cards">
                {lands.map((land, index) => (
                  <div key={index} className={`land-card ${transferLandId === land.id.toString() ? 'selected' : ''}`} 
                       onClick={() => setTransferLandId(land.id.toString())}>
                    <div className="land-card-header">
                      <span className="land-id">ID: {land.id.toString()}</span>
                      <span className="land-type">{land.landType || "Unknown"}</span>
                    </div>
                    <div className="land-card-body">
                      <div className="land-detail">
                        <FaMapMarkerAlt />
                        <span>{land.landAddress}</span>
                      </div>
                      <div className="land-detail">
                        <FaFileAlt />
                        <span>Survey: {land.surveyNumber}</span>
                      </div>
                      <div className="land-detail">
                        <FaHome />
                        <span>{land.area.toString()} sq ft</span>
                      </div>
                    </div>
                    <div className="land-card-footer">
                      {land.landImageCID && (
                        <a href={`https://ipfs.io/ipfs/${land.landImageCID}`} target="_blank" rel="noopener noreferrer">
                          View Image
                        </a>
                      )}
                      {land.documentCID && (
                        <a href={`https://ipfs.io/ipfs/${land.documentCID}`} target="_blank" rel="noopener noreferrer">
                          View Document
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><FaHome /></div>
            <p>You don't have any lands to transfer</p>
            <button className="cta-button" onClick={() => setActiveTab('register')}>
              <FaPlusCircle /> Register New Land
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSearchLandContent = () => {
    return (
      <div className="search-land-form">
        <div className="form-header">
          <h2><FaSearch /> Search Land Records</h2>
          <p>Find and verify land ownership records on the blockchain</p>
        </div>
        
        <div className="search-container">
          <div className="search-fields">
            <div className="input-with-icon">
              <FaMapMarkerAlt className="input-icon" />
              <input
                type="text"
                placeholder="Search by Land Address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
              />
            </div>
            
            <div className="input-with-icon">
              <FaFileAlt className="input-icon" />
              <input
                type="text"
                placeholder="Search by Survey Number"
                value={searchSurveyNumber}
                onChange={(e) => setSearchSurveyNumber(e.target.value)}
              />
            </div>
            
            <button onClick={searchLand} className="search-btn">
              <FaSearch /> Search
            </button>
          </div>
          
          {searchResults && searchResults.length > 0 ? (
            <div className="search-results">
              <div className="section-header">
                <h3>Search Results</h3>
                <div className="results-count">{searchResults.length} properties found</div>
              </div>
              
              <div className="lands-grid">
                {searchResults.map((land, index) => (
                  <div key={index} className="land-result-card">
                    <div className="land-image">
                      {land.landImageCID ? (
                        <a href={`https://ipfs.io/ipfs/${land.landImageCID}`} target="_blank" rel="noopener noreferrer">
                          <div className="image-placeholder">
                            <FaImage />
                            <span>View Image</span>
                          </div>
                        </a>
                      ) : (
                        <div className="image-placeholder">
                          <FaImage />
                          <span>No Image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="land-info">
                      <div className="land-title">{land.landAddress}</div>
                      <div className="land-details">
                        <div className="detail-item">
                          <span className="detail-label">ID:</span>
                          <span className="detail-value">{land.id.toString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Survey:</span>
                          <span className="detail-value">{land.surveyNumber}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Area:</span>
                          <span className="detail-value">{land.area.toString()} sq ft</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Owner:</span>
                          <span className="detail-value owner-address">{truncateAddress(land.owner)}</span>
                        </div>
                      </div>
                      
                      <div className="land-actions">
                        {land.documentCID && (
                          <a href={`https://ipfs.io/ipfs/${land.documentCID}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="document-link">
                            <FaFileAlt /> View Document
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchResults && searchResults.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FaSearch /></div>
              <p>No results found for your search criteria</p>
            </div>
          ) : (
            <div className="empty-state initial">
              <div className="empty-icon"><FaSearch /></div>
              <p>Enter search criteria to find land records</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      <header className="header">
        <div className="logo">
          <img src="/logo.png" alt="Zameen Logo"  width={200} height={150}/>
          <h1></h1>
        </div>
        <div className="header-actions">
          <button 
            className="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <div className="wallet-info">
            <div className="connection-status">• Connected</div>
            <div className="wallet-address">{truncateAddress(account)}</div>
          </div>
        </div>
      </header>
      
      <div className="main-layout">
        <nav className="sidebar">
          <div className="nav-group">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <FaChartBar className="nav-icon" />
              <span>Dashboard</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              <FaPlusCircle className="nav-icon" />
              <span>Register Land</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'transfer' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfer')}
            >
              <FaExchangeAlt className="nav-icon" />
              <span>Transfer Land</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <FaSearch className="nav-icon" />
              <span>Search Land</span>
            </button>
          </div>
        </nav>
        
        <main className="main-content">
          {activeTab === 'dashboard' && renderDashboardContent()}
          {activeTab === 'register' && renderRegisterLandContent()}
          {activeTab === 'transfer' && renderTransferLandContent()}
          {activeTab === 'search' && renderSearchLandContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;