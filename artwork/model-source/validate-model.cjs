const fs = require('node:fs');
const path = require('node:path');

// Pass an installed Khronos gltf-validator package directory as the first argument.
const validator = require(path.resolve(process.argv[2]));
const root = __dirname;

(async () => {
  const files = ['go2-seated.gltf', ...fs.readdirSync(path.join(root, 'meshes'))
    .filter(name => name.endsWith('.gltf')).map(name => `meshes/${name}`)];
  const reports = [];
  for (const file of files) {
    const full = path.join(root, file);
    const report = await validator.validateBytes(new Uint8Array(fs.readFileSync(full)), {
      uri: file,
      maxIssues: 1000,
      externalResourceFunction: uri => Promise.resolve(new Uint8Array(
        fs.readFileSync(path.resolve(path.dirname(full), decodeURIComponent(uri)))))
    });
    reports.push({ file, issues: report.issues });
    console.log(`${file}: ${report.issues.numErrors} errors, ${report.issues.numWarnings} warnings`);
    if (report.issues.numErrors || report.issues.numWarnings) process.exitCode = 1;
  }
  fs.writeFileSync(path.join(root, 'validation.json'), JSON.stringify({
    validator: 'Khronos glTF Validator',
    version: validator.version(),
    files: reports,
    note: 'Informational findings retain source degenerate triangles and empty URDF sensor/collision nodes. No browser rendering, self-collision, or physical dynamics test was performed.'
  }, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
