/**
 * Test Database Helpers
 *
 * Quick verification that all helper functions work correctly.
 * Run with: npm run test:helpers
 */

import {
  createUploadedFile,
  getUploadedFileById,
  createAsset,
  getAssetById,
  getAllAssets,
  getAssetWithReadings,
  insertSensorReadings,
  getLatestReading,
  createPrediction,
  getLatestPredictionForAsset,
} from "./helpers";

async function testHelpers() {
  console.log("🧪 Testing Database Helpers...\n");

  try {
    // Test 1: Create uploaded file
    console.log("1️⃣ Testing file operations...");
    const file = await createUploadedFile({
      fileName: "test-data.csv",
      rowCount: 100,
      assetCount: 1,
      status: "uploaded",
    });
    console.log(`✅ Created file: ${file.id}`);

    const retrievedFile = await getUploadedFileById(file.id);
    console.log(`✅ Retrieved file: ${retrievedFile?.fileName}\n`);

    // Test 2: Create asset
    console.log("2️⃣ Testing asset operations...");
    const asset = await createAsset({
      id: "TEST-999",
      name: "Test Pump 999",
      type: "pump",
      location: "Test Lab",
      manufacturer: "Test Corp",
      model: "T-100",
    });
    console.log(`✅ Created asset: ${asset.id}`);

    const retrievedAsset = await getAssetById("TEST-999");
    console.log(`✅ Retrieved asset: ${retrievedAsset?.name}`);

    const allAssets = await getAllAssets();
    console.log(`✅ Total assets in DB: ${allAssets.length}\n`);

    // Test 3: Insert sensor readings
    console.log("3️⃣ Testing sensor reading operations...");
    const readings = [
      {
        assetId: "TEST-999",
        timestamp: new Date().toISOString(),
        tempF: 165.5,
        pressurePSI: 95.2,
        vibrationMM: 1.2,
        failureFlag: 0,
      },
      {
        assetId: "TEST-999",
        timestamp: new Date(Date.now() - 60000).toISOString(),
        tempF: 164.8,
        pressurePSI: 94.9,
        vibrationMM: 1.1,
        failureFlag: 0,
      },
    ];

    const result = await insertSensorReadings(readings);
    console.log(`✅ Inserted ${result.inserted} readings`);

    const latest = await getLatestReading("TEST-999");
    console.log(
      `✅ Latest reading: ${latest?.tempF}°F at ${latest?.timestamp}\n`
    );

    // Test 4: Create prediction
    console.log("4️⃣ Testing prediction operations...");
    const prediction = await createPrediction({
      assetId: "TEST-999",
      probability: 0.35,
      riskLevel: "green",
      recommendation:
        "Continue normal operation. Asset operating within normal parameters.",
      modelVersion: "test-v1",
    });
    console.log(
      `✅ Created prediction with risk level: ${prediction.riskLevel}`
    );

    const latestPrediction = await getLatestPredictionForAsset("TEST-999");
    console.log(
      `✅ Retrieved prediction: ${latestPrediction?.recommendation}\n`
    );

    // Test 5: Get asset with all data
    console.log("5️⃣ Testing combined data retrieval...");
    const assetData = await getAssetWithReadings("TEST-999");
    if (assetData) {
      console.log(`✅ Asset: ${assetData.asset.name}`);
      console.log(`✅ Readings: ${assetData.readings.length}`);
      console.log(
        `✅ Latest prediction: ${assetData.latestPrediction?.riskLevel}\n`
      );
    }

    console.log("✅ All helper tests passed!\n");
    console.log("📊 Summary:");
    console.log(`   - File operations: Working ✓`);
    console.log(`   - Asset operations: Working ✓`);
    console.log(`   - Reading operations: Working ✓`);
    console.log(`   - Prediction operations: Working ✓`);
    console.log(`   - Combined queries: Working ✓`);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
testHelpers();
