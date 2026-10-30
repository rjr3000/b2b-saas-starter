// Operator one-off: insert the three 2026-10-30 demo accounts into remote D1.
// Preflight fails loudly on conflicts; inserts are idempotent (WHERE NOT EXISTS).
import { hashPassword } from 'better-auth/crypto'
import { execFileSync } from 'node:child_process'

const USERS = [
  { id: 'usr_admin1', name: 'Admin 1', email: 'admin1@rg1.in', role: 'admin', wrole: null },
  { id: 'usr_owner1', name: 'Owner 1', email: 'owner1@rg1.in', role: 'user', wrole: 'owner' },
  { id: 'usr_manager1', name: 'Manager1', email: 'manager1@rg1.in', role: 'user', wrole: 'admin' }
]
const DB = 'b2b-saas-starter'
const d1 = (sql) => {
  const raw = execFileSync('pnpm', ['exec', 'wrangler', 'd1', 'execute', DB, '--remote', `--command=${sql}`], { encoding: 'utf8' })
  return JSON.parse(raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1))[0].results
}

// Preflight: abort on conflicts rather than silently skipping.
const ws = d1(`SELECT id FROM workspaces WHERE slug='starter-lab'`)
if (ws.length !== 1) throw new Error(`starter-lab workspace: expected 1 row, got ${ws.length}`)
for (const u of USERS) {
  const clash = d1(`SELECT id FROM user WHERE email='${u.email}' AND id<>'${u.id}'`)
  if (clash.length) throw new Error(`email ${u.email} already bound to ${clash[0].id}`)
  const cred = d1(`SELECT id FROM account WHERE userId='${u.id}' AND providerId='credential'`)
  if (cred.length && !process.argv.includes('--reapply')) throw new Error(`${u.id} already has a credential account; pass --reapply to keep it`)
}

const h = await hashPassword('12345')
const now = Math.floor(Date.now() / 1000)
const q = (v) => `'${String(v).replaceAll("'", "''")}'`
const out = []
for (const u of USERS) {
  out.push(`INSERT INTO user (id,email,name,image,username,displayUsername,emailVerified,role,banned,banReason,banExpires,twoFactorEnabled,locale,timeZone,createdAt,updatedAt) SELECT ${q(u.id)},${q(u.email)},${q(u.name)},NULL,NULL,NULL,1,${q(u.role)},0,NULL,NULL,0,NULL,NULL,${now},${now} WHERE NOT EXISTS (SELECT 1 FROM user WHERE email=${q(u.email)});`)
  out.push(`INSERT INTO account (id,accountId,providerId,issuer,userId,accessToken,refreshToken,idToken,accessTokenExpiresAt,refreshTokenExpiresAt,scope,password,createdAt,updatedAt) SELECT 'acc_${u.id.slice(4)}',${q(u.id)},'credential','local:credential',${q(u.id)},NULL,NULL,NULL,NULL,NULL,NULL,${q(h)},${now},${now} WHERE NOT EXISTS (SELECT 1 FROM account WHERE userId=${q(u.id)} AND providerId='credential');`)
  if (u.wrole) out.push(`INSERT INTO workspace_members (id,workspaceId,userId,role,createdAt) SELECT 'mem_${u.id.slice(4)}',(SELECT id FROM workspaces WHERE slug='starter-lab'),${q(u.id)},${q(u.wrole)},${now} WHERE NOT EXISTS (SELECT 1 FROM workspace_members WHERE userId=${q(u.id)} AND workspaceId=(SELECT id FROM workspaces WHERE slug='starter-lab'));`)
}
console.log(out.join('\n'))
