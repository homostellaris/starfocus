import { $ } from 'bun'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const productionDbUrl = process.env.DB_URL
const realmId = process.env.REALM_ID
if (!productionDbUrl || !realmId) {
	console.error('DB_URL and REALM_ID environment variables are required')
	process.exit(1)
}

const projectRoot = join(import.meta.dir, '..')
const config = JSON.parse(
	readFileSync(join(projectRoot, 'dexie-cloud.json'), 'utf-8'),
)
const testDbUrl = config.dbUrl

if (productionDbUrl === testDbUrl) {
	console.error(
		`DB_URL (${productionDbUrl}) is the same as the test database URL in dexie-cloud.json — aborting to avoid a no-op`,
	)
	process.exit(1)
}

const workDir = mkdtempSync(join(tmpdir(), 'dexie-cloud-'))
cpSync(join(projectRoot, 'dexie-cloud.key'), join(workDir, 'dexie-cloud.key'))

function writeConfig(dbUrl: string) {
	writeFileSync(
		join(workDir, 'dexie-cloud.json'),
		JSON.stringify({ ...config, dbUrl }, null, 2) + '\n',
	)
}

const exportPath = join(workDir, 'export.json')

try {
	console.log(`Exporting from production (${productionDbUrl})...`)
	writeConfig(productionDbUrl)
	await $`bunx dexie-cloud export --data --realmId ${realmId} ${exportPath}`.cwd(
		workDir,
	)

	console.log(`Importing into test (${testDbUrl})...`)
	writeConfig(testDbUrl)
	await $`bunx dexie-cloud import ${exportPath}`.cwd(workDir)

	console.log('Done — production data imported into test database')
} finally {
	rmSync(workDir, { recursive: true })
}
