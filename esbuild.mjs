import esbuild from 'esbuild';
import yargs from 'yargs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function LoggerPlugin(name) {
    let i = 0;
    return {
        name: name,
        setup(build) {
            build.onStart(() => {
                console.log(`(${String(++i).padStart(5, '0')}) [${name}] Building...`);
            });
            build.onEnd(result => {
                console.log(`(${String(i).padStart(5, '0')}) [${name}] Build ended with ${result.errors.length} errors`);
            });
        },
    }
}

function getBuild(production) {
    const baseConfig = {
        bundle: true,
        outdir: 'build',
        target: [
            'es2019',
            'chrome80',
        ],
        format: 'esm',
        sourcemap: true,
        minify: production,
        treeShaking: true,
        plugins: [
        ],
    }

    const plugin = {
        ...baseConfig,
        entryPoints: [
            { in: 'src/plugin/mod.ts', out: '' },
        ],
        plugins: [
            LoggerPlugin('PLUGIN'),
        ]
    }

    const ui = {
        ...baseConfig,
        sourcemap: false,
        entryPoints: [
            { in: 'src/ui/mod.ts', out: 'ui' },
        ],
        outExtension: {
            '.js': '.html'
        },
        banner: {
            js: '<script>'
        },
        footer: {
            js: '</script>'
        },
        plugins: [
            LoggerPlugin('UI'),
        ]
    }

    return [
        plugin,
        ui,
    ];
}

async function main(options) {
    try {
        const configs = getBuild(Boolean(options.production));

        if (options.watch) {
            const contextsPromises = configs.map(config => esbuild.context(config));
            const contexts = await Promise.all(contextsPromises);
            const watch = contexts.map(context => context.watch());
            console.log('Watching...');
            await Promise.all(watch);
        } else {
            const builds = configs.map(config => esbuild.build(config));
            await Promise.all(builds);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main(yargs(process.argv).argv);