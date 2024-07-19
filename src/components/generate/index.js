import generateImpoter from '@/components/generate/impoter'

// generate 函数负责将 AST（抽象语法树）转换为 Vue 组件的各个部分
export const generate = async (ast) => {
    const { styleAst, scriptAst } = ast // 从 AST 中提取样式和脚本部分
    const { importer, vue, globalVars } = scriptAst // 从脚本 AST 中提取导入语句、Vue 组件定义和全局变量
    const { components, data, methods, mounted }  =  vue // 从 Vue 组件定义中提取组件、数据、方法和挂载函数
    // 返回一个对象，它包含 CSS 字符串、脚本对象和 Vue 组件定义
    return {
        css: generateCss(styleAst), // 将样式 AST 转换为 CSS 字符串
        script: {
            //"importer": [
            //   "import $api from './api/api.js';",
            //   "import UserInfo from './part/userInfo.vue';",
            //   "import { treeData } from './api/utils.js';",
            //   "import rsCommonLoading from '@vusion/rs-common-loading';",
            //   "import moment from 'moment';"
            // ],
            importer:  await generateImpoter(importer.join('\n')), // 将导入语句数组转换为字符串，并处理子组件的导入
            globalVars:  generateGlobalVars(globalVars), // 将全局变量数组转换为字符串
            vue: {
                data: generateData(data), // 将数据对象转换为字符串
                components: generateComponent(components), // 将组件对象转换为字符串
                methods: generateMethods(methods), // 将方法数组转换为字符串
                mounted: generateMounted(mounted), // 将挂载函数转换为字符串
            }
        }
    }
}


/**
 * generateCss 函数负责将样式 AST 转换为 CSS 字符串
 *  "styleAst": {
 *     "children": {
 *       ".container": {
 *         "children": {},
 *         "attributes": {
 *           "height": "100%;",
 *           "width": "100%;",
 *           "background": "#ECF1F4;",
 *           "padding": "10px;"
 *         },
 *         "comment": "",
 *         "importContent": ""
 *       },
 *       ".header": {
 *         "children": {},
 *         "attributes": {
 *           "height": "150px;",
 *           "background": "white;",
 *           "padding": "10px;"
 *         },
 *         "comment": "",
 *         "importContent": ""
 *       },
 *     },
 *     "attributes": {},
 *     "comment": "",
 *     "importContent": ""
 *   }
 * @param css
 * @returns {string}
 */
function generateCss (css) {
    const {children} = css
    let start = ''

    for (const child in children) {
        start += `${child}{`

        const attributes = children[child].attributes
        for (const attr in attributes) {
            start += `${attr}: ${attributes[attr]} \n`
        }

        start += '}'
    }

    return start
}

/**
 * generateGlobalVars 函数负责将全局变量数组转换为字符串
 * "globalVars": [
 *     {
 *         "type": "const",
 *         "name": "roles",
 *         "value": "[\n    {\n        value: '1',\n        label: '开发人员'\n    },\n    {\n        value: '2',\n        label: '测试人员'\n    },\n    {\n        value: '3',\n        label: '运维人员'\n    }\n]"
 *     }
 * ],
 * @param globalVars
 * @returns {string}
 */
function generateGlobalVars (globalVars = []) {
    let start = ''
    globalVars.forEach(e => {
        start += `${e.type} ${e.name} = ${e.value}; \n`
    })
    return start
}

/**
 * generateData 函数负责将数据对象转换为字符串
 *   "data": {
 *    "dataReturn": [
 *      {
 *        "name": "form_RFG8COD7",
 *        "content": " undefined"
 *      },
 *      {
 *        "name": "dataSource_25GS38",
 *        "content": " []"
 *      },
 *    ],
 *    "body": "\r\n    "
 *   },
 * @param data
 * @returns {string}
 */
function generateData (data) {
    let start =  'data () {\n' +
        '          return {\n' +
        '           '
    data.dataReturn.forEach(e => {
        start += `${e.name}:${e.content},\n`
    })

    start = start + '\n          }}'

    return start
}

/**
 * generateComponent 函数负责将组件对象转换为字符串
 *   "components": {
 *    "UserInfo": "UserInfo",
 *    "RsCommonLoading": "rsCommonLoading"
 *   },
 * @param components
 * @returns {string}
 */
function generateComponent (components) {
    let start =  'components: {\n'

    for (const key in components) {
        start += `${key}:${components[key]},\n`
    }
    start = start + '\n          }'

    return start
}

/**
 * generateMounted 函数负责将挂载函数转换为字符串
 * "mounted": {
 *     "async": false,
 *     "dataReturn": [],
 *     "body": "\r\n    this.loadData_25GS38( )\r\n  "
 * },
 * @param mounted
 * @returns {string}
 */
function generateMounted (mounted = {}) {
    return `mounted () { ${mounted?.body || ''} }`
}

/**
 * generateMethods 函数负责将方法数组转换为字符串
 * methods: {
 *     "name": "loadData_25GS38",
 *     "type": "Property",
 *     "async": false,
 *     "body": "{\r\n      this.dataSource_25GS38 = $api.queryTableData()\r\n      this.dataSource_25GS38.forEach( e => {\r\n        e.date = moment().add(-Math.random()*20, 'day').format('YYYY-MM-DD HH:mm:ss')\r\n      })\r\n    }",
 *     "args": []
 * },
 * @param methods
 * @returns {string}
 */
function generateMethods (methods = []) {
    let start = ''
    methods.forEach(e => {
        if (e.type === "SpreadElement") {
            start += `...${e.name}(${e.argumentsList.join(',')}),
            `
        } else {
            start += `${e.async ? ('async ' + e.name) : e.name} (${e.args.join(',')}) 
            ${e.body}, \n
            `
        }
    })

    return start
}
