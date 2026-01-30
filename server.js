/**
 * Wrapper that runs serve CLI with PORT from env.
 * Railway runs npm start without a shell, so ${PORT} is not expanded;
 * this script passes 0.0.0.0:PORT explicitly so serve listens correctly.
 */
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '3000';
const listen = `0.0.0.0:${port}`;
const serveBin = path.join(__dirname, 'node_modules', 'serve', 'build', 'main.js');

const child = spawn(
  process.execPath,
  [serveBin, '-s', 'dist', '-l', listen],
  { stdio: 'inherit', env: process.env, cwd: __dirname }
);
child.on('exit', (code) => process.exit(code ?? 0));
