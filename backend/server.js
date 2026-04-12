const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  'https://project-tt-silk.vercel.app'
].filter(Boolean);

const io = new Server(server, {
  cors: { 
    origin: function(origin, callback) {
      if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, allowedOrigins);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const SystemSettings = require('./models/SystemSettings');

// Connect to MongoDB
connectDB().then(async () => {
  try {
    const settings = await SystemSettings.findOne();
    if (!settings) {
      await SystemSettings.create({
        timeSlots: [
          { slot: 0, label: '9:00' }, { slot: 1, label: '10:00' }, { slot: 2, label: '11:00' }, 
          { slot: 3, label: '12:00' }, { slot: 4, label: '1:00' }, { slot: 5, label: '2:00' },
          { slot: 6, label: '3:00' }, { slot: 7, label: '4:00' }
        ]
      });
      console.log('Default SystemSettings seeded');
    }
  } catch (err) {
    console.error('Failed to seed system settings', err);
  }
});

// Middleware
app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, allowedOrigins);
    }
  },
  credentials: true 
}));
app.use(express.json());

// Attach io to request for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hod', require('./routes/hod'));
app.use('/api/common', require('./routes/common'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
