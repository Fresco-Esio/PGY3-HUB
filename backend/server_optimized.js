const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // For sync operations at startup
const fsp = fs.promises; // For async operations in routes

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(__dirname, 'mindmap-data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  const initialData = {
    topics: [],
    cases: [],
    tasks: [],
    literature: [],
    templates: [],
    connections: []
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

// --- Middleware ---

// CORS (Cross-Origin Resource Sharing) Configuration
// This is a critical security step. It tells the browser that it's safe
// for your frontend (running on http://localhost:3000) to make requests
// to this backend server. Without this, the browser will block the requests.
const corsOptions = {
  // For development, we can allow all origins.
  // For production, you would want to restrict this to your frontend's actual domain.
  origin: '*', 
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Explicitly handle pre-flight requests (sent by browsers for non-simple requests like POST with JSON)
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' })); // Increase limit for potentially large data files
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid overwrites
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// --- API ROUTES ---

// Get all mind map data
app.get('/api/mindmap-data', async (req, res) => {
  try {
    const data = await fsp.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading data file:', err);
    res.status(500).send('Error reading mind map data.');
  }
});

// Update all mind map data
app.put('/api/mindmap-data', async (req, res) => {
  try {
    const newData = req.body;
    await fsp.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), 'utf8');
    res.json({ message: 'Mind map data saved successfully.' });
  } catch (err) {
    console.error('Error writing data file:', err);
    res.status(500).send('Error saving mind map data.');
  }
});

// Handle PDF uploads for literature nodes
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { literatureId } = req.body;
  if (!literatureId) {
    // Clean up uploaded file if ID is missing
    await fsp.unlink(req.file.path).catch(err => console.error("Failed to clean up file:", err));
    return res.status(400).send('Literature ID is required.');
  }

  // Normalize path for URL (use forward slashes)
  const filePath = `/uploads/${req.file.filename}`;

  try {
    const data = await fsp.readFile(DATA_FILE, 'utf8');
    const mindMapData = JSON.parse(data);
    const literatureIndex = mindMapData.literature.findIndex(l => l.id === literatureId);

    if (literatureIndex > -1) {
      mindMapData.literature[literatureIndex].pdf_path = filePath;
      await fsp.writeFile(DATA_FILE, JSON.stringify(mindMapData, null, 2), 'utf8');
      res.json({ message: 'File uploaded and path saved.', filePath });
    } else {
      // Clean up uploaded file if literature item not found
      await fsp.unlink(req.file.path).catch(err => console.error("Failed to clean up file:", err));
      res.status(404).send('Literature item not found.');
    }
  } catch (error) {
    console.error('Error processing PDF upload:', error);
    // Clean up uploaded file on any processing error
    await fsp.unlink(req.file.path).catch(err => console.error("Failed to clean up file:", err));
    res.status(500).send('Error processing upload.');
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});