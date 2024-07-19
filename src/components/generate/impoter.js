// generateImpoter 函数负责将导入语句数组转换为字符串，并处理子组件的导入
import {astToJs, genDataUrl, getAbsolutionPath, jsToAst, loadFile, splitVueFile} from "@/components/utils";
import _ from "lodash";
let importCss = []; // 存放需要注入到html中的css,一般来源于子组件的style标签，import注入的 css文件
let  importMap = {} // 存放需要使用importmap方式导入的组件
let exportDefault //  存放export default的模块代码

const vusions = [
    {
        name: 'hor-bar3D',
        path: '@vusion/hor-bar3D',
        url: 'https://lc.yinhaiyun.com/yh-material-unpkg/@vusion/hor-bar3D@0.1.2/dist/lib/index.js'
    },
    {
        name: 'rs-common-loading',
        path: '@vusion/rs-common-loading',
        url: 'https://lc.yinhaiyun.com/yh-material-unpkg/@vusion/rs-common-loading@1.0.2/dist/lib/index.js'
    }
]

const uuid = () => {
    return 'xxxxxyyy'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * 处理js代码部分
 *  1. 处理import
 *      import {xxx} from './xxx.js'  => const {xxx} = (await import('data:text/javascript;base64,......}'))
 *      import xxx from './xxx.js'  => const xxx = (await import('data:text/javascript;base64,......}'))
 *      import './xxx.js'  => (await import('data:text/javascript;base64,......}'))
 *      import 'componentA' from './componentA.vue'  =>
 *          const  componentA_func = () => {
 *                  option = {
 *                      data () {
 *                          return {
 *
 *                          }
 *                      },
 *                      methods: {
 *
 *                      }
 *                  }
 *                  option.template = `${html}
 *              return option
 *          }
 *          const componentA = await componentA_func()
 *  2. 处理 import './xxx.css'
 *  3. 处理常用工具方法
 *  import {uuid} from '@yh/ta-utils'  => const {uuid} = window['@yh/ta-utils']
 *  import moment from 'moment'  => const moment = window['moment']
 * @param node
 * @returns {string}
 */
const complierImport = async (node) => {
    // 获取import的映射名称
    let prefix = ''
    if (node.specifiers.length > 0) {
        const ImportDefaultSpecifiers = []
        const ImportSpecifiers = []
        for (const specifier of node.specifiers) {
            switch (specifier.type) {
                case 'ImportDefaultSpecifier':
                    ImportDefaultSpecifiers.push(astToJs(specifier))
                    break;
                case 'ImportSpecifier':
                    ImportSpecifiers.push(astToJs(specifier))
                    break;
            }
        }
        const prefixs = []
        if (ImportDefaultSpecifiers.length > 0) {
            prefixs.push(`${ImportDefaultSpecifiers.join(',')}`)
        }
        if (ImportSpecifiers.length > 0) {
            prefixs.push(`{${ImportSpecifiers.join(',')}}`)
        }
        prefix = 'const ' + prefixs.join(',')  + ' = '
    }

    // 获取import的文件路径,包路径
    const source = node.source.value

    // 处理 import './xxx.css'
    if(source.endsWith('.css')) {
        const fileContent = await loadFile(getAbsolutionPath(source))
        importCss.push(fileContent)
        return undefined

    } else if (['moment', 'vuex'].includes(source)) {
        return prefix + ' window[\'' + source + '\'];'
    } else if (source.endsWith('.vue')) { // 处理vue组件
        //     import 'componentA' from './componentA.vue'  =>
        //          const  componentA_func = () => {
        //                  option = {
        //                      data () {
        //                          return {
        //
        //                          }
        //                      },
        //                      methods: {
        //
        //                      }
        //                  }
        //                  option.template = `${template}
        //              return option
        //          }
        //          const componentA = await componentA_func()

        // 获取到vue文件内容
        const fileContent = await loadFile(getAbsolutionPath(source))
        // 拆分文件
        // 获取js, template内容
        const { js, html, css } = splitVueFile(fileContent)
        // 暂存
        importCss.push(css)

        // 处理import部分，获取处理后的结果
        const jsContent = await generateJs(js)


        const id = uuid()
        // 生成函数代码, 替代import导入组件的操作
        return  `
              const child_Comp_${id} = async () =>  {
                ${jsContent}
                const opt = ${exportDefault.replaceAll('export default', '')}
                opt.template = \`${html}\`
                return opt
              }
              ${prefix} await child_Comp_${id}() \n
            `

    } else if (source.startsWith('@vusion/')) {
        // 处理物料组件
        // 物料组件这里使用importmap的方式引入ES Module协议的包
        // import horBar3D from '@vusion/hor-bar3D' => window['horBar3D'] = () => import('@vusion/hor-bar3D')

        const vusion = vusions.find(e => e.path === source)
        importMap[source]=vusion.url
        return `const ${_.camelCase(vusion.name)} = () =>  import('${source}'); \n`
    } else {
        // 处理import
        // 这里需要将import的文件内容转换为DataUrl
        // import '@/components/child.vue' => import 'data:text/javascript;base64,(fileContent)
        const fileContent = await loadFile(getAbsolutionPath(source))
        let base64 = genDataUrl(fileContent);
        return prefix + `(await import('${base64}'));\n`
    }
}

const generateJs = async function (js) {

    // 用于暂存处理后的js代码
    let globelNodes = []
    const ast =  jsToAst(js);

    for (const node of ast.body) {
        switch (node.type) {
            // 处理import
            case 'ImportDeclaration':
                globelNodes.push(await complierImport(node))
                break;
            case 'ExportDefaultDeclaration':
                exportDefault = astToJs(node)
                break;
            // 处理表达式，全局变量等其他js代码，一般不做额外处理
            default:
                globelNodes.push(astToJs(node))
        }
    }
    return globelNodes.filter(e => e).join('\n')
}

/**
 *
 * @param js
 * @returns {Promise<{importMaps: string, exportDefault, globalJs: string, globalCss: string}>}
 */
export default async function (js) {
    exportDefault = ''
    importCss = []
    importMap = {}
    return {
        globalJs: await generateJs(js), // 处理后的js代码
        exportDefault: exportDefault, // export default的内容
        globalCss: importCss.join('\n'), //
        importMaps: JSON.stringify({
            "imports": importMap
        }),
    }
}
