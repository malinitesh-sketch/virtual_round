# 🚀 Traveloop API Quick Reference

## ✅ Status Check

### Backend Running?
```
GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Traveloop Backend API is running",
  "timestamp": "2024-05-10T10:30:45.123Z"
}
```

---

## 🔗 All Endpoints

### 🧪 Test Endpoints
```
GET /api/health          → Server status
GET /api/test            → Test connection (includes mock data)
```

### 🔐 Authentication
```
POST /api/auth/register  → Create account
POST /api/auth/login     → Login & get token
```

### ✈️ Trips (Main Feature)
```
GET /api/trips           → Get all user's trips
POST /api/trips          → Create new trip
GET /api/trips/:id       → Get specific trip
PUT /api/trips/:id       → Update trip
DELETE /api/trips/:id    → Delete trip
```

### 🎯 Activities
```
GET /api/activities      → Get activities
POST /api/activities     → Create activity
DELETE /api/activities/:id → Delete activity
```

### 👤 User Profile
```
GET /api/user/profile    → Get current user info
PUT /api/user/profile    → Update user profile
```

---

## 📤 Test with Browser or Postman

### GET Requests (Open in Browser)
```
http://localhost:5000/api/health
http://localhost:5000/api/test
http://localhost:5000/api/trips
http://localhost:5000/api/user/profile
```

### POST/PUT/DELETE Requests (Use Postman)
1. Download **Postman** from postman.com
2. Create new request
3. Set method (POST, PUT, DELETE)
4. Set URL: `http://localhost:5000/api/...`
5. Body → raw → JSON
6. Paste request body (see below)
7. Send

---

## 📝 Request Examples

### Create Trip
```
POST http://localhost:5000/api/trips

Body:
{
  "title": "Paris Adventure",
  "destination": "Paris, France",
  "startDate": "2024-06-01",
  "endDate": "2024-06-10",
  "budget": 5000
}
```

### Login User
```
POST http://localhost:5000/api/auth/login

Body:
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Register User
```
POST http://localhost:5000/api/auth/register

Body:
{
  "name": "James A.",
  "email": "james@example.com",
  "password": "password123"
}
```

### Update Profile
```
PUT http://localhost:5000/api/user/profile

Body:
{
  "name": "James Anderson",
  "bio": "Travel enthusiast",
  "location": "San Francisco"
}
```

### Create Activity
```
POST http://localhost:5000/api/activities

Body:
{
  "tripId": 1,
  "title": "Visit Eiffel Tower",
  "description": "See the iconic tower",
  "date": "2024-06-02",
  "cost": 25,
  "category": "sightseeing"
}
```

### Delete Trip
```
DELETE http://localhost:5000/api/trips/1
```

---

## 🔑 Response Format

### Success Response (201 Created)
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "Paris Adventure",
    "destination": "Paris, France"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Invalid request data",
  "message": "Title is required",
  "timestamp": "2024-05-10T10:30:45.123Z"
}
```

---

## 💡 Common Issues

| Problem | Solution |
|---------|----------|
| Backend returns 404 | Check endpoint URL is correct |
| Backend returns 500 | Check terminal for error message |
| CORS error in browser | Add origin to CORS in server.js |
| Connection refused | Backend not running? Run `npm run dev` |
| Response is empty | Endpoint returns placeholder - implement it |

---

## 🎯 Implementation Checklist

### For Each Endpoint, You Need:

- [ ] **Model**: Database schema (what data to store)
- [ ] **Controller**: Business logic (what to do with data)
- [ ] **Route**: Connect endpoint to controller
- [ ] **Validation**: Check input is correct
- [ ] **Error Handling**: Return proper error messages
- [ ] **Database**: Save/read data from MongoDB

---

## 📚 Tools for Testing

### Browser Console (Frontend API Testing)
```javascript
// Open browser DevTools: F12
// Go to Console tab
// Test API:

await fetchTrips();
await fetchTripById(1);
await createTrip({ title: 'Test', destination: 'NYC' });
```

### Postman (Full API Testing)
- Download: https://www.postman.com/downloads/
- Great for testing all methods (GET, POST, PUT, DELETE)
- Can save requests for reuse
- Shows headers, body, response

### Thunder Client (VSCode Extension)
- Install in VSCode
- Test APIs directly in editor
- Similar to Postman but lighter

---

## 🌐 Frontend Integration

### In any HTML file:
```html
<script src="api-client.js"></script>

<script>
  // Fetch and display trips
  async function showTrips() {
    const data = await fetchTrips();
    console.log('Trips:', data.trips);
  }
  
  showTrips();
</script>
```

---

## 🔧 Common Edits

### Add New Endpoint
```javascript
// In backend/server.js

app.get('/api/new-route', (req, res) => {
  res.json({ message: 'Your response here' });
});
```

### Call New Endpoint from Frontend
```javascript
// In api-client.js

async function myNewFunction() {
  return apiCall('/new-route', { method: 'GET' });
}
```

### Use in HTML
```javascript
// In frontend HTML

const result = await myNewFunction();
```

---

## 🚀 Next: Database

1. Install MongoDB
2. Update `.env` with database URL
3. Create model files
4. Connect endpoints to database

---

**Backend URL:** http://localhost:5000  
**API Base:** http://localhost:5000/api  
**Status:** ✅ Running and ready to expand!
