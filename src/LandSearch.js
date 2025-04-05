// LandSearch.js
import React, { useState } from 'react';
import './LandRegistry.css';

const LandSearch = () => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  const mockLandData = [
    { 
      id: 'LD001', 
      location: 'Mumbai, Maharashtra', 
      area: 1200, 
      surveyNumber: 'SUR-123/45', 
      price: 2500000, 
      hasDocuments: true, 
      hasImage: true,
      owner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      coordinates: '19.076°N 72.877°E',
      registrationDate: '2023-05-15',
      pincode: '400001'
    },
    { 
      id: 'LD002', 
      location: 'Pune, Maharashtra', 
      area: 2500, 
      surveyNumber: 'SUR-456/78', 
      price: 3800000, 
      hasDocuments: true, 
      hasImage: true,
      owner: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      coordinates: '18.520°N 73.856°E',
      registrationDate: '2023-07-22',
      pincode: '411001'
    },
    { 
      id: 'LD003', 
      location: 'Bangalore, Karnataka', 
      area: 1800, 
      surveyNumber: 'SUR-789/10', 
      price: 4200000, 
      hasDocuments: true, 
      hasImage: false,
      owner: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
      coordinates: '12.972°N 77.594°E',
      registrationDate: '2023-09-10',
      pincode: '560001'
    },
    { 
      id: 'LD004', 
      location: 'Chennai, Tamil Nadu', 
      area: 3200, 
      surveyNumber: 'SUR-101/11', 
      price: 3500000, 
      hasDocuments: false, 
      hasImage: true,
      owner: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
      coordinates: '13.083°N 80.270°E',
      registrationDate: '2024-01-05',
      pincode: '600001'
    },
  ];

  const handleInputChange = (e) => {
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

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!isAdvancedSearch && !searchParams[activeFilter].trim()) {
      setError(`Please enter a value for ${activeFilter}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      let results = [...mockLandData];
      const filterValue = searchParams[activeFilter].toLowerCase();

      if (!isAdvancedSearch) {
        if (activeFilter === 'area') {
          results = results.filter(land => 
            land.area.toString().includes(filterValue)
          );
        } else if (activeFilter === 'price') {
          results = results.filter(land => 
            land.price.toString().includes(filterValue)
          );
        } else if (activeFilter === 'pincode') {
          results = results.filter(land =>
            land.pincode.toString().includes(filterValue)
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
          results = results.filter(land => 
            land.area <= parseInt(searchParams.area) + 200 && 
            land.area >= parseInt(searchParams.area) - 200
          );
        }

        if (searchParams.surveyNumber) {
          results = results.filter(land => 
            land.surveyNumber.toLowerCase().includes(searchParams.surveyNumber.toLowerCase())
          );
        }

        if (searchParams.pincode) {
          results = results.filter(land =>
            land.pincode.toLowerCase().includes(searchParams.pincode.toLowerCase())
          );
        }

        if (searchParams.priceRange.min) {
          results = results.filter(land => 
            land.price >= parseInt(searchParams.priceRange.min)
          );
        }

        if (searchParams.priceRange.max) {
          results = results.filter(land => 
            land.price <= parseInt(searchParams.priceRange.max)
          );
        }

        if (searchParams.hasDocuments !== 'any') {
          const hasDocs = searchParams.hasDocuments === 'yes';
          results = results.filter(land => land.hasDocuments === hasDocs);
        }
      }

      if (results.length === 0) {
        setError('No matching land records found');
      }

      setSearchResults(results);
    } catch (err) {
      setError('Failed to search land records. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
    setError(null);
  };

  const renderSearchResults = () => {
    if (isLoading) return <div className="loading">Searching...</div>;
    if (error) return <div className="error">{error}</div>;
    if (searchResults.length === 0) return null;

    return (
      <div className="search-results">
        <h3>Search Results ({searchResults.length} properties found)</h3>
        <div className="results-grid">
          {searchResults.map((land) => (
            <div className="land-card" key={land.id}>
              <div className="land-image">
                {land.hasImage ? (
                  <div className="image-placeholder">Land Image</div>
                ) : (
                  <div className="no-image">No Image Available</div>
                )}
              </div>
              <div className="land-details">
                <h4>{land.location}</h4>
                <div className="property-id">ID: {land.id}</div>
                <div className="property-info">
                  <div><strong>Area:</strong> {land.area} sq. ft</div>
                  <div><strong>Survey Number:</strong> {land.surveyNumber}</div>
                  <div><strong>Pincode:</strong> {land.pincode}</div>
                  <div><strong>Price:</strong> ₹{land.price.toLocaleString()}</div>
                  <div><strong>Documents:</strong> {land.hasDocuments ? 'Available' : 'Not Available'}</div>
                  <div><strong>Owner:</strong> {land.owner.substring(0, 6)}...{land.owner.slice(-4)}</div>
                </div>
                <div className="card-actions">
                  <button className="view-btn">View Details</button>
                  <button className="blockchain-btn">View on Blockchain</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="land-search-container">
      <h2>Land Registry Search</h2>

      <div className="search-toggle">
        <button className={!isAdvancedSearch ? 'active' : ''} onClick={() => setIsAdvancedSearch(false)}>
          Simple Search
        </button>
        <button className={isAdvancedSearch ? 'active' : ''} onClick={() => setIsAdvancedSearch(true)}>
          Advanced Search
        </button>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        {!isAdvancedSearch ? (
          <div className="simple-search">
            <div className="filter-tabs">
              <button type="button" className={activeFilter === 'location' ? 'active' : ''} onClick={() => setActiveFilter('location')}>Location</button>
              <button type="button" className={activeFilter === 'area' ? 'active' : ''} onClick={() => setActiveFilter('area')}>Area</button>
              <button type="button" className={activeFilter === 'surveyNumber' ? 'active' : ''} onClick={() => setActiveFilter('surveyNumber')}>Survey Number</button>
              <button type="button" className={activeFilter === 'price' ? 'active' : ''} onClick={() => setActiveFilter('price')}>Price</button>
              <button type="button" className={activeFilter === 'pincode' ? 'active' : ''} onClick={() => setActiveFilter('pincode')}>Pincode</button>
            </div>
            <div className="search-box">
              <input
                type="text"
                name={activeFilter}
                value={searchParams[activeFilter]}
                onChange={handleInputChange}
                placeholder={`Enter ${activeFilter.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                className="search-input"
              />
              <button type="submit" className="search-button" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        ) : (
          <div className="advanced-search">
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" value={searchParams.location} onChange={handleInputChange} placeholder="City, State" />
              </div>
              <div className="form-group">
                <label>Area (sq. ft)</label>
                <input type="number" name="area" value={searchParams.area} onChange={handleInputChange} placeholder="Approximate area" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Survey Number</label>
                <input type="text" name="surveyNumber" value={searchParams.surveyNumber} onChange={handleInputChange} placeholder="SUR-XXX/XX" />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input type="text" name="pincode" value={searchParams.pincode} onChange={handleInputChange} placeholder="Enter area pincode" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Documents Available</label>
                <select name="hasDocuments" value={searchParams.hasDocuments} onChange={handleInputChange}>
                  <option value="any">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="form-group price-range">
                <label>Price Range (₹)</label>
                <div className="range-inputs">
                  <input type="number" name="min" value={searchParams.priceRange.min} onChange={handleInputChange} placeholder="Min" />
                  <span>to</span>
                  <input type="number" name="max" value={searchParams.priceRange.max} onChange={handleInputChange} placeholder="Max" />
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={resetSearch} className="reset-button">Reset</button>
              <button type="submit" className="search-button" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        )}
      </form>

      {renderSearchResults()}
    </div>
  );
};

export default LandSearch;
