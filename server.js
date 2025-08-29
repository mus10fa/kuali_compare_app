// server.js - Backend API for your existing MongoDB structure
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection - Update with your connection string
const MONGODB_URI = "";
const DATABASE_NAME = "kuali";

let db;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('✅ Connected to MongoDB');
    db = client.db(DATABASE_NAME);
  })
  .catch(error => console.error('❌ MongoDB connection error:', error));

// GET /api/collections - Get list of all course collections
app.get('/api/collections', async (req, res) => {
  try {
    // Get all collections in the database
    const collections = await db.listCollections().toArray();
    
    // Filter for course collections (starting with "courses_")
    const courseCollections = collections.filter(col => 
      col.name.startsWith('courses_') && col.name.match(/^courses_\d{8}_\d{4}$/)
    );
    
    // Get document count for each collection
    const collectionsWithCounts = await Promise.all(
      courseCollections.map(async (col) => {
        const count = await db.collection(col.name).countDocuments();
        return {
          name: col.name,
          documentCount: count,
          type: col.type || 'collection'
        };
      })
    );
    
    console.log(`📊 Found ${collectionsWithCounts.length} course collections`);
    res.json(collectionsWithCounts);
    
  } catch (error) {
    console.error('❌ Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// GET /api/collections/:name - Get all documents from a specific collection
app.get('/api/collections/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Validate collection name format
    if (!name.match(/^courses_\d{8}_\d{4}$/)) {
      return res.status(400).json({ error: 'Invalid collection name format' });
    }
    
    // Check if collection exists
    const collections = await db.listCollections({ name }).toArray();
    if (collections.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    // Get all documents from the collection
    const courses = await db.collection(name).find({}).toArray();
    
    console.log(`📚 Retrieved ${courses.length} courses from ${name}`);
    res.json(courses);
    
  } catch (error) {
    console.error('❌ Error fetching collection data:', error);
    res.status(500).json({ error: 'Failed to fetch collection data' });
  }
});

// GET /api/collections/:name/stats - Get statistics for a specific collection
app.get('/api/collections/:name/stats', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name.match(/^courses_\d{12}$/)) {
      return res.status(400).json({ error: 'Invalid collection name format' });
    }
    
    const collection = db.collection(name);
    
    // Get various statistics
    const [
      totalCourses,
      coursesWithOutcomes,
      subjectCodes,
      sampleCourse
    ] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ outcomes: { $exists: true, $ne: [] } }),
      collection.distinct('subjectCode'),
      collection.findOne({}, { limit: 1 })
    ]);
    
    res.json({
      collectionName: name,
      totalCourses,
      coursesWithOutcomes,
      coursesWithoutOutcomes: totalCourses - coursesWithOutcomes,
      subjectCodes: subjectCodes.sort(),
      subjectCodeCount: subjectCodes.length,
      sampleCourse: sampleCourse ? {
        code: sampleCourse.code,
        title: sampleCourse.title,
        subjectCode: sampleCourse.subjectCode,
        outcomeCount: sampleCourse.outcomes ? sampleCourse.outcomes.length : 0
      } : null
    });
    
  } catch (error) {
    console.error('❌ Error fetching collection stats:', error);
    res.status(500).json({ error: 'Failed to fetch collection statistics' });
  }
});

// GET /api/search - Search across all collections
app.get('/api/search', async (req, res) => {
  try {
    const { q, collection } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    let collectionsToSearch = [];
    
    if (collection) {
      // Search in specific collection
      collectionsToSearch = [collection];
    } else {
      // Search in all course collections
      const allCollections = await db.listCollections().toArray();
      collectionsToSearch = allCollections
        .filter(col => col.name.startsWith('courses_'))
        .map(col => col.name);
    }
    
    const searchResults = [];
    
    for (const colName of collectionsToSearch) {
      const results = await db.collection(colName).find({
        $or: [
          { code: { $regex: q, $options: 'i' } },
          { title: { $regex: q, $options: 'i' } },
          { subjectCode: { $regex: q, $options: 'i' } }
        ]
      }).limit(50).toArray();
      
      results.forEach(course => {
        searchResults.push({
          ...course,
          collection: colName
        });
      });
    }
    
    res.json({
      query: q,
      totalResults: searchResults.length,
      results: searchResults
    });
    
  } catch (error) {
    console.error('❌ Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.admin().ping();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: DATABASE_NAME,
      connected: true
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: error.message,
      connected: false
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('✅ Connected to MongoDB');
    db = client.db(DATABASE_NAME);

    // Start the server after DB is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API endpoints:`);
      console.log(`   GET  /api/collections`);
      console.log(`   GET  /api/collections/:name`);
      console.log(`   GET  /api/collections/:name/stats`);
      console.log(`   GET  /api/search?q=term`);
      console.log(`   GET  /api/health`);
      console.log(`\n🔗 Frontend should connect to: http://localhost:${PORT}/api`);
    });
  })
  .catch(error => console.error('❌ MongoDB connection error:', error));

