// Import required modules
const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// Create an instance of the Express application
const app = express();

// Set the port number for the server
const port = process.env.PORT || 3000;

// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// Serve static files from the "public" directory
app.use(express.static('public'));

// Define the "/upload" endpoint to handle file uploads
app.post('/upload', upload.array('files'), (req, res) => {
  const files = req.files;
  
  if (!files) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }
  
  const fileNames = files.map((file) => file.filename);
  
  res.json({
    message: 'Files uploaded successfully',
    fileNames: fileNames
  });
});

// Define the "/search" endpoint to handle text searches
// Define the "/search" endpoint to handle text searches
app.get('/search', (req, res) => {
  const query = req.query.q;

  if (!query) {
      const error = new Error('Please provide a search query');
      error.httpStatusCode = 400;
      return next(error);
  }

  const searchFile = (fileName) => {
      return new Promise((resolve, reject) => {
          if (path.extname(fileName) === '.docx') {
              const filePath = path.join('uploads/', fileName);

              mammoth.extractRawText({ path: filePath })
                  .then((result) => {
                      const content = result.value;
                      const lines = content.split('\n');
                      const fileResults = [];

                      lines.forEach((line, index) => {
                          if (line.includes(query)) {
                              fileResults.push({
                                  content: line.trim(),
                                  lineNumber: index + 1,
                                  name: fileName
                              });
                          }
                      });

                      resolve(fileResults);
                  })
                  .catch(reject);
          } else {
              resolve([]);
          }
      });
  };

  fs.promises.readdir('uploads/')
      .then(files => {
          return Promise.all(files.map(searchFile));
      })
      .then(resultsArrays => {
          // Flatten the results arrays into a single array
          const results = [].concat(...resultsArrays);
          res.json(results);
      })
      .catch(error => {
          console.error(error);
          res.status(500).send('Error processing files');
      });
});

// Define the "/delete" endpoint to handle file deletions
app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = `./uploads/${filename}`;
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error deleting file');
    } else {
      console.log('File deleted successfully');
      res.send('File deleted successfully');
    }
  });
});

// Start the server and listen for incoming requests
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});