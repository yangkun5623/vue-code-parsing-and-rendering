import beautifier from "js-beautify";

// 正则表达式用于匹配 CSS 注释
const commentX = /\/\*[\s\S]*?\*\//g
// 正则表达式用于匹配 CSS 中的不同部分（注释、选择器、属性）
const altX = /(\/\*[\s\S]*?\*\/)|([^\s;{}][^;{}]*(?=\{))|(\})|([^;{}][a-z-@\d]*:+[\d\s,@./:=&a-zA-Z-%!?#()()"']*[;|\n|\r](?!\s*\*\/))/gim
// 判断一个变量是否为空的函数
const  isEmpty = function (x) {
  // noinspection PointlessBooleanExpressionJS
  return typeof x == 'undefined' || x.length === 0 || x === null
}

const capComment = 1
const capSelector = 2
const capEnd = 3
const capAttr = 4

/**
 * Input is css string and current pos, returns JSON object
 *
 * @param cssString
 *            The CSS string.
 * @param args
 *            An optional argument object. ordered: Whether order of
 *            comments and other nodes should be kept in the output. This
 *            will return an object where all the keys are numbers and the
 *            values are objects containing "name" and "value" keys for each
 *            node. comments: Whether to capture comments. split: Whether to
 *            split each comma separated list of selectors.
 */
const defaultArgs = {
  ordered: false, // 保持属性的顺序
  comments: true, // 是否捕获注释
  stripComments: false, // 是否移除注释
  split: false, // 选择器是否按逗号分隔
}

/**
 * 解析 CSS 字符串，并根据不同的部分（注释、选择器、属性）构建 JSON 对象。
 * 支持在 CSS 中保留注释、保持顺序、拆分选择器等功能。
 * 检测并保存 CSS 中的 @import 语句。
 * 处理 CSS 中的注释、选择器、属性等内容，并构建相应的 JSON 结构。
 * {
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
 * @param cssString
 * @param args
 * @returns {{children: {}, attributes: {}, comment: string, importContent: string}}
 */
export const styles = function (
  cssString,
  args = defaultArgs
) {
  if (cssString) {
    cssString = beautifier.css(cssString)
  }

  // 创建一个表示 CSS 结构的节点对象
  const node = {
    children: {},
    attributes: {},
    comment: '',
    importContent: '', // 直接用字符串存起来
  }

  let match = null
  let count = 0
  // 将所有 import 语句存储在 importContent 中
  const filterCssString = cssString.substring(0, cssString.indexOf('{'))
  const reg = /@import.*?;/g
  const importContentList = filterCssString.match(reg) ?? []
  if(importContentList.length > 0){
    node.importContent = importContentList.join('\n')
  }
  // 选择项，删除注释内容
  if (args.stripComments) {
    args.comments = false
    cssString = cssString.replace(commentX, '')
  }

  let tempComment = []
  while ((match = altX.exec(cssString)) != null) {
    if (!isEmpty(match[capComment]) && args.comments) {
      // 捕获注释
      // 暂存注释
      node[count++] = match[capComment].trim()
      tempComment.push(match[capComment].trim())
    } else if (!isEmpty(match[capSelector])) {
      // 如果捕获到选择器
      // 则构建新的节点
      const name = match[capSelector].trim() // 选择器
      // This will return when we encounter a closing brace
      const newNode = styles(cssString, args)
      if (args.ordered) {
        // Since we must use key as index to keep order and not
        // name, this will differentiate between a Rule Node and an
        // Attribute, since both contain a name and value pair.
        node[count++] = { name, value: newNode, type: 'rule', }
      } else {
        newNode.comment = tempComment.join('\n')
        tempComment = []
        const bits = args.split ? name.split(',') : [name] // 分割选择器
        for (const i in bits) {
          const sel = bits[i].trim()
          if (sel in node.children) {
            for (const att in newNode.attributes) {
              node.children[sel].attributes[att] = newNode.attributes[att]
            }
          } else {
            node.children[sel] = newNode
          }
        }
      }
    } else if (!isEmpty(match[capEnd])) {
      // 节点结束
      return node
    } else if (!isEmpty(match[capAttr])) {
      // 节点属性处理
      const line = match[capAttr].trim()
      if (line) {
        let index = line?.indexOf(':')
        const attr = [line.slice(0, index), line.slice(index+1, line.length)]
        // Attribute
        const name = attr[0].trim()
        const value = attr[1].trim()
        if (args.ordered) {
          node[count++] = { name, value, type: 'attr', }
        } else {
          if (name in node.attributes) {
            const currVal = node.attributes[name]
            if (!(currVal instanceof Array)) {
              node.attributes[name] = [currVal]
            }
            node.attributes[name].push(value)
          } else {
            node.attributes[name] = value
          }
        }
      } else {
        // Semicolon terminated line
        node[count++] = line
      }
    }
  }
  return node
}
