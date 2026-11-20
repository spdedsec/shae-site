/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

/**
 * Shae Package Registry Schema & Archive Integrity Verifier
 * Validates:
 * 1. Package Index JSON schema (name, description, latest, versions)
 * 2. Version metadata schema (version, download_url, checksum, dependencies)
 * 3. .shaepkg archive magic header (exactly 8 bytes: SHAEPKG1)
 * 4. .shaepkg gzip payload decompression validity
 * 5. SHA-256 integrity match between archive bytes and package index checksum
 */

export const SHAEPKG_MAGIC = Buffer.from('SHAEPKG1');
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
const PKG_NAME_REGEX = /^[a-z0-9][a-z0-9-_]*$/;
const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

export function createReferencePackage(name = 'shae-math', version = '0.2.0') {
  // Create dummy package content and compress with gzip
  const tarballPayload = Buffer.from('mock tar archive for ' + name + ' v' + version);
  const gzipped = zlib.gzipSync(tarballPayload);
  const archiveBytes = Buffer.concat([SHAEPKG_MAGIC, gzipped]);
  const checksum = crypto.createHash('sha256').update(archiveBytes).digest('hex');

  const indexJson = {
    name,
    description: 'High-performance vector and matrix math library for Shae',
    latest: version,
    versions: {
      [version]: {
        version,
        download_url: '/downloads/' + name + '-' + version + '.shaepkg',
        checksum,
        dependencies: {},
        author: 'Shae Core Team',
        license: 'MIT',
      },
    },
  };

  return {
    indexJson,
    archiveBytes,
    checksum,
  };
}

