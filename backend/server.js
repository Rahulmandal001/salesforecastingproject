const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up multer for file uploading
const upload = multer({ dest: 'uploads/' });

// Serve static files (e.g., frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Create 'uploads' directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Endpoint to handle the CSV upload
app.post('/upload', upload.single('salesData'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, req.file.path);
  const results = [];

  // Parse the CSV file and extract sales data
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('headers', (headers) => {
      // Log headers to check for any extra spaces or case mismatches
      const cleanedHeaders = headers.map(header => header.trim());
      console.log('Cleaned CSV Headers:', cleanedHeaders);  // Log cleaned headers
    })
    .on('data', (row) => {
      // Log the row to check the parsed data
      console.log('Parsed row:', row);

      // Clean up the row by trimming extra spaces in row keys
      const cleanedRow = {};
      for (let key in row) {
        cleanedRow[key.trim()] = row[key];  // Trim any extra spaces in row keys
      }

      // Ensure 'Date' and 'Sales' exist and push the data to the results array
      results.push({
        date: cleanedRow.Date,  // Access 'Date' after trimming spaces
        sales: parseFloat(cleanedRow.Sales)  // Access 'Sales' after trimming spaces
      });
    })
    .on('end', () => {
      // Log the parsed results
      console.log('Parsed results:', results);

      // Simulate sales forecasting logic here
      const predictedSales = forecastSales(results);

      // Return the processed data
      res.json({
        dates: results.map(row => row.date),  // Send dates as part of the response
        predictions: predictedSales           // Send predicted sales as part of the response
      });

      // Clean up the uploaded file
      fs.unlinkSync(filePath);
    });
});

// Simulated sales forecasting function
function forecastSales(data) {
  // Basic logic to "predict" sales (for simplicity, add a 10% growth)
  return data.map(row => row.sales * 1.10);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
