import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
const derive = promisify(scrypt);
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 14 || password.length > 200) throw new Error('Use 14–200 characters.');
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt}$${hash.toString('hex')}`;
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  if (!process.stdin.isTTY) throw new Error('Run interactively. Do not put a password in command arguments.');
  const hidden = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const rl = createInterface({ input: process.stdin, output: hidden, terminal: true });
  try {
    process.stdout.write('Contraseña nueva / Nieuw wachtwoord (mín. 14): ');
    const first = await rl.question('');
    process.stdout.write('\nRepite / Herhaal: ');
    const second = await rl.question('');
    if (first !== second) throw new Error('Las contraseñas no coinciden / Wachtwoorden verschillen.');
    console.log('\nHash para TEACHER_ACCOUNTS / Hash voor TEACHER_ACCOUNTS:\n' + await hashPassword(first));
  } finally { rl.close(); }
}
