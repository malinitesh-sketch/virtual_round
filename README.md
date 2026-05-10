# 🌍 Traveloop - AI-Powered Travel Planning App

Welcome to **Traveloop**! Your backend is now connected to your frontend. ✈️

## ✅ What's Ready

- ✅ **Backend API** running on `http://localhost:5000`
- ✅ **Frontend** integrated with API client
- ✅ **CORS enabled** for frontend-backend communication
- ✅ **10+ API endpoints** ready to implement
- ✅ **Blackbox Copilot** integration guide included

## 🎯 Quick Start (Do This Now!)

### 1️⃣ Verify Backend is Running

```bash
# Terminal output should show:
╔════════════════════════════════════════╗
║     Traveloop Backend API              ║
║     Running on port 5000               ║
║     Travel Beyond Gravity ✈️            ║
╚════════════════════════════════════════╝
```

### 2️⃣ Test the Connection

Open your browser:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "success",
  "message": "Traveloop Backend API is running",
  "timestamp": "2024-05-10T10:30:45.123Z"
}
```

### 3️⃣ View Frontend with Backend

Open `frontend/index.html` in your browser (or use Live Server extension).

Check browser console (F12) - you should see:
```
✅ Backend connected: {message: "Backend is connected to frontend!", ...}
```

## 📂 Project Structure

```
Traveloop/
├── backend/
│   ├── server.js              # Main Express server ⭐ START HERE
│   ├── package.json           # Dependencies
│   ├── .env                   # Environment variables
│   ├── routes/                # Will hold API routes
│   ├── controllers/           # Will hold business logic
│   ├── models/                # Will hold database models
│   └── middleware/            # Custom middleware
│
├── frontend/
│   ├── index.html             # Dashboard (connected to backend ✅)
│   ├── api-client.js          # API communication helper ✅
│   ├── style.css              # Styling
│   ├── [11 more pages]        # Trip, activity, profile, etc.
│
├── SETUP_GUIDE.md             # Detailed setup instructions 📖
├── BLACKBOX_GUIDE.md          # How to use Blackbox Copilot 🤖
└── README.md                  # This file
```

## 🌐 Available API Endpoints

All endpoints return JSON and are at `http://localhost:5000/api/`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check if backend is running |
| GET | `/test` | Test frontend-backend connection |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/trips` | Get all trips |
| POST | `/trips` | Create new trip |
| GET | `/trips/:id` | Get trip details |
| PUT | `/trips/:id` | Update trip |
| DELETE | `/trips/:id` | Delete trip |
| GET | `/activities` | Get activities |
| POST | `/activities` | Create activity |
| DELETE | `/activities/:id` | Delete activity |
| GET | `/user/profile` | Get user profile |
| PUT | `/user/profile` | Update profile |

## 💻 Using Blackbox Copilot (AI Assistant)

### Install Blackbox
1. Open VSCode Extensions (`Ctrl+Shift+X`)
2. Search "Blackbox AI"
3. Click Install
4. Reload VSCode

### Expand Backend with Blackbox

Open `backend/server.js` and look for `PLACEHOLDER ROUTES` section.

Replace placeholder routes with Blackbox:

```javascript
// Example: Instead of this
app.post('/api/trips', (req, res) => {
  res.json({ message: 'Create trip endpoint' });
});

// Write this comment:
// Create a new trip in the database with title, destination, startDate, endDate, and budget
// Validate that startDate is before endDate
// Return the created trip with 201 status

// Blackbox will generate the code!
```

See **BLACKBOX_GUIDE.md** for detailed instructions.

## 🔗 Frontend API Usage

All files in `frontend/` can use these functions from `api-client.js`:

```javascript
// Fetch user trips
const trips = await fetchTrips();

// Create new trip
const newTrip = await createTrip({
  title: 'Paris Adventure',
  destination: 'Paris, France',
  startDate: '2024-06-01',
  endDate: '2024-06-10'
});

// Get user profile
const user = await fetchUserProfile();

// Update profile
await updateUserProfile({
  name: 'New Name',
  email: 'newemail@example.com'
});
```

See `frontend/api-client.js` for more functions.

## 🚀 Next Steps

### Phase 1: Database (1-2 hours)
- [ ] Install MongoDB locally or use MongoDB Atlas (cloud)
- [ ] Update `MONGODB_URI` in `backend/.env`
- [ ] Create database models in `backend/models/`

### Phase 2: Implement Backend (2-4 hours)
- [ ] Create Trip model/controller
- [ ] Create User model/controller
- [ ] Create Activity model/controller
- [ ] Implement all API endpoints
- [ ] Add authentication (JWT)
- [ ] Add input validation

### Phase 3: Connect Frontend (2-3 hours)
- [ ] Update HTML forms to call API endpoints
- [ ] Add loading states and error handling
- [ ] Display data from backend in pages
- [ ] Implement user authentication flow

### Phase 4: Advanced Features (4+ hours)
- [ ] Add file uploads (profile pictures, trip photos)
- [ ] Implement search/filter for trips and activities
- [ ] Add trip sharing between users
- [ ] Implement admin features
- [ ] Deploy to cloud (Heroku, AWS, etc.)

## 🔧 Configuration

### Change Port
Edit `backend/.env`:
```
PORT=3000
```

### Change Database
Edit `backend/.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/traveloop
```

### Update CORS Origins
Edit `backend/server.js` (cors configuration) to allow specific origins in production.

## 📖 Documentation Files

- **SETUP_GUIDE.md** - Detailed installation and setup instructions
- **BLACKBOX_GUIDE.md** - How to use Blackbox AI copilot to expand code
- **backend/server.js** - Main server file with placeholder routes
- **frontend/api-client.js** - Frontend API communication functions

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if something else is using port 5000
netstat -ano | findstr :5000
```

### Frontend can't reach backend
1. Verify backend is running (check terminal)
2. Check `API_BASE_URL` in `frontend/api-client.js` is correct
3. Clear browser cache or open in private window

### CORS errors
- Ensure `http://localhost:5500` or your URL is in CORS origins in `server.js`

### Node modules issues
```bash
cd backend
rm -r node_modules
npm install
```

## 💡 Tips

- **Use Blackbox** to generate code from comments
- **Test endpoints** in browser (GET) or Postman (POST/PUT/DELETE)
- **Check browser console** (F12) for frontend errors
- **Check terminal** for backend errors
- **Read error messages** - they often tell you exactly what's wrong

## 🎯 Development Workflow

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Open frontend
# Use VSCode Live Server or just open index.html
```

Both should run simultaneously. Backend handles API, frontend shows UI.

## 📞 Support

If something breaks:
1. Check error messages in browser console or terminal
2. Use Blackbox to suggest a fix
3. Check SETUP_GUIDE.md and BLACKBOX_GUIDE.md
4. Try restarting both backend and browser

## 🎉 You're All Set!

Your Traveloop application is ready to grow. Start by:

1. ✅ Verify backend is running on port 5000
2. 📖 Read SETUP_GUIDE.md for detailed next steps
3. 🤖 Read BLACKBOX_GUIDE.md to expand with AI
4. 💻 Start implementing database and endpoints

**Happy coding! Travel Beyond Gravity ✈️**

---

**Backend running at:** http://localhost:5000  
**Frontend location:** `c:\Users\nites\OneDrive\Desktop\Vie=rtual Round\frontend\`  
**Last updated:** May 10, 2024
