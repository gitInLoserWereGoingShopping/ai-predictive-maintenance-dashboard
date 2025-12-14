/**
 * Seed Data Generator
 *
 * This script generates realistic CSV files and populates the database
 * with sample sensor data for pumps, compressors, and motors.
 *
 * Usage: npm run db:seed
 */

import fs from "fs";
import path from "path";
import { db } from "./client";
import { assets, sensorReadings, uploadedFiles } from "./schema";

// Ensure data directories exist
const dataDir = path.join(process.cwd(), "data");
const seedsDir = path.join(dataDir, "seeds");
if (!fs.existsSync(seedsDir)) {
  fs.mkdirSync(seedsDir, { recursive: true });
}

// Asset configurations
const assetConfigs = [
  // Pumps - typically moderate temperature, high pressure
  {
    id: "PUMP-101",
    name: "Water Pump 101",
    type: "Pump",
    location: "Building A - Utility Room",
    manufacturer: "Flowserve",
    model: "MX-5000",
    baseTemp: 165,
    tempVariance: 8,
    basePressure: 95,
    pressureVariance: 5,
    baseVibration: 1.2,
    vibrationVariance: 0.3,
    failurePoint: 850, // Readings before failure starts
  },
  {
    id: "PUMP-204",
    name: "Chemical Pump 204",
    type: "Pump",
    location: "Building B - Process Area",
    manufacturer: "Grundfos",
    model: "CR-200",
    baseTemp: 170,
    tempVariance: 10,
    basePressure: 110,
    pressureVariance: 8,
    baseVibration: 1.5,
    vibrationVariance: 0.4,
    failurePoint: 900,
  },

  // Compressors - high temperature and vibration
  {
    id: "COMP-105",
    name: "Air Compressor 105",
    type: "Compressor",
    location: "Building A - Basement",
    manufacturer: "Atlas Copco",
    model: "GA-90",
    baseTemp: 185,
    tempVariance: 12,
    basePressure: 120,
    pressureVariance: 10,
    baseVibration: 2.5,
    vibrationVariance: 0.6,
    failurePoint: 800,
  },

  // Motors - moderate all-around with gradual degradation
  {
    id: "MOTOR-307",
    name: "Primary Motor 307",
    type: "Motor",
    location: "Building A - Floor 2",
    manufacturer: "ACME Motors",
    model: "PM-5000",
    baseTemp: 175,
    tempVariance: 10,
    basePressure: 100,
    pressureVariance: 6,
    baseVibration: 1.8,
    vibrationVariance: 0.5,
    failurePoint: 750, // Earlier failure for demonstration
  },
  {
    id: "MOTOR-411",
    name: "Conveyor Motor 411",
    type: "Motor",
    location: "Building C - Production Line",
    manufacturer: "Siemens",
    model: "SM-1000",
    baseTemp: 160,
    tempVariance: 7,
    basePressure: 90,
    pressureVariance: 5,
    baseVibration: 1.0,
    vibrationVariance: 0.2,
    failurePoint: 950, // Healthy asset
  },
];

// Additional assets for CSV upload testing (NOT pre-loaded in database)
const uploadTestAssets = [
  {
    id: "PUMP-303",
    name: "Hydraulic Pump 303",
    type: "Pump",
    location: "Building D - Hydraulics Lab",
    manufacturer: "Bosch Rexroth",
    model: "A10VSO",
    baseTemp: 155,
    tempVariance: 9,
    basePressure: 130,
    pressureVariance: 12,
    baseVibration: 1.3,
    vibrationVariance: 0.35,
    failurePoint: 820, // Medium risk
  },
  {
    id: "COMP-208",
    name: "Refrigeration Compressor 208",
    type: "Compressor",
    location: "Building B - Cold Storage",
    manufacturer: "Carrier",
    model: "06E",
    baseTemp: 190,
    tempVariance: 15,
    basePressure: 140,
    pressureVariance: 15,
    baseVibration: 2.8,
    vibrationVariance: 0.8,
    failurePoint: 700, // High risk - shows early failure signs
  },
  {
    id: "MOTOR-512",
    name: "Fan Motor 512",
    type: "Motor",
    location: "Building A - HVAC Room",
    manufacturer: "WEG",
    model: "W22",
    baseTemp: 150,
    tempVariance: 6,
    basePressure: 85,
    pressureVariance: 4,
    baseVibration: 0.8,
    vibrationVariance: 0.15,
    failurePoint: 1100, // Very healthy - won't show failure in 1000 readings
  },
];

/**
 * Generate random value with normal distribution
 */
function randomNormal(mean: number, variance: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * variance;
}

/**
 * Generate sensor readings for an asset
 */
