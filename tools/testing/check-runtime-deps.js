#!/usr/bin/env node
/**
 * Guards the two ways a server-side require() can pass locally and still crash
 * the production container on boot:
 *
 *   1. The module is a devDependency. The Dockerfile runtime stage installs with
 *      `npm ci --omit=dev`, so it is simply absent in the image.
 *   2. The module is a relative path into a directory the runtime stage never
 *      COPYs, so the file is absent in the image.
 *
 * Either one exits the process with MODULE_NOT_FOUND before it can listen.
 * Railway then burns its restartPolicyMaxRetries and Cloudflare serves a
 * site-wide 502 -- the whole site, not just the feature that added the import.
 * Both have shipped to production at least once.
 *
 * The set of runtime files is read out of the Dockerfile itself rather than
 * hardcoded here, so adding a COPY to the runtime stage automatically widens
 * this check instead of silently outdating it.
 *
 * Usage: node tools/testing/check-runtime-deps.js
 * Exits 0 when clean, 1 on any finding.
 */

const fs = require('fs');
const path = require('path');
const { builtinModules } = require('node:module');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILTINS = new Set(builtinModules);

const problems = [];
const notes = [];

/** Parse the Dockerfile's *runtime* stage and return the paths it copies in. */
function readRuntimeCopyPaths() {
    const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
    const lines = dockerfile.split('\n');

    // Find where the runtime stage begins; everything before it is the builder.
    const startIdx = lines.findIndex((l) => /^FROM\s+.*\bAS\s+runtime\b/i.test(l.trim()));
    if (startIdx === -1) {
        throw new Error('Could not locate a `FROM ... AS runtime` stage in the Dockerfile.');
    }

    const fromRepo = [];   // copied out of the build context (the repo)
    const generated = [];  // copied from an earlier stage (build output)

    for (const raw of lines.slice(startIdx + 1)) {
        const line = raw.trim();
        if (/^FROM\s/i.test(line)) break;          // a later stage starts
        if (!/^COPY\s/i.test(line)) continue;

        const args = line.replace(/^COPY\s+/i, '').split(/\s+/).filter(Boolean);
        const flags = args.filter((a) => a.startsWith('--'));
        const operands = args.filter((a) => !a.startsWith('--'));
        if (operands.length < 2) continue;

        const sources = operands.slice(0, -1);
        const dest = operands[operands.length - 1];

        if (flags.some((f) => /^--from=/i.test(f))) {
            generated.push(dest.replace(/^\.?\//, '').replace(/\/$/, ''));
            continue;
        }

        for (const src of sources) {
            const clean = src.replace(/\/$/, '');
            fromRepo.push(clean);

            // This checker assumes a COPY lands at the same path it came from.
            // If that ever stops being true, relative-require resolution below
            // would silently model the wrong layout, so say so loudly.
            const destClean = dest.replace(/^\.?\//, '').replace(/\/$/, '');
            const isDirDrop = destClean === '' || destClean === '.';
            if (!isDirDrop && destClean !== clean && sources.length === 1) {
                notes.push(
                    `Dockerfile COPY maps "${clean}" -> "${dest}"; this check assumes ` +
                    `runtime paths mirror repo paths and may under-report for it.`
                );
            }
        }
    }

    return { fromRepo, generated };
}

/** Every .js file under the copied paths — these are what actually run in prod. */
function collectRuntimeFiles(copyPaths) {
    const files = [];

    const walk = (abs) => {
        let stat;
        try {
            stat = fs.statSync(abs);
        } catch {
            return; // a COPY of something not present locally; not our problem
        }
        if (stat.isDirectory()) {
            if (path.basename(abs) === 'node_modules') return;
            for (const entry of fs.readdirSync(abs)) walk(path.join(abs, entry));
        } else if (abs.endsWith('.js')) {
            files.push(abs);
        }
    };

    for (const p of copyPaths) walk(path.join(ROOT, p));
    return [...new Set(files)];
}

/** Strip comments so a require() inside one doesn't register as a real import. */
function stripComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
}

function extractSpecifiers(src) {
    const found = [];
    const re = /require\(\s*(['"])([^'"]+)\1\s*\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        found.push({ spec: m[2], index: m.index });
    }
    return found;
}

function lineOf(src, index) {
    return src.slice(0, index).split('\n').length;
}

/** "@scope/pkg/sub" -> "@scope/pkg";  "pkg/sub" -> "pkg" */
function packageNameOf(spec) {
    const bare = spec.replace(/^node:/, '');
    const parts = bare.split('/');
    return bare.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function main() {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const prodDeps = new Set(Object.keys(pkg.dependencies || {}));
    const devDeps = new Set(Object.keys(pkg.devDependencies || {}));
    const optDeps = new Set(Object.keys(pkg.optionalDependencies || {}));

    const { fromRepo, generated } = readRuntimeCopyPaths();
    const runtimeFiles = collectRuntimeFiles(fromRepo);

    if (runtimeFiles.length === 0) {
        console.error('✖ No runtime .js files found — the Dockerfile parse is probably wrong.');
        process.exit(1);
    }

    // Absolute prefixes that exist inside the production image.
    const shippedPrefixes = [...fromRepo, ...generated].map((p) => path.join(ROOT, p));
    const isShipped = (abs) =>
        shippedPrefixes.some((pre) => abs === pre || abs.startsWith(pre + path.sep));

    for (const file of runtimeFiles) {
        const raw = fs.readFileSync(file, 'utf8');
        const src = stripComments(raw);
        const rel = path.relative(ROOT, file);

        for (const { spec, index } of extractSpecifiers(src)) {
            const where = `${rel}:${lineOf(src, index)}`;

            if (spec.startsWith('.')) {
                // Relative import: the target must itself ship in the image.
                const base = path.resolve(path.dirname(file), spec);
                const candidates = [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')];
                const target = candidates.find((c) => {
                    try { return fs.statSync(c).isFile(); } catch { return false; }
                });

                if (!target) {
                    problems.push({
                        where,
                        spec,
                        kind: 'unresolved path',
                        detail: 'does not resolve to a file in the repo.',
                    });
                } else if (!isShipped(target)) {
                    problems.push({
                        where,
                        spec,
                        kind: 'not in the runtime image',
                        detail:
                            `resolves to "${path.relative(ROOT, target)}", which the Dockerfile ` +
                            `runtime stage never COPYs. Add a COPY for it, or move the file ` +
                            `under a directory that is already copied.`,
                    });
                }
                continue;
            }

            // Bare specifier: must survive `npm ci --omit=dev`.
            const name = packageNameOf(spec);
            if (BUILTINS.has(name) || spec.startsWith('node:')) continue;
            if (prodDeps.has(name) || optDeps.has(name)) continue;

            if (devDeps.has(name)) {
                problems.push({
                    where,
                    spec,
                    kind: 'devDependency used at runtime',
                    detail:
                        `"${name}" is in devDependencies. The runtime stage installs with ` +
                        `\`npm ci --omit=dev\`, so it will be missing in production. ` +
                        `Move it into "dependencies" in package.json.`,
                });
            } else {
                problems.push({
                    where,
                    spec,
                    kind: 'missing from package.json',
                    detail:
                        `"${name}" is not declared in dependencies. Add it with ` +
                        `\`npm install ${name}\`.`,
                });
            }
        }
    }

    const scanned = `${runtimeFiles.length} runtime file(s) from: ${fromRepo.join(', ')}`;

    if (problems.length === 0) {
        console.log(`✅ Runtime dependency check passed — ${scanned}`);
        for (const n of notes) console.log(`   ℹ ${n}`);
        process.exit(0);
    }

    console.error(`\n✖ Runtime dependency check FAILED — ${problems.length} problem(s) found.`);
    console.error('  These would crash the container on boot and 502 the entire site.\n');
    for (const p of problems) {
        console.error(`  ${p.where}`);
        console.error(`    require('${p.spec}') — ${p.kind}`);
        console.error(`    ${p.detail}\n`);
    }
    console.error(`  Scanned ${scanned}`);
    process.exit(1);
}

main();
