import { hashPassword } from 'better-auth/crypto'
const h = await hashPassword('12345')
const now = Math.floor(Date.now()/1000)
const q = (v) => v===null ? 'NULL' : `'${String(v).replaceAll("'","''")}'`
const users = [
  {id:'usr_admin1', name:'Admin 1', email:'admin1@rg1.in', role:'admin', wrole:null},
  {id:'usr_owner1', name:'Owner 1', email:'owner1@rg1.in', role:'user', wrole:'owner'},
  {id:'usr_manager1', name:'Manager1', email:'manager1@rg1.in', role:'user', wrole:'admin'},
]
const sql = []
for (const u of users) {
  sql.push(`INSERT INTO user (id,email,name,image,username,displayUsername,emailVerified,role,banned,banReason,banExpires,twoFactorEnabled,locale,timeZone,createdAt,updatedAt) SELECT ${q(u.id)},${q(u.email)},${q(u.name)},NULL,NULL,NULL,1,${q(u.role)},0,NULL,NULL,0,NULL,NULL,${now},${now} WHERE NOT EXISTS (SELECT 1 FROM user WHERE email=${q(u.email)});`)
  sql.push(`INSERT INTO account (id,accountId,providerId,issuer,userId,accessToken,refreshToken,idToken,accessTokenExpiresAt,refreshTokenExpiresAt,scope,password,createdAt,updatedAt) SELECT 'acc_${u.id.slice(4)}',${q(u.id)},'credential','local:credential',${q(u.id)},NULL,NULL,NULL,NULL,NULL,NULL,${q(h)},${now},${now} WHERE NOT EXISTS (SELECT 1 FROM account WHERE userId=${q(u.id)} AND providerId='credential');`)
  if (u.wrole) sql.push(`INSERT INTO workspace_members (id,workspaceId,userId,role,createdAt) SELECT 'mem_${u.id.slice(4)}',(SELECT id FROM workspaces WHERE slug='starter-lab'),${q(u.id)},${q(u.wrole)},${now} WHERE NOT EXISTS (SELECT 1 FROM workspace_members WHERE userId=${q(u.id)} AND workspaceId=(SELECT id FROM workspaces WHERE slug='starter-lab'));`)
}
console.log(sql.join('\n'))
