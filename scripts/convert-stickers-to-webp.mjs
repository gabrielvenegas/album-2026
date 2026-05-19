#!/usr/bin/env node

import { access, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const root = process.cwd()
const stickersDir = path.join(root, 'public', 'stickers')
const dataDir = path.join(root, 'src', 'data')
const sourceExtensions = new Set(['.png', '.jpg', '.jpeg'])

const args = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith('--quality=')))
const qualityArg = process.argv.slice(2).find((arg) => arg.startsWith('--quality='))
const quality = Number(qualityArg?.split('=')[1] ?? 80)
const dryRun = args.has('--dry-run')
const replace = args.has('--replace')
const force = args.has('--force')

if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
  fail('Use --quality with an integer from 1 to 100.')
}

if (args.has('--help')) {
  console.log(`
Usage: npm run stickers:webp -- [options]

Options:
  --quality=N    WebP quality from 1 to 100. Default: 80.
  --dry-run      Print what would be converted without writing files.
  --force        Recreate existing .webp files.
  --replace      Delete original PNG/JPEG files and update src/data references.
  --help         Show this help.
`.trim())
  process.exit(0)
}

await assertExecutable('cwebp')

const images = await listImages(stickersDir)

if (images.length === 0) {
  console.log('No PNG/JPEG sticker images found.')
  process.exit(0)
}

let converted = 0
let skipped = 0
let originalBytes = 0
let webpBytes = 0

for (const input of images) {
  const output = replaceExtension(input, '.webp')
  const inputStat = await stat(input)

  originalBytes += inputStat.size

  if (!force && await exists(output)) {
    skipped += 1
    webpBytes += (await stat(output)).size
    continue
  }

  if (dryRun) {
    console.log(`convert ${relative(input)} -> ${relative(output)}`)
    continue
  }

  await run('cwebp', ['-quiet', '-q', String(quality), input, '-o', output])
  converted += 1
  webpBytes += (await stat(output)).size
}

if (replace && !dryRun) {
  await updateDataReferences()

  for (const input of images) {
    await unlink(input)
  }
}

const reduction = originalBytes === 0
  ? '0.0'
  : ((1 - webpBytes / originalBytes) * 100).toFixed(1)

console.log([
  `Sticker images: ${images.length}`,
  `Converted: ${converted}`,
  `Skipped existing WebP: ${skipped}`,
  `Original total: ${formatBytes(originalBytes)}`,
  `WebP total: ${dryRun ? 'dry run' : formatBytes(webpBytes)}`,
  `Reduction: ${dryRun ? 'dry run' : `${reduction}%`}`,
  replace ? 'Originals removed and src/data references updated.' : 'Originals kept. Use --replace to remove them and update src/data references.'
].join('\n'))

async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      return listImages(fullPath)
    }

    if (entry.isFile() && sourceExtensions.has(path.extname(entry.name).toLowerCase())) {
      return [fullPath]
    }

    return []
  }))

  return files.flat().sort((a, b) => a.localeCompare(b))
}

async function updateDataReferences() {
  const files = await readdir(dataDir)
  const jsonFiles = files.filter((file) => file.endsWith('.json'))

  await Promise.all(jsonFiles.map(async (file) => {
    const fullPath = path.join(dataDir, file)
    const contents = await readFile(fullPath, 'utf8')
    const updated = contents.replace(/\/stickers\/([^"]+?)\.(png|jpe?g)"/gi, '/stickers/$1.webp"')

    if (updated !== contents) {
      await writeFile(fullPath, updated)
    }
  }))
}

async function assertExecutable(command) {
  try {
    await run(command, ['-version'])
  } catch {
    fail(`Missing "${command}". Install WebP tools first, for example: brew install webp`)
  }
}

async function exists(file) {
  try {
    await access(file, constants.F_OK)
    return true
  } catch {
    return false
  }
}

function replaceExtension(file, extension) {
  return path.join(path.dirname(file), `${path.basename(file, path.extname(file))}${extension}`)
}

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { stdio: 'ignore' })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} exited with code ${code}`))
      }
    })
  })
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function relative(file) {
  return path.relative(root, file)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
