# 🚀 Traveloop Backend Setup Guide

## Quick Start

### 1️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- **Express** - Web framework
- **CORS** - Cross-origin requests (frontend communication)
- **dotenv** - Environment variables
- **MongoDB driver** - Database
- **JWT** - Authentication
- **Nodemon** - Auto-reload during development

### 2️⃣ Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║     Traveloop Backend API              ║
║     Running on port 5000               ║
║     Travel Beyond Gravity ✈️            ║
╚════════════════════════════════════════╝
```

### 3️⃣ Test the Backend Connection

Open your browser and visit:
- **Health Check**: http://localhost:5000/api/health
- **Test Endpoint**: http://localhost:5000/api/test

### 4️⃣ View Frontend with Backend

Open the frontend:
- **File method**: Open `frontend/index.html` in your browser
- **Live Server**: Open with VSCode's Live Server extension
- Check browser console (F12) for connection status

You should see:
```
✅ Backend connected: {message: "Backend is connected to frontend!", ...}
```

---

## 📁 Project Structure

```
Traveloop/
├── backend/
│   ├── server.js              # Main Express server
│   ├── package.json           # Dependencies
│   ├── .env                   # Environment variables
│   ├── routes/                # API endpoints
│   ├── controllers/           # Business logic
│   ├── models/                # Database schemas
│   └── middleware/            # Custom middleware
│
└── frontend/
    ├── index.html             # Dashboard
    ├── api-client.js          # API communication helper
    ├── style.css              # Styling
    └── [other pages]          # Trip, activity, profile pages
```

---

## 🔌 Available API Endpoints

### Health & Test
- `GET /api/health` - Server health check
- `GET /api/test` - Test backend connection

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Trips
- `GET /api/trips` - Get all trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/:id` - Get trip details
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

### Activities
- `GET /api/activities` - Get activities
- `POST /api/activities` - Create activity
- `DELETE /api/activities/:id` - Delete activity

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

---

## 💻 Using with Blackbox Copilot

### Installation
1. Install Blackbox extension in VSCode
2. Open command palette: `Ctrl+Shift+P`
3. Search for "Blackbox"

### Features
- **Code Completion**: Start typing and Blackbox suggests code
- **Bug Detection**: Hover over code to find issues
- **Code Generation**: Ask in comments what code you need
- **Search**: Find similar code patterns across codebase

### Example Usage

**In `backend/server.js` or any file:**

```javascript
// TODO: Create a route to fetch all user trips from database
```

Blackbox will suggest the implementation!

---

## 📝 Using Frontend API Client

### Import in any HTML file

```html
<script src="api-client.js"></script>
```

### Usage Examples

**Fetch trips:**
```javascript
async function loadTrips() {
  try {
    const data = await fetchTrips();
    console.log('My trips:', data.trips);
  } catch (error) {
    console.error('Error loading trips:', error);
  }
}
```

**Create trip:**
```javascript
async function addTrip() {
  const tripData = {
    title: 'Paris Adventure',
    destination: 'Paris, France',
    startDate: '2024-06-01',
    endDate: '2024-06-10',
    budget: 5000
  };
  
  try {
    const newTrip = await createTrip(tripData);
    console.log('Trip created:', newTrip);
  } catch (error) {
    console.error('Error creating trip:', error);
  }
}
```

**Update user profile:**
```javascript
async function updateProfile() {
  const userData = {
    name: 'James A.',
    email: 'james@example.com',
    bio: 'Travel enthusiast'
  };
  
  try {
    const updated = await updateUserProfile(userData);
    console.log('Profile updated:', updated);
  } catch (error) {
    console.error('Error updating profile:', error);
  }
}
```

---

## 🔐 Environment Variables

Edit `backend/.env`:

```
PORT=5000                              # Server port
MONGODB_URI=mongodb://localhost:27017/traveloop  # Database
JWT_SECRET=your_jwt_secret_key_here    # Change this!
NODE_ENV=development                   # dev or production
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process (if needed)
taskkill /PID <PID> /F
```

### CORS error when calling API
- Ensure backend is running on `http://localhost:5000`
- Check `CORS_ORIGINS` in server.js includes your frontend URL

### API client shows errors
1. Open browser DevTools (F12)
2. Check Console tab for error messages
3. Verify backend endpoint matches API_BASE_URL in `api-client.js`

### Frontend doesn't connect to backend
1. Start backend first: `npm run dev` (in backend folder)
2. Wait 2 seconds for server to start
3. Reload frontend page
4. Check browser console for connection status

---

## 📚 Next Steps

1. **Set up Database**
   - Install MongoDB locally or use MongoDB Atlas (cloud)
   - Update MONGODB_URI in `.env`

2. **Implement Models**
   - Create `backend/models/Trip.js`
   - Create `backend/models/User.js`
   - Create `backend/models/Activity.js`

3. **Create Controllers**
   - Implement business logic for trips, users, activities
   - Add database queries

4. **Implement Routes**
   - Connect routes to controllers
   - Add validation and error handling

5. **Connect Frontend Forms**
   - Update form submissions to call API endpoints
   - Handle API responses and errors

---

## 🆘 Need Help?

- Check browser console (F12) for frontend errors
- Check terminal for backend errors
- Use Blackbox Copilot to suggest fixes
- Read Express documentation: https://expressjs.com

Happy coding! 🚀 Travel Beyond Gravity ✈️
