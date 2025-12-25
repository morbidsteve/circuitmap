#!/usr/bin/env node
/**
 * Generate PWA icons from SVG source
 * Run: node scripts/generate-icons.js
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sizes = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  try {
    // Try to use sharp
    const sharp = require('sharp');

    console.log('Generating icons using sharp...');

    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  Generated: icon-${size}x${size}.png`);
    }

    console.log('\nAll icons generated successfully!');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('sharp not found, trying ImageMagick...');

      try {
        // Try ImageMagick using safe execFileSync
        for (const size of sizes) {
          const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
          execFileSync('convert', [
            '-background', 'none',
            '-resize', `${size}x${size}`,
            svgPath,
            outputPath
          ], { stdio: 'pipe' });
          console.log(`  Generated: icon-${size}x${size}.png`);
        }
        console.log('\nAll icons generated successfully using ImageMagick!');
      } catch (imgErr) {
        console.log('\nImageMagick not found. Please install one of:');
        console.log('  - npm install sharp');
        console.log('  - brew install imagemagick (macOS)');
        console.log('  - apt install imagemagick (Linux)');
        console.log('\nOr manually convert the SVG at public/icons/icon.svg to PNG files.');
        process.exit(1);
      }
    } else {
      throw err;
    }
  }
}

generateIcons().catch(console.error);
