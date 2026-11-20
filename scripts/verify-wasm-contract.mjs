/* eslint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Shae WASM Game Player Contract Specification Verifier
 * Validates:
 * 1. WebAssembly 1.0 binary header (\0asm\x01\0\0\0)
 * 2. Exported linear memory 'memory' (instance of WebAssembly.Memory, >= 64KB)
 * 3. Exported functions:
 *    - game_init() -> void
 *    - game_tick(dt: f64) -> i32
 *    - game_input(key_code: i32, is_down: i32) -> void
 *    - get_framebuffer() -> *const u32 (i32 offset in linear memory)
 *    - get_width() -> i32 (positive width)
 *    - get_height() -> i32 (positive height)
 * 4. Framebuffer memory layout (offset + width * height * 4 <= memory.byteLength)
 * 5. Lifecycle and boundary robustness (dt=0.0, dt=10.0, negative & extreme key codes)
 */

export function createReferenceWasm(width = 256, height = 240) {
  const magic = [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];

  function section(id, payload) {
    return [id, payload.length, ...payload];
  }

  // Type section: 4 type signatures
  // 0: () -> ()
  // 1: (f64) -> (i32)
  // 2: (i32, i32) -> ()
  // 3: () -> (i32)
  const typePayload = [
    0x04,
    0x60, 0x00, 0x00,
    0x60, 0x01, 0x7c, 0x01, 0x7f,
    0x60, 0x02, 0x7f, 0x7f, 0x00,
    0x60, 0x00, 0x01, 0x7f,
  ];

  // Function section: 6 functions with types [0, 1, 2, 3, 3, 3]
  const funcPayload = [
    0x06,
    0x00, 0x01, 0x02, 0x03, 0x03, 0x03,
  ];

  // Memory section: min 4 pages (256KB), no max
  const memPayload = [
    0x01,
    0x00, 0x04,
  ];

  // Helper for export strings
  const str = (s) => [s.length, ...Buffer.from(s)];
  const exportsList = [
    [...str('memory'), 0x02, 0x00],
    [...str('game_init'), 0x00, 0x00],
    [...str('game_tick'), 0x00, 0x01],
    [...str('game_input'), 0x00, 0x02],
    [...str('get_framebuffer'), 0x00, 0x03],
    [...str('get_width'), 0x00, 0x04],
    [...str('get_height'), 0x00, 0x05],
  ];

  let expPayload = [exportsList.length];
  for (const e of exportsList) expPayload.push(...e);

  // Encode integer to LEB128 unsigned for width/height in i32.const
  function toLeb128(n) {
    const bytes = [];
    let val = n;
    while (val > 0x7f) {
      bytes.push((val & 0x7f) | 0x80);
      val >>>= 7;
    }
    bytes.push(val & 0x7f);
    return bytes;
  }

  const widthLeb = toLeb128(width);
  const heightLeb = toLeb128(height);

  const code0 = [0x02, 0x00, 0x0b]; // game_init: 0 locals, end
  const code1 = [0x04, 0x00, 0x41, 0x00, 0x0b]; // game_tick: 0 locals, i32.const 0, end
  const code2 = [0x02, 0x00, 0x0b]; // game_input: 0 locals, end
  const code3 = [0x04, 0x00, 0x41, 0x00, 0x0b]; // get_framebuffer: 0 locals, i32.const 0, end
  const code4 = [widthLeb.length + 3, 0x00, 0x41, ...widthLeb, 0x0b]; // get_width: i32.const width, end
  const code5 = [heightLeb.length + 3, 0x00, 0x41, ...heightLeb, 0x0b]; // get_height: i32.const height, end

  const bodies = [code0, code1, code2, code3, code4, code5];
  let codePayload = [bodies.length];
  for (const b of bodies) codePayload.push(...b);

  return new Uint8Array([
    ...magic,
    ...section(1, typePayload),
    ...section(3, funcPayload),
    ...section(5, memPayload),
    ...section(7, expPayload),
    ...section(10, codePayload),
  ]);
}

