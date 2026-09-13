/**
 * Resolves ffmpeg / ffprobe.
 *
 * winget installs Gyan.FFmpeg but the PATH change only applies to newly-spawned
 * shells, so a shell that was already open cannot see it. Fall back to the known
 * winget package location in that case.
 */
import { existsSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

function onPath(bin) {
  try {
    execFileSync(bin, ['-version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function wingetBin(bin) {
  const root = join(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'WinGet',
    'Packages'
  )
  if (!existsSync(root)) return null
  for (const pkg of readdirSync(root)) {
    if (!pkg.startsWith('Gyan.FFmpeg')) continue
    const pkgDir = join(root, pkg)
    for (const build of readdirSync(pkgDir)) {
      const candidate = join(pkgDir, build, 'bin', `${bin}.exe`)
      if (existsSync(candidate)) return candidate
    }
  }
  return null
}

function resolve(bin) {
  if (onPath(bin)) return bin
  const found = wingetBin(bin)
  if (found) return found
  throw new Error(
    `${bin} not found. Install it with:\n` +
      '  winget install --id Gyan.FFmpeg -e --source winget ' +
      '--accept-package-agreements --accept-source-agreements'
  )
}

export const ffmpeg = resolve('ffmpeg')
export const ffprobe = resolve('ffprobe')
