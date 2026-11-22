import { spawnSync, spawn } from 'node:child_process';

const env = { ...process.env, NEXT_TELEMETRY_DISABLED: '1' };
const windows = process.platform === 'win32';
function npm(args, options = {}) {
  return spawnSync(windows ? 'npm.cmd' : 'npm', args, { shell: windows, stdio: 'inherit', env, ...options });
}
for (const args of [['ci','--no-audit','--no-fund'], ['run','build']]) {
  const result = npm(args);
  if (result.status !== 0) process.exit(result.status || 1);
}
const child = spawn(windows ? 'npm.cmd' : 'npm', ['run','start','--','--hostname','127.0.0.1'], { shell: windows, stdio: 'inherit', env });
child.on('exit', code => process.exit(code || 0));
