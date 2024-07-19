// 导入依赖
import {Parser} from "acorn"; // JavaScript解析器
import escodegen from 'escodegen';

// 主要的转换函数，将JS代码转换为AST，并对AST进行处理
const transformJs = (js) => {
    let JSAST  =  null;
    // 尝试解析JS代码，如果解析失败，将错误信息打印到控制台
    try {
        JSAST = Parser.parse(js, {
            ecmaVersion: 'latest', // 使用最新的ECMAScript版本
            locations: true, // 生成节点位置信息
            sourceType: 'module', // 源代码是ES模块
            allowReserved: false, // 不允许保留字作为标识符
        });
    } catch (e) {
        console.log(e);
    }
    const importer = []; // 用于存储import语句的数组
    const globalVars = []; // 用于存储全局变量的数组
    let vue = {}; // 用于存储Vue对象的变量

    // 遍历AST的body，body是一个包含所有顶级节点的数组
    for (const node of JSAST.body) {
        switch (node.type) {
            case 'ImportDeclaration': // 如果节点是import语句
                // 使用escodegen将AST节点转换为JavaScript代码，并将代码添加到importer数组中
                importer.push(escodegen.generate(node));
                break;
            case 'VariableDeclaration': // 如果节点是变量声明
                // 创建一个对象来存储变量的信息，包括类型（var、let或const）、名称和值
                // 使用escodegen将初始化表达式的AST节点转换为JavaScript代码
                // 将对象添加到globalVars数组中
                globalVars.push({
                    type: node.kind,
                    name: node.declarations[0].id.name,
                    value: escodegen.generate(node.declarations[0].init)
                });
                break;
            case 'ExportDefaultDeclaration': // 如果节点是默认导出声明
                // 调用generateExportDefault函数处理节点，并将返回的对象赋值给vue变量
                vue = exportDefault(node, js);
                break;
            default: // 暂不处理其他类型的节点
                break;
        }
    }
    // 对象打印到控制台
    return  { importer, globalVars, vue }
}

// 处理默认导出声明，生成Vue对象
function exportDefault(node, js) {
    const result = {}; // 创建一个空对象来存储Vue对象的信息
    // 遍历声明的属性，每个属性对应一个Vue对象的选项
    node.declaration.properties.forEach(property => {
        const key = property.key.name; // 属性的键，对应Vue对象的选项名
        const value = property.value; // 属性的值，对应Vue对象的选项值

        // 根据选项名进行不同的处理
        switch (key) {
            case 'data': // 如果选项是data
                // 调用generateData函数处理选项值，并将返回的结果赋值给result对象的对应属性
                result[key] =  generateData(value, js);
                break;
            case 'props': // 如果选项是props
                // 遍历选项值的所有属性（即所有prop）
                // 对每个prop，创建一个对象，其name属性为prop的名字
                // 然后遍历prop的所有属性，将每个属性的名字和值（或名字，或元素的名字）添加到对象中
                // 最后将对象添加到result对象的props属性中
                result[key] =  value.properties.map(e => {
                    const obj = {
                        name: e.key.name
                    };
                    e.value.properties.map(p => {
                        obj[p.key.name] = p.value.value ?? p.value.name ?? p.value.elements?.map(e => e.name);
                    });
                    return obj;
                });
                break;
            case 'created': // 如果选项是生命周期钩子
            case 'beforeCreate':
            case 'beforeMount':
            case 'mounted':
            case 'beforeUpdate':
            case 'updated':
            case 'activated':
            case 'deactivated':
            case 'beforeDestroy':
            case 'destroyed':
            case 'errorCaptured':
                // 调用generateData函数处理选项值，并将返回的结果赋值给result对象的对应属性
                result[key] = generateData(value, js);
                break;
            case 'watch': // 如果选项是watch
                // 遍历选项值的所有属性（即所有watcher）
                // 对每个watcher，创建一个对象，其name属性为watcher的名字
                // 最后将对象添加到result对象的watch属性中
                result[key] =  value.properties.map(e => {
                    return {
                        name: e.key.name
                    }
                });
                break;
            case 'computed': // 如果选项是computed或methods
            case 'methods':
                // 遍历选项值的所有属性（即所有计算属性或方法）
                // 对每个属性，根据其类型创建一个对象
                // 如果类型是SpreadElement，对象的name属性为调用的函数的名字，type属性为类型，argumentsName属性为第一个参数的值，argumentsList属性为第二个参数的元素的值
                // 如果类型是Property，对象的name属性为属性的键的名字，type属性为类型，async属性为函数是否是异步的，body属性为函数体的代码，args属性为函数的参数列表
                // 最后将对象添加到result对象的computed或methods属性中
                result[key] = value.properties.map(method => {
                    if (method.type === 'SpreadElement') {
                        return {
                            name: method.argument.callee.name,
                            type: method.type,
                            argumentsList: method.argument.arguments.map(e => escodegen.generate(e)),
                        };
                    } else if (method.type === 'Property') {
                        return {
                            name: method.key.name,
                            type: method.type,
                            async: method.value.async,
                            body: js?.substring(method.value.body.start, method.value.body.end).trim(),
                            args: (method?.value?.params || []).map(param => {
                                switch (param.type) {
                                    case 'Identifier':
                                        return param.name;
                                    case 'RestElement':
                                        return `...${param.argument.name}`;
                                    case 'ObjectPattern':
                                        return escodegen.generate(param);
                                    default:
                                        break;
                                }
                            })
                        };
                    }
                });
                break;
            case 'components': // 如果选项是components
                // 遍历选项值的所有属性（即所有组件）
                // 对每个组件，创建一个数组，其第一个元素为组件的名字，第二个元素为组件的值的代码
                // 使用Object.fromEntries将数组转换为对象，并赋值给result对象的components属性
                result[key] = Object.fromEntries(value.properties.map(prop => {
                    return [prop.key.name, escodegen.generate(prop.value)];
                }));
                break;
            case 'mixins': // 如果选项是mixins
                // 遍历选项值的所有元素（即所有mixin）
                // 对每个mixin，使用escodegen将其转换为代码
                // 最后将所有代码添加到result对象的mixins属性中
                result[key] =  value.elements.map(mixin => escodegen.generate(mixin));
                break;
        }
    });
    return result; // 返回result对象
}

