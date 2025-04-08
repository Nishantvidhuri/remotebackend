import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaCamera, FaImage, FaUpload, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

function App() {
  // State
  const [productType, setProductType] = useState('TV');
  const [name, setName] = useState('');
  const [shelf, setShelf] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [githubStatus, setGithubStatus] = useState({ status: 'checking', message: 'Checking GitHub connection...' });
  const [githubToken, setGithubToken] = useState('');
  const [showTokenForm, setShowTokenForm] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const mediaStreamRef = useRef(null);
  
  // Check GitHub connection on mount
  useEffect(() => {
    checkGithubConnection();
  }, []);
  
  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Check GitHub connection
  const checkGithubConnection = async () => {
    try {
      setGithubStatus({ status: 'checking', message: 'Checking GitHub connection...' });
      
      const response = await axios.get('/api/check-github');
      
      if (response.data.status === 'connected') {
        setGithubStatus({ status: 'connected', message: 'Connected to GitHub Repository' });
      } else if (response.data.status === 'no_token') {
        setGithubStatus({ status: 'no_token', message: 'GitHub Token Required' });
        setShowTokenForm(true);
      } else {
        setGithubStatus({ status: 'error', message: response.data.message });
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
      setGithubStatus({ status: 'error', message: 'Error checking GitHub connection' });
    }
  };
  
  // Save GitHub token
  const saveGithubToken = async (e) => {
    e.preventDefault();
    
    if (!githubToken.trim()) {
      showNotification('Please enter a valid GitHub token', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.post('/api/save-github-token', { token: githubToken });
      
      if (response.data.success) {
        showNotification(response.data.message, 'success');
        setShowTokenForm(false);
        checkGithubConnection();
      } else {
        showNotification(response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      showNotification('Error saving token', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Submit form with file upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !shelf.trim()) {
      showNotification('Please fill all fields', 'error');
      return;
    }
    
    if (!selectedImage) {
      showNotification('Please select an image', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('productType', productType);
      formData.append('name', name);
      formData.append('shelf', shelf);
      formData.append('image', selectedImage);
      
      const response = await axios.post('/api/upload', formData);
      
      if (response.data.success) {
        showNotification(response.data.message, 'success');
        // Reset form
        setName('');
        setShelf('');
        setSelectedImage(null);
        setPreviewImage(null);
      } else {
        showNotification(response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showNotification('Error uploading image', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    
    // Hide notification after 5 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };
  
  // Webcam functions
  const [showWebcam, setShowWebcam] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      showNotification('Error starting camera: ' + error.message, 'error');
    }
  };
  
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      if (webcamRef.current) {
        webcamRef.current.srcObject = null;
      }
    }
  };
  
  const captureImage = () => {
    if (webcamRef.current && mediaStreamRef.current) {
      const canvas = document.createElement('canvas');
      const video = webcamRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      
      // Convert to file
      canvas.toBlob((blob) => {
        const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImage(file);
        setPreviewImage(dataUrl);
      }, 'image/jpeg', 0.9);
    }
  };
  
  const openWebcam = () => {
    setShowWebcam(true);
    startCamera();
  };
  
  const closeWebcam = () => {
    stopCamera();
    setShowWebcam(false);
    setCapturedImage(null);
  };
  
  const useWebcamImage = async () => {
    closeWebcam();
  };
  
  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <h1 className="mb-0">
                <FaImage className="me-2" />
                Remote Catalog Manager
              </h1>
            </div>
            <div className="col-auto">
              <div className={`badge ${
                githubStatus.status === 'connected' ? 'bg-success' :
                githubStatus.status === 'checking' ? 'bg-info' :
                'bg-danger'
              }`}>
                {githubStatus.message}
              </div>
              {githubStatus.status !== 'connected' && (
                <button 
                  className="btn btn-sm btn-outline-light ms-2" 
                  onClick={checkGithubConnection}
                  disabled={loading}
                >
                  <FaSync className={loading ? 'spin' : ''} /> Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-4">
        {/* GitHub Token Form */}
        {showTokenForm && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">GitHub Token Required</h5>
            </div>
            <div className="card-body">
              <form onSubmit={saveGithubToken}>
                <div className="mb-3">
                  <label htmlFor="githubToken" className="form-label">
                    GitHub Personal Access Token (with repo scope)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="githubToken"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="Enter your GitHub token here"
                    required
                  />
                  <div className="form-text">
                    Generate a token with repo scope at{' '}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
                      GitHub Settings &gt; Developer settings &gt; Personal access tokens
                    </a>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Token'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Notification Banner */}
        {notification.show && (
          <div className={`notification-banner ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {/* Product Form */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Add New Remote</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  {/* Product Type Selection */}
                  <div className="mb-3">
                    <label className="form-label">Product Type</label>
                    <div className="d-flex">
                      <div className="form-check me-3">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="productType"
                          id="typeTV"
                          value="TV"
                          checked={productType === 'TV'}
                          onChange={() => setProductType('TV')}
                        />
                        <label className="form-check-label" htmlFor="typeTV">
                          TV
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="productType"
                          id="typeAC"
                          value="AC"
                          checked={productType === 'AC'}
                          onChange={() => setProductType('AC')}
                        />
                        <label className="form-check-label" htmlFor="typeAC">
                          AC
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Remote Name */}
                  <div className="mb-3">
                    <label htmlFor="remoteName" className="form-label">
                      Remote Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="remoteName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter remote name"
                      required
                    />
                  </div>
                  
                  {/* Shelf Number */}
                  <div className="mb-3">
                    <label htmlFor="shelfNumber" className="form-label">
                      Shelf Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="shelfNumber"
                      value={shelf}
                      onChange={(e) => setShelf(e.target.value)}
                      placeholder="Enter shelf number"
                      required
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div className="mb-3">
                    <label className="form-label">Image</label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FaImage className="me-2" />
                        Browse Files
                      </button>
                      <button
                        type="button"
                        className="btn btn-highlight"
                        onClick={openWebcam}
                      >
                        <FaCamera className="me-2" />
                        Take Picture
                      </button>
                      <input
                        type="file"
                        className="d-none"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                      />
                    </div>
                    <small className="text-muted mt-1 d-block">
                      Images will be uploaded directly to GitHub
                    </small>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg w-100"
                      disabled={loading || !selectedImage}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FaUpload className="me-2" />
                          Upload to GitHub
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Image Preview */}
                <div className="col-md-6">
                  <label className="form-label">Image Preview</label>
                  <div className="image-preview">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="img-fluid"
                      />
                    ) : (
                      <div className="text-center">
                        <FaImage size={48} className="mb-3 opacity-50" />
                        <p>No image selected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Webcam Modal */}
      {showWebcam && (
        <div className="modal show fade" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Take Picture</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeWebcam}
                />
              </div>
              <div className="modal-body">
                {capturedImage ? (
                  <div className="text-center">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="img-fluid mb-3"
                      style={{ maxHeight: '60vh' }}
                    />
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setCapturedImage(null)}
                      >
                        <FaTimes className="me-2" />
                        Retake
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={useWebcamImage}
                      >
                        <FaCheck className="me-2" />
                        Use This Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      className="bg-dark rounded d-flex align-items-center justify-content-center mb-3"
                      style={{ height: '60vh' }}
                    >
                      <video
                        ref={webcamRef}
                        autoPlay
                        muted
                        playsInline
                        className="img-fluid rounded"
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                      />
                    </div>
                    <div className="d-flex justify-content-center">
                      <button
                        className="btn btn-primary"
                        onClick={captureImage}
                      >
                        <FaCamera className="me-2" />
                        Capture
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </div>
  );
}

export default App;