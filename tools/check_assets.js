#!/usr/bin/env node
/**
 * 资源规范校验脚本（仅用 Node 原生模块，无第三方依赖）
 *
 * 六类校验，任意一项不通过即 exit(1)，全部通过 exit(0)：
 *   规则1  .meta 配对：assets/ 下每个资源必须有同名 .meta，反之亦然
 *   规则2  双目录镜像：assets/prefabs/ 与 assets/resources/prefabs/ 下 .prefab 文件必须双向一一对应
 *   规则3  对象池合规：plant/zombie/bullet 下禁止直接 destroy()；die()/recycle() 必须调 poolManager.put()
 *   规则4  update 内禁令：所有 .ts 文件 update() 方法体内禁止 instantiate/resources.load/find/console.log
 *   规则5  事件字面量禁令：eventCenter.emit/on/off/once 第一个参数禁止字符串字面量，必须用 GameEvents.XXX
 *   规则6  LFS 合规：assets/ 下所有二进制资源后缀必须在 .gitattributes 中有 LFS 规则
 *
 * 路径比对统一转小写，避免跨平台大小写问题。
 *
 * 兜底豁免（与 TECH_SPEC §18.2 第5条一致）：
 *   规则3 中，若 .destroy() 所在行往上 5 行内含 "兜底" 字样，视为合规兜底分支，豁免。
 *
 * 用法： node tools/check_assets.js
 * 详见 docs/TECH_SPEC.md §13.2 / §17 / §18 / §20 / §21 / §22
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const SCRIPTS = path.join(ASSETS, 'scripts');

// 规则1 资源后缀白名单
const RESOURCE_EXTS = new Set([
    '.ts', '.prefab', '.scene',
    '.png', '.jpg', '.jpeg',
    '.mp3', '.ogg', '.wav',
    '.json', '.font', '.dbbin', '.plist',
    '.ttf', '.otf', '.anim'
]);

// 递归时跳过的目录名（任何层级，大小写不敏感）
const SKIP_DIRS = new Set(['library', 'temp', 'build', 'local']);

let failed = 0;

function fail(rule, filePath, reason) {
    const rel = path.relative(ROOT, filePath) || filePath;
    console.log(`❌ [规则${rule}] ${rel} - ${reason}`);
    failed++;
}

/** 递归遍历目录，对每个文件调用 cb(fullPath) */
function walk(dir, cb) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return; // 目录不存在或无权限，跳过
    }
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name.toLowerCase())) continue;
            walk(full, cb);
        } else if (e.isFile()) {
            cb(full);
        }
    }
}

// ============ 规则1：.meta 配对 ============
function checkMetaPair() {
    const resources = []; // 资源本体（不含 .meta）
    const metas = [];     // .meta 文件
    walk(ASSETS, (full) => {
        const ext = path.extname(full).toLowerCase();
        if (ext === '.meta') {
            metas.push(full);
        } else if (RESOURCE_EXTS.has(ext)) {
            resources.push(full);
        }
    });

    // 路径统一转小写后建索引
    const metaSet = new Set(metas.map(p => path.relative(ROOT, p).toLowerCase()));
    const resSet = new Set(resources.map(p => path.relative(ROOT, p).toLowerCase()));

    // 资源本体必须有同名 .meta
    for (const r of resources) {
        const rel = path.relative(ROOT, r).toLowerCase();
        if (!metaSet.has(rel + '.meta')) {
            fail(1, r, '资源本体缺少同名 .meta');
        }
    }
    // .meta 必须有对应资源本体（防孤儿 .meta）
    for (const m of metas) {
        const rel = path.relative(ROOT, m).toLowerCase();
        if (!rel.endsWith('.meta')) continue;
        const host = rel.slice(0, -5); // 去掉 .meta
        if (!resSet.has(host)) {
            fail(1, m, '.meta 没有对应的资源本体（孤儿 .meta）');
        }
    }
}