// 处理data属性
function generateData(value, js) {

    // 在函数体中寻找return语句
    const returnNode = value.body.body.find(node => node.type === 'ReturnStatement');
    if (returnNode == null) {
        // 如果没有return语句，返回一个对象，其async属性为函数是否是异步的，dataReturn属性为空数组，body属性为函数体的代码
        return {
            async: value.async,
            dataReturn: [],
            body: bodyFromBodyBlock(js, value.body),
        };
    } else {
        // 如果有return语句，返回一个对象，其dataReturn属性为返回值的数组形式，body属性为return语句之前的代码
        return {
            dataReturn: transformDataStringToArray(returnNode),
            // 起始位置需要跳过data()函数开头的'{'
            body: js.substring(value.body.start + 1, returnNode.start),
        };
    }
}

// 解析JS代码，返回其AST
export function javascript (js) {
    return Parser.parse(js, { ecmaVersion: 'latest', sourceType: 'module', });
}


// 将data的返回值转换为一个数组
export function transformDataStringToArray(body) {
    if (Array.isArray(body.argument.properties)) {
        // 如果返回值是一个对象，遍历其所有属性
        // 对每个属性，创建一个对象，其name属性为属性的名字，content属性为属性的值
        // 最后将所有对象添加到一个数组中
        return body.argument.properties.map(propertyItem => ({
            name: propertyItem.key.name, // 变量名称
            content: getStatusValue(propertyItem), // 变量的值
        }));
    } else {
        // 如果返回值不是一个对象，返回空数组
        return [];
    }
}

// 获取值
function getStatusValue(astPropItem) {
    const astType = astPropItem.value.type; // 值的类型
    const astValue = astPropItem.value.raw; // 值的原始形式
    if (astType === 'Literal') {
        // 如果值是一个字面量，返回其原始形式
        return astValue;
    } else {
        // 如果值不是一个字面量，使用escodegen将其转换为代码
        const getCodeString = escodegen.generate(astPropItem);
        if (getCodeString.includes(':')) {
            // 如果代码中包含':'，返回':'后的部分
            return getCodeString.match(/(?<=:)[\s\S]*/)[0];
        } else {
            // 如果代码中不包含':'，返回整个代码
            return getCodeString;
        }
    }
}

// 从函数体中提取代码
export function bodyFromBodyBlock (js, info) {
    let body = js.substring(info.start, info.end).trim(); // 获取函数体的代码
    if (body.startsWith('{') && body.endsWith('}')) {
        // 如果代码以'{'开头并以'}'结尾，去掉开头和结尾的'{''}'
        body = body.slice(1, -1);
    }
    return body; // 返回代码
}

// 导出transformJs函数
export {
    transformJs
}