export function verifyWasmContract(bytes, name = 'wasm_module') {
  const errors = [];
  const u8 = new Uint8Array(bytes);

  // 1. Binary header
  if (u8.length < 8) {
    errors.push('[' + name + '] Binary length too small (' + u8.length + ' bytes, minimum 8 required)');
    return { valid: false, errors };
  }
  const magic = [0x00, 0x61, 0x73, 0x6d];
  const version = [0x01, 0x00, 0x00, 0x00];
  for (let i = 0; i < 4; i++) {
    if (u8[i] !== magic[i]) {
      errors.push('[' + name + '] Invalid magic byte at ' + i + ': expected 0x' + magic[i].toString(16) + ', got 0x' + u8[i].toString(16));
    }
    if (u8[i + 4] !== version[i]) {
      errors.push('[' + name + '] Invalid version byte at ' + (i + 4) + ': expected 0x' + version[i].toString(16) + ', got 0x' + u8[i + 4].toString(16));
    }
  }

  // 2. Compilation and Instantiation
  let moduleInstance;
  let instance;
  try {
    moduleInstance = new WebAssembly.Module(u8);
    instance = new WebAssembly.Instance(moduleInstance);
  } catch (err) {
    errors.push('[' + name + '] WebAssembly compilation/instantiation failed: ' + err.message);
    return { valid: false, errors };
  }

  const { exports } = instance;

  // 3. Linear Memory
  if (!exports.memory || !(exports.memory instanceof WebAssembly.Memory)) {
    errors.push('[' + name + '] Missing required export "memory" (must be WebAssembly.Memory)');
  } else {
    const byteLength = exports.memory.buffer.byteLength;
    if (byteLength < 65536) {
      errors.push('[' + name + '] Exported "memory" is smaller than 1 page (' + byteLength + ' bytes < 65536 bytes)');
    }
  }

  // 4. Exported Functions
  const requiredFunctions = [
    'game_init',
    'game_tick',
    'game_input',
    'get_framebuffer',
    'get_width',
    'get_height',
  ];

  for (const fn of requiredFunctions) {
    if (typeof exports[fn] !== 'function') {
      errors.push('[' + name + '] Missing required function export "' + fn + '"');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // 5. Functional and Boundary Verification
  try {
    const width = exports.get_width();
    const height = exports.get_height();
    const fbPtr = exports.get_framebuffer();

    if (typeof width !== 'number' || width <= 0) {
      errors.push('[' + name + '] get_width() must return positive integer, got: ' + width);
    }
    if (typeof height !== 'number' || height <= 0) {
      errors.push('[' + name + '] get_height() must return positive integer, got: ' + height);
    }
    if (typeof fbPtr !== 'number' || fbPtr < 0) {
      errors.push('[' + name + '] get_framebuffer() must return non-negative pointer offset, got: ' + fbPtr);
    }

    const requiredBytes = width * height * 4;
    const memBuffer = exports.memory.buffer;
    if (fbPtr + requiredBytes > memBuffer.byteLength) {
      errors.push(
        '[' + name + '] Framebuffer (' + width + 'x' + height + ' * 4 = ' + requiredBytes + ' bytes at offset ' + fbPtr + ') exceeds memory buffer (' + memBuffer.byteLength + ' bytes)'
      );
    }

    // Call game_init
    exports.game_init();

    // Call game_tick standard frame
    const tickResult = exports.game_tick(0.01667);
    if (typeof tickResult !== 'number') {
      errors.push('[' + name + '] game_tick(dt) must return integer status code, got: ' + typeof tickResult);
    }

    // Test input dispatch
    exports.game_input(37, 1); // ArrowLeft down
    exports.game_input(37, 0); // ArrowLeft up

    // Boundary edge cases:
    // dt = 0.0 (paused)
    const tickZero = exports.game_tick(0.0);
    if (Number.isNaN(tickZero)) {
      errors.push('[' + name + '] game_tick(0.0) produced NaN');
    }

    // dt = 10.0 (large dt clamp test)
    const tickLarge = exports.game_tick(10.0);
    if (Number.isNaN(tickLarge)) {
      errors.push('[' + name + '] game_tick(10.0) produced NaN');
    }

    // Negative and high key codes
    exports.game_input(-1, 1);
    exports.game_input(999999, 0);

    // Framebuffer read/write verification
    if (fbPtr + requiredBytes <= exports.memory.buffer.byteLength) {
      const fbView = new Uint32Array(exports.memory.buffer, fbPtr, width * height);
      const originalPixel = fbView[0];
      fbView[0] = 0xff00ff00; // write test pixel
      if (fbView[0] !== 0xff00ff00) {
        errors.push('[' + name + '] Framebuffer memory read/write mismatch');
      }
      fbView[0] = originalPixel; // restore
    }
  } catch (err) {
    errors.push('[' + name + '] Runtime contract execution failed: ' + err.message);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Self-Test & File Verification Runner
async function main() {
  console.log('🎮 Shae WebAssembly Game Player Contract Verifier\n');

  let passed = 0;
  let failed = 0;

  // 1. Validate Reference Implementation
  console.log('1. Verifying Reference WASM Module Contract...');
  const refWasm = createReferenceWasm(256, 240);
  const refResult = verifyWasmContract(refWasm, 'reference_module');
  if (refResult.valid) {
    console.log('   ✓ Reference contract passed all assertions (header, exports, memory, boundary inputs)\n');
    passed++;
  } else {
    console.error('   ✗ Reference contract validation failed:');
    for (const err of refResult.errors) console.error('     - ' + err);
    failed++;
  }

  // 2. Validate Negative Rejection Cases
  console.log('2. Verifying Negative Corner Cases Rejection...');
  const corruptHeader = new Uint8Array(refWasm);
  corruptHeader[0] = 0xff; // corrupt magic
  const corruptResult = verifyWasmContract(corruptHeader, 'corrupt_header_test');
  if (!corruptResult.valid) {
    console.log('   ✓ Corrupt header correctly caught and rejected');
    passed++;
  } else {
    console.error('   ✗ Corrupt header was unexpectedly accepted!');
    failed++;
  }

  // 3. Scan for existing WASM files in shae-site/public/games or fixtures
  console.log('\n3. Scanning Repository for Game WASM Binaries...');
  const searchDirs = [
    path.resolve('public/games'),
    path.resolve('public/assets'),
    path.resolve('tests/fixtures'),
  ];

  let scannedCount = 0;
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.wasm')) {
        scannedCount++;
        const filePath = path.join(dir, entry.name);
        const bytes = fs.readFileSync(filePath);
        const res = verifyWasmContract(bytes, entry.name);
        if (res.valid) {
          console.log('   ✓ ' + entry.name + ': contract valid');
          passed++;
        } else {
          console.error('   ✗ ' + entry.name + ': contract violations found:');
          for (const err of res.errors) console.error('     - ' + err);
          failed++;
        }
      }
    }
  }

  if (scannedCount === 0) {
    console.log('   (No additional .wasm game files found on disk; reference contract validated)\n');
  } else {
    console.log('\n   Scanned ' + scannedCount + ' wasm file(s).\n');
  }

  console.log('Summary: ' + passed + ' passed, ' + failed + ' failed.');
  if (failed > 0) {
    process.exit(1);
  }
}

// Run directly if invoked via node
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/verify-wasm-contract.mjs')) {
  main().catch((err) => {
    console.error('Unhandled verification error:', err);
    process.exit(1);
  });
}
