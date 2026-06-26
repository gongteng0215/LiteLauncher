const fs = require("fs");
const path = require("path");

function log(step) {
  process.stdout.write(`[probe] ${step}\n`);
}

const addonPath = path.join(__dirname, "..", "dist", "native", "litesnap-capture.node");

log(`electron node ${process.versions.node} modules=${process.modulesVersion ?? process.versions.modules}`);
log(`addon exists=${fs.existsSync(addonPath)} path=${addonPath}`);

let addon;
try {
  log("before require");
  addon = require(addonPath);
  log(`after require keys=${Object.keys(addon).join(",")}`);
} catch (error) {
  log(`require error: ${error && error.stack ? error.stack : error}`);
  process.exit(1);
}

try {
  log("before capture");
  const result = addon.captureDisplayRect({
    x: 0,
    y: 0,
    captureWidth: 100,
    captureHeight: 100,
    outputWidth: 100,
    outputHeight: 100
  });
  log(
    `after capture ok=${Boolean(result)} size=${
      result ? `${result.width}x${result.height} bytes=${result.data?.length}` : "null"
    }`
  );
  if (result && result.data) {
    let alphaZero = 0;
    let nonBlack = 0;
    for (let i = 0; i < result.data.length; i += 4) {
      if (result.data[i + 3] === 0) alphaZero += 1;
      if (result.data[i] || result.data[i + 1] || result.data[i + 2]) nonBlack += 1;
    }
    log(`pixels alphaZero=${alphaZero} nonBlack=${nonBlack}`);
  }
} catch (error) {
  log(`capture error: ${error && error.stack ? error.stack : error}`);
  process.exit(1);
}

log("done");
process.exit(0);
