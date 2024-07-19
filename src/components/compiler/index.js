import {transformJs} from "@/components/compiler/javascript";
import {styles} from "@/components/compiler/styles";
import {compile} from '@/components/compiler/template'
import {splitVueFile} from "@/components/utils";


export const compiler = (code) => {
    // 分割vue代码
    const {
        css,
        html,
        js,
    } = splitVueFile(code)

    //  解析template代码为AST
    const templateAst = compile(html).ast

    //  解析script代码为AST
    const scriptAst = transformJs(js)

    // 解析style
    const styleAst = styles(css)

    // 返回AST
    return { templateAst, scriptAst, styleAst }
}
