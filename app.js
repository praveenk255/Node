const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const app = express();
const port = 3000;

// Middleware
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Flight data file
const flightsFile = path.join(__dirname, "flights.json");

// Multer setup for Excel file upload (assumes .csv for simplicity)
const upload = multer({ dest: "uploads/" });

// Route: Main page
app.get("/", (req, res) => {
  const flights = JSON.parse(fs.readFileSync(flightsFile, "utf-8"));
  res.render("index", { flights });
});

// Route: Flight data management page
app.get("/manage", (req, res) => {
  const flights = JSON.parse(fs.readFileSync(flightsFile, "utf-8"));
  res.render("flight-management", { flights });
});

// API: Add or edit a flight
app.post("/add-flight", (req, res) => {
  let flights = JSON.parse(fs.readFileSync(flightsFile, "utf-8"));
  const { flightNumber, std, sta } = req.body;

  const existingIndex = flights.findIndex(f => f.flightNumber === flightNumber);

  if (existingIndex >= 0) {
    flights[existingIndex] = { flightNumber, std, sta };
  } else {
    flights.push({ flightNumber, std, sta });
  }

  fs.writeFileSync(flightsFile, JSON.stringify(flights, null, 2));
  res.redirect("/manage");
});

// API: Delete a flight
app.post("/delete-flight", (req, res) => {
  let flights = JSON.parse(fs.readFileSync(flightsFile, "utf-8"));
  flights = flights.filter(f => f.flightNumber !== req.body.flightNumber);
  fs.writeFileSync(flightsFile, JSON.stringify(flights, null, 2));
  res.redirect("/manage");
});

// API: Upload Excel file
app.post("/upload-excel", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  const csv = fs.readFileSync(filePath, "utf-8");
  const rows = csv.split("\n").slice(1); // Skip header
  const flights = rows.map(row => {
    const [flightNumber, std, sta] = row.split(",");
    return { flightNumber: flightNumber.trim(), std: std.trim(), sta: sta.trim() };
  });

  fs.writeFileSync(flightsFile, JSON.stringify(flights, null, 2));
  fs.unlinkSync(filePath); // Delete the uploaded file
  res.redirect("/manage");
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
