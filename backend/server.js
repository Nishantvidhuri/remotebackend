require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for direct GitHub upload
const upload = multer({ storage });

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'Nishantvidhuri';
const REPO_NAME = process.env.REPO_NAME || 'suraj-remote';
const API_BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

// GitHub API Headers
const getHeaders = () => {
  return {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json'
  };
};

// Check GitHub connection
app.get('/api/check-github', async (req, res) => {
  try {
    if (!GITHUB_TOKEN) {
      return res.json({ status: 'no_token', message: 'No GitHub Token Found' });
    }

    const response = await axios.get(API_BASE_URL, { headers: getHeaders() });
    
    if (response.status === 200) {
      return res.json({ status: 'connected', message: 'Connected to GitHub Repository' });
    } else {
      return res.json({ status: 'error', message: 'GitHub Connection Error' });
    }
  } catch (error) {
    console.error('GitHub check error:', error.message);
    return res.json({ 
      status: 'error', 
      message: `GitHub Connection Error: ${error.message}` 
    });
  }
});

// Save GitHub token
app.post('/api/save-github-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token || token.trim() === '') {
      return res.json({ success: false, message: 'Please enter a valid GitHub token' });
    }
    
    // In a production app, we would securely store this token
    // For demo purposes, we're just storing it in the environment
    process.env.GITHUB_TOKEN = token;
    
    return res.json({ success: true, message: 'GitHub token saved successfully!' });
  } catch (error) {
    console.error('Save token error:', error.message);
    return res.json({ success: false, message: `Failed to save token: ${error.message}` });
  }
});