export function validatePackageIndexSchema(pkg, filename = 'index.json') {
  const errors = [];

  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    return { valid: false, errors: ['[' + filename + '] Package index must be a JSON object'] };
  }

  // 1. Name validation
  if (typeof pkg.name !== 'string' || !PKG_NAME_REGEX.test(pkg.name)) {
    errors.push('[' + filename + '] Invalid or missing "name" field: must match ' + PKG_NAME_REGEX);
  }

  // 2. Description validation
  if (typeof pkg.description !== 'string' || pkg.description.trim() === '') {
    errors.push('[' + filename + '] Missing or empty "description" field');
  }

  // 3. Latest version validation
  if (typeof pkg.latest !== 'string' || !SEMVER_REGEX.test(pkg.latest)) {
    errors.push('[' + filename + '] Invalid "latest" version: "' + pkg.latest + '" does not conform to SemVer');
  }

  // 4. Versions map validation
  if (!pkg.versions || typeof pkg.versions !== 'object' || Array.isArray(pkg.versions)) {
    errors.push('[' + filename + '] Missing or invalid "versions" map');
  } else {
    const versionKeys = Object.keys(pkg.versions);
    if (versionKeys.length === 0) {
      errors.push('[' + filename + '] "versions" map must contain at least one version entry');
    }

    if (pkg.latest && !pkg.versions[pkg.latest]) {
      errors.push('[' + filename + '] "latest" version "' + pkg.latest + '" not present in "versions" map');
    }

    for (const [verKey, verData] of Object.entries(pkg.versions)) {
      if (!SEMVER_REGEX.test(verKey)) {
        errors.push('[' + filename + '] Version key "' + verKey + '" is not valid SemVer');
      }
      if (!verData || typeof verData !== 'object') {
        errors.push('[' + filename + '] Version metadata for "' + verKey + '" must be an object');
        continue;
      }
      if (verData.version !== verKey) {
        errors.push('[' + filename + '] Version mismatch: key is "' + verKey + '" but metadata.version is "' + verData.version + '"');
      }
      if (typeof verData.download_url !== 'string' || !verData.download_url.endsWith('.shaepkg')) {
        errors.push('[' + filename + '] Version "' + verKey + '" download_url must be string ending with .shaepkg');
      }
      if (typeof verData.checksum !== 'string' || !SHA256_HEX_REGEX.test(verData.checksum)) {
        errors.push('[' + filename + '] Version "' + verKey + '" checksum must be 64-character lowercase SHA-256 hex string');
      }
      if (verData.dependencies !== undefined && (typeof verData.dependencies !== 'object' || Array.isArray(verData.dependencies))) {
        errors.push('[' + filename + '] Version "' + verKey + '" dependencies must be an object');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateShaepkgArchive(buffer, expectedChecksum, filename = 'archive.shaepkg') {
  const errors = [];
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  // 1. Size check
  if (buf.length < 10) {
    errors.push('[' + filename + '] Archive size too small (' + buf.length + ' bytes, minimum 10 bytes)');
    return { valid: false, errors };
  }

  // 2. Magic header: exactly SHAEPKG1
  const magic = buf.subarray(0, 8);
  if (!magic.equals(SHAEPKG_MAGIC)) {
    errors.push(
      '[' + filename + '] Magic header mismatch: expected "SHAEPKG1" (0x53484145504b4731), got "' + magic.toString('utf8') + '"'
    );
  }

  // 3. Gzip payload check
  if (buf[8] !== 0x1f || buf[9] !== 0x8b) {
    errors.push('[' + filename + '] Gzip magic header mismatch at offset 8: expected 0x1F8B, got 0x' + buf.readUInt16BE(8).toString(16));
  } else {
    try {
      zlib.gunzipSync(buf.subarray(8));
    } catch (gzErr) {
      errors.push('[' + filename + '] Failed to decompress gzip archive payload: ' + gzErr.message);
    }
  }

  // 4. SHA-256 checksum check
  const computedHash = crypto.createHash('sha256').update(buf).digest('hex');
  if (expectedChecksum && computedHash !== expectedChecksum.toLowerCase()) {
    errors.push(
      '[' + filename + '] Checksum mismatch: expected ' + expectedChecksum + ', computed ' + computedHash
    );
  }

  return {
    valid: errors.length === 0,
    computedChecksum: computedHash,
    errors,
  };
}

// Self-Test & File Verification Runner
async function main() {
  console.log('📦 Shae Central Package Registry Schema & Archive Verifier\n');

  let passed = 0;
  let failed = 0;

  // 1. Reference package schema & archive verification
  console.log('1. Verifying Reference Package Schema & Archive...');
  const refPkg = createReferencePackage('shae-math', '0.2.0');
  const schemaRes = validatePackageIndexSchema(refPkg.indexJson, 'reference_index.json');
  if (schemaRes.valid) {
    console.log('   ✓ Reference package JSON schema valid');
    passed++;
  } else {
    console.error('   ✗ Reference package JSON schema failed:');
    for (const err of schemaRes.errors) console.error('     - ' + err);
    failed++;
  }

  const archiveRes = validateShaepkgArchive(refPkg.archiveBytes, refPkg.checksum, 'reference.shaepkg');
  if (archiveRes.valid) {
    console.log('   ✓ Reference .shaepkg archive magic header (SHAEPKG1) and checksum verified\n');
    passed++;
  } else {
    console.error('   ✗ Reference .shaepkg archive validation failed:');
    for (const err of archiveRes.errors) console.error('     - ' + err);
    failed++;
  }

  // 2. Corner cases & rejection testing
  console.log('2. Verifying Negative Corner Cases Rejection...');
  // Missing required fields
  const missingFieldRes = validatePackageIndexSchema({ name: 'bad-pkg' }, 'missing_field.json');
  if (!missingFieldRes.valid) {
    console.log('   ✓ Missing required fields correctly rejected');
    passed++;
  } else {
    console.error('   ✗ Missing required fields was unexpectedly accepted!');
    failed++;
  }

  // Invalid SemVer
  const badSemverRes = validatePackageIndexSchema({
    name: 'bad-semver',
    description: 'test',
    latest: 'v1.0',
    versions: { 'v1.0': { version: 'v1.0', download_url: '/downloads/bad.shaepkg', checksum: 'a'.repeat(64), dependencies: {} } },
  }, 'bad_semver.json');
  if (!badSemverRes.valid) {
    console.log('   ✓ Non-SemVer version string correctly rejected');
    passed++;
  } else {
    console.error('   ✗ Non-SemVer version string was unexpectedly accepted!');
    failed++;
  }

  // Checksum mismatch
  const tamperedArchive = Buffer.from(refPkg.archiveBytes);
  tamperedArchive[tamperedArchive.length - 1] ^= 0xff; // flip bit
  const tamperedRes = validateShaepkgArchive(tamperedArchive, refPkg.checksum, 'tampered.shaepkg');
  if (!tamperedRes.valid) {
    console.log('   ✓ Tampered archive checksum mismatch correctly caught');
    passed++;
  } else {
    console.error('   ✗ Tampered archive was unexpectedly accepted!');
    failed++;
  }

  // Bad magic header
  const badMagicArchive = Buffer.from(refPkg.archiveBytes);
  badMagicArchive.write('BADMAGIC', 0);
  const badMagicRes = validateShaepkgArchive(badMagicArchive, undefined, 'bad_magic.shaepkg');
  if (!badMagicRes.valid) {
    console.log('   ✓ Invalid archive magic header correctly caught\n');
    passed++;
  } else {
    console.error('   ✗ Invalid archive magic header was unexpectedly accepted!');
    failed++;
  }

  // 3. Scan public/packages/*.json and public/downloads/*.shaepkg
  console.log('3. Scanning Repository for Package Indices and Archives...');
  const pkgDir = path.resolve('public/packages');
  const downloadsDir = path.resolve('public/downloads');

  let scannedPackages = 0;
  if (fs.existsSync(pkgDir)) {
    const files = fs.readdirSync(pkgDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        scannedPackages++;
        const filePath = path.join(pkgDir, file);
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const json = JSON.parse(raw);
          const res = validatePackageIndexSchema(json, file);
          if (res.valid) {
            console.log('   ✓ ' + file + ': schema valid');
            passed++;

            // If local archive exists, verify archive integrity
            for (const [_ver, vMeta] of Object.entries(json.versions || {})) {
              if (vMeta.download_url && vMeta.download_url.startsWith('/downloads/')) {
                const archiveName = path.basename(vMeta.download_url);
                const localArchive = path.join(downloadsDir, archiveName);
                if (fs.existsSync(localArchive)) {
                  const archBuf = fs.readFileSync(localArchive);
                  const archRes = validateShaepkgArchive(archBuf, vMeta.checksum, archiveName);
                  if (archRes.valid) {
                    console.log('     ✓ ' + archiveName + ': SHAEPKG1 magic & checksum match');
                    passed++;
                  } else {
                    console.error('     ✗ ' + archiveName + ': archive validation failed:');
                    for (const err of archRes.errors) console.error('       - ' + err);
                    failed++;
                  }
                }
              }
            }
          } else {
            console.error('   ✗ ' + file + ': schema errors:');
            for (const err of res.errors) console.error('     - ' + err);
            failed++;
          }
        } catch (err) {
          console.error('   ✗ ' + file + ': JSON parse failure: ' + err.message);
          failed++;
        }
      }
    }
  }

  if (scannedPackages === 0) {
    console.log('   (No package JSON files found on disk; reference schema & archive validated)\n');
  } else {
    console.log('\n   Scanned ' + scannedPackages + ' package index file(s).\n');
  }

  console.log('Summary: ' + passed + ' passed, ' + failed + ' failed.');
  if (failed > 0) {
    process.exit(1);
  }
}

// Run directly if invoked via node
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/verify-registry-schema.mjs')) {
  main().catch((err) => {
    console.error('Unhandled verification error:', err);
    process.exit(1);
  });
}
