# Remote Catalog Manager

A modern React and Node.js application for managing remote control images for Suraj Electronics.

## Features

- Upload remote control images for TV and AC products
- Take pictures with your device's camera
- Directly upload images to GitHub repository
- Automatic updates to product context files
- Modern, responsive UI

## Tech Stack

- **Frontend**: React, Bootstrap, Axios
- **Backend**: Node.js, Express
- **Storage**: GitHub API integration
- **Image Handling**: Direct uploads without local storage

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- GitHub account with a Personal Access Token (with repo scope)

### Installation

1. Clone the repository:
```
git clone https://github.com/Nishantvidhuri/remotebackend.git
cd remote-manager-app
```

2. Install dependencies for backend:
```
cd backend
npm install
```

3. Install dependencies for frontend:
```
cd ../frontend
npm install
```

4. Configure GitHub token:

Create a `.env` file in the backend directory with the following content:
```
GITHUB_TOKEN=your_github_token_here
REPO_OWNER=Nishantvidhuri
REPO_NAME=suraj-remote
PORT=5000
NODE_ENV=development
```

Replace `your_github_token_here` with your GitHub Personal Access Token.

## Running the Application

### Development Mode

1. Start the backend server (from the backend directory):
```
node server.js
```

2. Start the React frontend (from the frontend directory in a new terminal):
```
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

1. Make sure you've set up your GitHub token correctly.
2. Choose the product type (TV or AC).
3. Enter the remote name and shelf number.
4. Upload an image by either:
   - Browsing for a file
   - Taking a picture with your device's camera
5. Click "Upload to GitHub" to save the image and update the product catalog. 