const fs = require('fs-extra');
const path = require('path');

const assetsSrc = path.resolve(process.cwd(), 'src/assets');
const assetsDest = path.resolve(process.cwd(), 'dist/assets');

async function copyAssets() {
  try {
    await fs.copy(assetsSrc, assetsDest);
    console.log('✅ All assets copied to dist/assets');
  } catch (err) {
    console.error('❌ Failed to copy assets:', err);
    process.exit(1);
  }
}

copyAssets();