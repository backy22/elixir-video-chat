/**
 * npm nests duplicate @types/react under many @tamagui/* packages, which breaks
 * TypeScript (multiple ReactNode identities). Remove only those type packages;
 * keep other nested deps (e.g. @tamagui/react-native-media-driver) intact.
 */
import { existsSync, readdirSync, rmSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const tamaguiRoot = join(root, "node_modules", "@tamagui")

/** @type {string[]} */
const targets = []

function walk(dir) {
  if (!existsSync(dir)) return
  let st
  try {
    st = statSync(dir)
  } catch {
    return
  }
  if (!st.isDirectory()) return

  const react = join(dir, "node_modules", "@types", "react")
  const reactDom = join(dir, "node_modules", "@types", "react-dom")
  if (existsSync(react)) targets.push(react)
  if (existsSync(reactDom)) targets.push(reactDom)

  for (const name of readdirSync(dir)) {
    walk(join(dir, name))
  }
}

if (existsSync(tamaguiRoot)) walk(tamaguiRoot)

for (const p of targets) rmSync(p, { recursive: true, force: true })