// ============ 规则2：双目录镜像 ============
function checkPrefabMirror() {
    const A = path.join(ASSETS, 'prefabs');
    const B = path.join(ASSETS, 'resources', 'prefabs');

    /** 收集 root 下所有 .prefab 文件的相对路径（小写） */
    const collect = (root) => {
        const set = new Set();
        if (!fs.existsSync(root)) return set;
        const rec = (dir) => {
            let entries;
            try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
            catch { return; }
            for (const e of entries) {
                if (e.isDirectory()) {
                    rec(path.join(dir, e.name));
                } else if (e.isFile() && e.name.toLowerCase().endsWith('.prefab')) {
                    const rel = path.relative(root, path.join(dir, e.name)).toLowerCase();
                    set.add(rel);
                }
            }
        };
        rec(root);
        return set;
    };

    const setA = collect(A);
    const setB = collect(B);

    for (const p of setA) {
        if (!setB.has(p)) {
            fail(2, path.join(A, p), 'prefabs/ 下存在但 resources/prefabs/ 下缺失同名预制体');
        }
    }
    for (const p of setB) {
        if (!setA.has(p)) {
            fail(2, path.join(B, p), 'resources/prefabs/ 下存在但 prefabs/ 下缺失同名预制体');
        }
    }
}

// ============ 规则3：对象池合规 ============
function checkPoolCompliance() {
    const dirs = ['plant', 'zombie', 'bullet'].map(d => path.join(SCRIPTS, d));

    for (const d of dirs) {
        walk(d, (full) => {
            if (!full.toLowerCase().endsWith('.ts')) return;
            let src;
            try { src = fs.readFileSync(full, 'utf8'); }
            catch { return; }

            const lines = src.split(/\r?\n/);

            // (a) 禁止直接调用 destroy()（识别 // 兜底 注释豁免）
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (/^\s*\/\//.test(line)) continue; // 整行注释跳过
                const codePart = line.split('//')[0];
                if (/\bdestroy\s*\(/.test(codePart)) {
                    // 向上回溯 5 行，含 "兜底" 字样则豁免
                    let exempt = false;
                    for (let j = Math.max(0, i - 5); j <= i; j++) {
                        if (lines[j] && /兜底/.test(lines[j])) { exempt = true; break; }
                    }
                    if (!exempt) {
                        fail(3, `${full}:${i + 1}`, '禁止直接调用 destroy()，应走 die()/recycle() → poolManager.put()（见 TECH_SPEC §18）');
                    }
                }
            }

            // (b) die()/recycle() 方法体内必须调用 poolManager.put()
            // 提取方法签名起始位置
            const methodRe = /(?:public|private|protected)?\s*(die|recycle)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g;
            let m;
            while ((m = methodRe.exec(src)) !== null) {
                const name = m[1];
                const bodyStart = m.index + m[0].length;
                // 计算方法起始所在行号（用于报错定位）
                const lineNo = src.slice(0, m.index).split(/\r?\n/).length;
                // 找匹配的右大括号
                let depth = 1, bodyEnd = bodyStart;
                for (let i = bodyStart; i < src.length; i++) {
                    const c = src[i];
                    if (c === '{') depth++;
                    else if (c === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
                }
                const body = src.slice(bodyStart, bodyEnd);
                if (!/poolManager\.put\s*\(/.test(body)) {
                    fail(3, `${full}:${lineNo}`, `${name}() 方法体内未调用 poolManager.put()（见 TECH_SPEC §18）`);
                }
            }
        });
    }
}

// ============ 规则4：update 内禁令 ============
// 任何 .ts 文件的 update(dt) / update(delta) 方法体内禁止：
//   instantiate( / resources.load( / find( / console.log
function checkUpdateBan() {
    const updateMethodRe = /\bupdate\s*\(\s*(?:dt|delta)\w*\s*:\s*number\s*\)\s*(?::\s*\w+)?\s*\{/g;
    const BAN_LIST = ['instantiate(', 'resources.load(', 'find(', 'console.log'];

    walk(SCRIPTS, (full) => {
        if (!full.toLowerCase().endsWith('.ts')) return;
        let src;
        try { src = fs.readFileSync(full, 'utf8'); }
        catch { return; }

        let m;
        while ((m = updateMethodRe.exec(src)) !== null) {
            const bodyStart = m.index + m[0].length;
            const lineNo = src.slice(0, m.index).split(/\r?\n/).length;
            // 找匹配的右大括号
            let depth = 1, bodyEnd = bodyStart;
            for (let i = bodyStart; i < src.length; i++) {
                const c = src[i];
                if (c === '{') depth++;
                else if (c === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
            }
            const body = src.slice(bodyStart, bodyEnd);
            const bodyLines = body.split(/\r?\n/);
            for (let i = 0; i < bodyLines.length; i++) {
                const line = bodyLines[i];
                if (/^\s*\/\//.test(line)) continue; // 整行注释跳过
                const codePart = line.split('//')[0];
                for (const ban of BAN_LIST) {
                    if (codePart.includes(ban)) {
                        fail(4, `${full}:${lineNo + i}`, `update() 方法体内禁止调用 ${ban}（见 TECH_SPEC §20）`);
                    }
                }
            }
        }
    });
}

// ============ 规则5：事件字面量禁令 ============
// eventCenter.emit/on/off/once 第一个参数禁止字符串字面量，必须用 GameEvents.XXX
// 跳过 EventCenter.ts 自身（方法签名）
function checkEventLiterals() {
    walk(SCRIPTS, (full) => {
        if (!full.toLowerCase().endsWith('.ts')) return;
        const rel = path.relative(SCRIPTS, full).toLowerCase();
        // 跳过 EventCenter.ts 自身（方法签名里的 event: string 不算调用）
        if (rel === 'core/eventcenter.ts') return;
        let src;
        try { src = fs.readFileSync(full, 'utf8'); }
        catch { return; }

        const lines = src.split(/\r?\n/);
        // 匹配 eventCenter.emit(/on(/off(/once( 后紧跟 ' 或 " 的字符串字面量
        const re = /eventCenter\.(?:emit|on|off|once)\(\s*(['"])/;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^\s*\/\//.test(line)) continue; // 整行注释跳过
            const codePart = line.split('//')[0];
            if (re.test(codePart)) {
                fail(5, `${full}:${i + 1}`, 'eventCenter 调用第一个参数禁止字符串字面量，必须用 GameEvents.XXX（见 TECH_SPEC §21）');
            }
        }
    });
}

// ============ 规则6：LFS 合规 ============
// assets/ 下所有二进制资源后缀必须在 .gitattributes 中有 LFS 规则
// 防止开发者新增二进制类型但忘记同步 .gitattributes
function checkLfsCompliance() {
    // 二进制后缀清单（与 .gitattributes 中 LFS 段保持一致）
    const BINARY_EXTS = new Set([
        '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tga', '.psd', '.pvr', '.astc', '.ktx',
        '.mp3', '.ogg', '.wav', '.flac', '.m4a', '.aac',
        '.mp4', '.webm', '.mov',
        '.ttf', '.otf', '.woff', '.woff2',
        '.dbbin', '.bin', '.pak',
        '.zip', '.7z', '.rar'
    ]);

    // 解析 .gitattributes，提取 LFS 管理的后缀
    const gitattributesPath = path.join(ROOT, '.gitattributes');
    const lfsExts = new Set();
    if (fs.existsSync(gitattributesPath)) {
        const content = fs.readFileSync(gitattributesPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
            // 匹配 *.xxx filter=lfs ... 形式
            const m = /^\s*\*\.(\w+)\s+filter=lfs/.exec(line);
            if (m) lfsExts.add('.' + m[1].toLowerCase());
        }
    } else {
        fail(6, gitattributesPath, '.gitattributes 不存在，无法校验 LFS 规则');
        return;
    }

    // 收集 assets/ 下实际出现的二进制后缀
    const foundExts = new Set();
    walk(ASSETS, (full) => {
        const ext = path.extname(full).toLowerCase();
        if (BINARY_EXTS.has(ext)) foundExts.add(ext);
    });

    // 检查：实际出现的二进制后缀是否都被 .gitattributes 中的 LFS 规则覆盖
    for (const ext of foundExts) {
        if (!lfsExts.has(ext)) {
            fail(6, gitattributesPath, `assets/ 下出现 ${ext} 二进制资源，但 .gitattributes 未配置 LFS 规则（见 TECH_SPEC §22）`);
        }
    }
}

// ============ 主入口 ============
console.log('🔍 开始资源规范校验...');
console.log(`   项目根目录: ${ROOT}`);
console.log('');

checkMetaPair();
checkPrefabMirror();
checkPoolCompliance();
checkUpdateBan();
checkEventLiterals();
checkLfsCompliance();

console.log('');
if (failed === 0) {
    console.log('✅ 全部校验通过');
    process.exit(0);
} else {
    console.log(`❌ 共 ${failed} 项不通过`);
    process.exit(1);
}