// Handle file upload directly to GitHub
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const { productType, name, shelf } = req.body;
    
    if (!productType || !name || !shelf) {
      return res.json({ success: false, message: 'Please fill all fields' });
    }
    
    if (!req.file) {
      return res.json({ success: false, message: 'No image uploaded' });
    }
    
    // Prepare file name and paths
    const nameFormatted = name.replace(/\s+/g, '-');
    const fileExt = path.extname(req.file.originalname) || '.jpg';
    const fileName = `${nameFormatted}_${shelf}${fileExt}`;
    
    // Determine GitHub paths based on product type
    const githubFolder = productType === 'TV' ? 'public/photos' : 'public/acphoto';
    const githubFilePath = `${githubFolder}/${fileName}`;
    
    // Upload to GitHub
    const url = `${API_BASE_URL}/contents/${githubFilePath}`;
    
    // Check if file already exists
    let sha = null;
    try {
      const checkRes = await axios.get(url, { headers: getHeaders() });
      if (checkRes.status === 200) {
        sha = checkRes.data.sha;
      }
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    // Prepare data for GitHub API
    const encodedContent = req.file.buffer.toString('base64');
    
    const data = {
      message: `Add remote image for ${name}`,
      content: encodedContent
    };
    
    if (sha) {
      data.sha = sha;
    }
    
    // Upload to GitHub
    const uploadRes = await axios.put(url, data, { headers: getHeaders() });
    
    if (uploadRes.status !== 200 && uploadRes.status !== 201) {
      return res.json({
        success: false,
        message: `Failed to upload image to GitHub. Error code: ${uploadRes.status}`
      });
    }
    
    // Update product context file
    const imageFolder = productType === 'TV' ? 'photos' : 'acphoto';
    const contextFilePath = productType === 'TV' 
      ? 'src/context/ProductContext.jsx' 
      : 'src/context/ACProductContext.jsx';
    
    // Create new product entry
    const newProduct = {
      name: name,
      shelfNumber: shelf,
      image: `/${imageFolder}/${fileName}`
    };
    
    // Update context file
    const contextUpdateSuccess = await updateContextFile(productType, newProduct, contextFilePath);
    
    if (contextUpdateSuccess) {
      return res.json({
        success: true,
        message: `${productType} Remote uploaded as ${fileName} and added to GitHub repository`
      });
    } else {
      return res.json({
        success: true,
        warning: true,
        message: `${productType} Remote image uploaded to GitHub, but failed to update context file`
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.json({ success: false, message: `Error: ${error.message}` });
  }
});

// Handle webcam image upload
app.post('/api/upload-webcam', async (req, res) => {
  try {
    const { image, productType, name, shelf } = req.body;
    
    if (!image || !productType || !name || !shelf) {
      return res.json({ success: false, message: 'Missing required data' });
    }
    
    // Process base64 image
    const base64Data = image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Prepare file name and paths
    const nameFormatted = name.replace(/\s+/g, '-');
    const fileName = `${nameFormatted}_${shelf}.jpg`;
    
    // Determine GitHub paths based on product type
    const githubFolder = productType === 'TV' ? 'public/photos' : 'public/acphoto';
    const githubFilePath = `${githubFolder}/${fileName}`;
    
    // Upload to GitHub
    const url = `${API_BASE_URL}/contents/${githubFilePath}`;
    
    // Check if file already exists
    let sha = null;
    try {
      const checkRes = await axios.get(url, { headers: getHeaders() });
      if (checkRes.status === 200) {
        sha = checkRes.data.sha;
      }
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    // Prepare data for GitHub API
    const encodedContent = imageBuffer.toString('base64');
    
    const data = {
      message: `Add remote image for ${name}`,
      content: encodedContent
    };
    
    if (sha) {
      data.sha = sha;
    }
    
    // Upload to GitHub
    const uploadRes = await axios.put(url, data, { headers: getHeaders() });
    
    if (uploadRes.status !== 200 && uploadRes.status !== 201) {
      return res.json({
        success: false,
        message: `Failed to upload image to GitHub. Error code: ${uploadRes.status}`
      });
    }
    
    // Update product context file
    const imageFolder = productType === 'TV' ? 'photos' : 'acphoto';
    const contextFilePath = productType === 'TV' 
      ? 'src/context/ProductContext.jsx' 
      : 'src/context/ACProductContext.jsx';
    
    // Create new product entry
    const newProduct = {
      name: name,
      shelfNumber: shelf,
      image: `/${imageFolder}/${fileName}`
    };
    
    // Update context file
    const contextUpdateSuccess = await updateContextFile(productType, newProduct, contextFilePath);
    
    if (contextUpdateSuccess) {
      return res.json({
        success: true,
        message: `${productType} Remote uploaded as ${fileName} and added to GitHub repository`
      });
    } else {
      return res.json({
        success: true,
        warning: true,
        message: `${productType} Remote image uploaded to GitHub, but failed to update context file`
      });
    }
  } catch (error) {
    console.error('Webcam upload error:', error);
    return res.json({ success: false, message: `Error: ${error.message}` });
  }
});

async function updateContextFile(productType, newProduct, filePath) {
  try {
    // Get current file content
    const url = `${API_BASE_URL}/contents/${filePath}`;
    const response = await axios.get(url, { headers: getHeaders() });
    
    if (response.status !== 200) {
      console.error(`Failed to get ${filePath}. Status: ${response.status}`);
      return false;
    }
    
    const { content: encodedContent, sha } = response.data;
    const content = Buffer.from(encodedContent, 'base64').toString('utf-8');
    
    // Determine variable name based on product type
    const dataVarName = productType === 'TV' ? 'data' : 'acData';
    
    // Find the data array
    const dataArrayRegex = new RegExp(`const ${dataVarName} = \\[(.*?)\\];`, 's');
    const match = content.match(dataArrayRegex);
    
    if (!match) {
      console.error(`Could not find ${dataVarName} array in file`);
      return false;
    }
    
    // Extract the current data array
    const dataStr = match[1];
    
    // Create new product JSON
    const newProductStr = JSON.stringify(newProduct, null, 6);
    
    // Add the new product to the data array
    let newDataStr;
    if (dataStr.trim()) {
      // If array is not empty, add comma and new product
      newDataStr = `${dataStr},\n${newProductStr}`;
    } else {
      // If array is empty, just add the new product
      newDataStr = newProductStr;
    }
    
    // Update the content
    const newContent = content.replace(dataArrayRegex, `const ${dataVarName} = [${newDataStr}];`);
    
    // Upload updated file
    const updateData = {
      message: `Add ${newProduct.name} remote to catalog`,
      content: Buffer.from(newContent).toString('base64'),
      sha
    };
    
    const updateResponse = await axios.put(url, updateData, { headers: getHeaders() });
    
    return updateResponse.status === 200 || updateResponse.status === 201;
  } catch (error) {
    console.error('Error updating context file:', error);
    return false;
  }
}

// Serve static React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 