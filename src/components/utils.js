// loadFile 函数使用 fetch API 从给定的 URL 加载文件内容。
// 它是一个异步函数，返回一个 Promise，Promise 的解析值是文件的内容。
import {Parser} from "acorn";
import escodegen from 'escodegen'
import {encode} from 'js-base64'
const loadFile = async (urlToFile)=> {
    let fileContent
    await fetch(urlToFile)
        .then((res)=> res.text())
        .then((data)=>{
            fileContent = data
        })

    return fileContent
}

// getAbsolutionPath 函数接收两个参数：basePath（当前文件的路径）和 importPath（import 语句中的相对路径）。
// 它首先获取 basePath 的目录，然后使用 path.resolve() 方法来解析出 importPath 的绝对路径。
// 最后，它将 basePath 的目录和解析出的绝对路径拼接起来，得到最终的绝对路径。
const getAbsolutionPath = (importPath) => {
    const path = require('path')

    // 获取 basePath 的目录
    const baseDir = path.dirname('http://localhost:8080/demo/mainPage.vue')
    // 使用 path.resolve 解析出绝对路径
    const absolutePath = path.resolve('', importPath)

    return baseDir + absolutePath
}


function genDataUrl (content) {
    return 'data:text/javascript;base64,' + encode(content)
}

function splitVueFile (code) {
    // 如果 code 为 null 或者 undefined，那么就使用空字符串
    const trimedCode = code?.trim() ?? ''

    // 从 <template> 到 </template> 之间的内容被认为是 HTML 部分
    const html = trimedCode.substring(
        trimedCode.indexOf('<template>') + 10,
        trimedCode.lastIndexOf('</template>')
    )

    let js
    // 尝试找到 <script> 标签（可能包含额外的属性，如 <script lang="ts">）
    const script = /<[ ]*script[^>]*>/g.exec(trimedCode)
    if (script) {
        // 如果找到了 <script> 标签，那么从该标签到 </script> 之间的内容被认为是 JS 部分
        js = trimedCode.substring(
            script.index + script[0].length,
            trimedCode.lastIndexOf('</script>')
        )
    } else {
        // 如果没有找到 <script> 标签，那么从 <script> 到 </script> 之间的内容被认为是 JS 部分
        js = trimedCode.substring(
            trimedCode.indexOf('<script>') + 8,
            trimedCode.lastIndexOf('</script>')
        )
    }

    let css = ''
    // 找到第一个 <style> 标签后的所有内容
    const styleCode = trimedCode.substring(trimedCode.indexOf('<style'))

    // 使用正则表达式找到所有的 <style>...</style> 块，并将它们的内容添加到 css 字符串中
    trimedCode.match(/(?<=(<style[\sa-z="']*[\\/]*[\sa-z="']*>))[\s\S]*?(?=()<\/style>)/g)?.forEach(str => css += str)

    let cssKey = 'css'
    // 检查 styleCode 中是否包含 'less'，如果包含，那么 cssKey 为 'less'
    if (styleCode.indexOf('\'less\'') > 0 || styleCode.indexOf('"less"') > 0) {
        cssKey = 'less'
    }

    // 返回一个包含所有部分的对象
    return {
        vue: trimedCode,  // 整个 Vue 文件的源代码
        html: html,  // HTML 部分的源代码
        template: `<template>${html}</template>`,  // 包含 <template> 标签的 HTML 部分的源代码
        css,  // CSS 部分的源代码
        lang: cssKey,  // 样式语言（'css' 或 'less'）
        js: js,  // JS 部分的源代码
    }
}

const jsToAst = (js) => {
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

    return JSAST
}

const astToJs = (ast) => {
    return  escodegen.generate(ast)
}
export {
    loadFile,
    genDataUrl,
    getAbsolutionPath,
    jsToAst,
    astToJs,
    splitVueFile
}
