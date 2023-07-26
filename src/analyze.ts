import fs from 'fs'
import path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPackageInfo } from 'local-pkg'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface IPkgs {
  [key: string]: any
}

let pkgs: IPkgs = {}

function init() {
  const json = fs.readFileSync(path.resolve(__dirname, '../package.json'))
  const { devDependencies, dependencies } = JSON.parse(json.toString())
  for (let [name, version] of Object.entries(devDependencies ?? {}) as any) {
    pkgs[name] = { version, type: 'devDpendency', packages: {} }
  }
  for (let [name, version] of Object.entries(dependencies ?? {}) as any) {
    pkgs[name] = { version, type: 'dpendency', packages: {} }
  }
}

/**
 * 递归生成依赖关系，默认最大递归深度为  7
 * @param rootPkgs 依赖项
 * @param maxDep 最大递归深度
 * @returns 
 */
async function loadPkgs(rootPkgs: IPkgs, maxDep: number = 7) {
  if (maxDep === 0) {
    return
  }
  for (let key of Object.keys(rootPkgs)) {
    const pkgsInfo = await getPackageInfo(key)
    for (let [name, version] of Object.entries(pkgsInfo?.packageJson.devDependencies ?? {}) as any) {
      rootPkgs[key].packages[name] = { version, type: 'devDpendency', packages: {} }
    }
    for (let [name, version] of Object.entries(pkgsInfo?.packageJson.dependencies ?? {}) as any) {
        rootPkgs[key].packages[name] = { version, type: 'dpendency', packages: {} }
    }
    if (JSON.stringify(rootPkgs[key].packages) !== '{}') {
      loadPkgs(rootPkgs[key].packages, maxDep - 1)
    }
  }
}

init()
/**
 * 手动指定最大递归深度为 2
 */
loadPkgs(pkgs, 2).then(() => {
  fs.writeFile('pkgs.json', JSON.stringify(pkgs), err => {
    if (err) {
      throw new Error('出错了')
    }
    console.log('done')
  })
})
console.log(pkgs)
