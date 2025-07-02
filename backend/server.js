const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });
app.use(express.static(path.join(__dirname, '../frontend')));

let pastData = [];

app.post('/upload', upload.single('salesData'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = path.join(__dirname, req.file.path);
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('headers', (headers) => {
      console.log('CSV Headers:', headers);
    })
    .on('data', (row) => {
      const cleanedRow = {};
      for (let key in row) {
        cleanedRow[key.trim()] = row[key];
      }

      results.push({
        date: cleanedRow.Date,
        sales: parseFloat(cleanedRow['Total Sales']),
        product: cleanedRow.Product,
        category: cleanedRow.Category,
        region: cleanedRow.Region,
        salesperson: cleanedRow.Salesperson,
      });
    })
    .on('end', () => {
      const predictedSales = forecastSales(results);

      pastData = [...results];

      res.json({
        dates: results.map(row => row.date),
        actualSales: results.map(row => row.sales),
        predictions: predictedSales,
        extraData: results,
      });

      fs.unlinkSync(filePath);
    });
});

function forecastSales(data) {
  return data.map(row => (row.sales * 1.10).toFixed(2)); // 10% increase
}

app.get('/past-data', (req, res) => {
  res.json({ pastData });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});