function generateReadings(
  config: (typeof assetConfigs)[0],
  count: number = 1000
) {
  const readings: Array<{
    timestamp: string;
    asset_id: string;
    tempF: number;
    pressurePSI: number;
    vibrationMM: number;
    failure_flag: number;
  }> = [];

  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Timestamp: Go backwards from now (1 reading per minute)
    const timestamp = new Date(
      now.getTime() - (count - i) * 60 * 1000
    ).toISOString();

    // Calculate degradation factor (0 = start, 1 = near failure)
    const degradation = Math.max(
      0,
      (i - config.failurePoint) / (count - config.failurePoint)
    );
    const isNearFailure = i >= config.failurePoint;

    // Base sensor values with degradation
    let tempF = randomNormal(config.baseTemp, config.tempVariance);
    let pressurePSI = randomNormal(
      config.basePressure,
      config.pressureVariance
    );
    let vibrationMM = randomNormal(
      config.baseVibration,
      config.vibrationVariance
    );

    // Apply failure patterns
    if (isNearFailure) {
      // Temperature increases dramatically
      tempF += degradation * 25 + Math.random() * 10;

      // Pressure drops (seal failures, leaks)
      pressurePSI -= degradation * 15 + Math.random() * 8;

      // Vibration increases significantly
      vibrationMM += degradation * 3 + Math.random() * 2;
    }

    // Ensure realistic bounds
    tempF = Math.max(120, Math.min(250, tempF));
    pressurePSI = Math.max(50, Math.min(150, pressurePSI));
    vibrationMM = Math.max(0.1, Math.min(8, vibrationMM));

    readings.push({
      timestamp,
      asset_id: config.id,
      tempF: Math.round(tempF * 10) / 10,
      pressurePSI: Math.round(pressurePSI * 10) / 10,
      vibrationMM: Math.round(vibrationMM * 100) / 100,
      failure_flag: isNearFailure ? 1 : 0,
    });
  }

  return readings;
}

/**
 * Write readings to CSV file
 */
function writeCSV(
  assetId: string,
  readings: ReturnType<typeof generateReadings>
) {
  const csvPath = path.join(
    seedsDir,
    `${assetId.toLowerCase()}-sensor-data.csv`
  );

  // CSV header
  const header =
    "timestamp,asset_id,tempF,pressurePSI,vibrationMM,failure_flag\n";

  // CSV rows
  const rows = readings
    .map(
      (r) =>
        `${r.timestamp},${r.asset_id},${r.tempF},${r.pressurePSI},${r.vibrationMM},${r.failure_flag}`
    )
    .join("\n");

  fs.writeFileSync(csvPath, header + rows);
  console.log(`✅ Generated: ${csvPath} (${readings.length} readings)`);

  return csvPath;
}

/**
 * Generate CSV files for upload testing (without adding to database)
 */
function generateTestCSVFiles() {
  console.log("\n📋 Generating test CSV files for manual upload...\n");

  for (const config of uploadTestAssets) {
    console.log(`📄 Creating test CSV for ${config.name} (${config.id})...`);

    // Generate readings
    const readings = generateReadings(config);

    // Write CSV file with "test-upload-" prefix
    const csvPath = path.join(
      seedsDir,
      `test-upload-${config.id.toLowerCase()}.csv`
    );

    // CSV header
    const header =
      "timestamp,asset_id,tempF,pressurePSI,vibrationMM,failure_flag\n";

    // CSV rows
    const rows = readings
      .map(
        (r) =>
          `${r.timestamp},${r.asset_id},${r.tempF},${r.pressurePSI},${r.vibrationMM},${r.failure_flag}`
      )
      .join("\n");

    fs.writeFileSync(csvPath, header + rows);
    console.log(
      `✅ Test CSV created: ${csvPath} (${readings.length} readings)`
    );
  }

  console.log("\n✅ Test CSV files ready for upload testing!\n");
}

/**
 * Main seed function
 */
async function seed() {
  console.log("🌱 Starting seed process...\n");

  try {
    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await db.delete(sensorReadings);
    await db.delete(assets);
    await db.delete(uploadedFiles);
    console.log("✅ Database cleared\n");

    // Generate data for each asset
    for (const config of assetConfigs) {
      console.log(`📊 Processing ${config.name} (${config.id})...`);

      // Insert asset
      await db.insert(assets).values({
        id: config.id,
        name: config.name,
        type: config.type,
        location: config.location,
        manufacturer: config.manufacturer,
        model: config.model,
        installationDate: "2020-01-15",
        lastMaintenanceDate: "2024-11-01",
      });

      // Generate readings
      const readings = generateReadings(config);

      // Write CSV file
      writeCSV(config.id, readings);

      // Insert readings into database
      const readingsToInsert = readings.map((r) => ({
        assetId: r.asset_id,
        timestamp: r.timestamp,
        tempF: r.tempF,
        pressurePSI: r.pressurePSI,
        vibrationMM: r.vibrationMM,
        failureFlag: r.failure_flag,
      }));

      // Insert in batches of 100 for better performance
      for (let i = 0; i < readingsToInsert.length; i += 100) {
        const batch = readingsToInsert.slice(i, i + 100);
        await db.insert(sensorReadings).values(batch);
      }

      console.log(`✅ Inserted ${readings.length} readings into database\n`);
    }

    // Create a file tracker entry
    await db.insert(uploadedFiles).values({
      id: "seed_initial",
      fileName: "initial_seed_data.csv",
      rowCount: assetConfigs.length * 1000,
      assetCount: assetConfigs.length,
      status: "processed",
    });

    console.log("✅ Seed data generation complete!\n");
    console.log("📁 CSV files created in: data/seeds/");
    console.log(`📦 Total assets: ${assetConfigs.length}`);
    console.log(`📊 Total readings: ${assetConfigs.length * 1000}`);

    // Generate test CSV files for upload testing (not in database)
    generateTestCSVFiles();

    console.log("\n🎯 Ready to test CSV upload and asset monitoring!\n");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run seed
seed();
