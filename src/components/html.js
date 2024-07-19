import {generate} from "@/components/generate";

export const html = async (ast) => {

    //  生成代码
    const code = await generate(ast)

    const { css, script } = code
    const { importer, vue, globalVars } = script
    const { components, data, methods, mounted} = vue
    const { globalJs, globalCss, importMaps } = importer
    // 构建最终的HTML
    return `<html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <scri`+`pt>
        
          window.faceConfig= {}
        </scri`+`pt>
        <scri`+`pt src="http://localhost:8080/lib/vue.min.js"></scri`+`pt>
        <scri` + `pt src="https://lc.yinhaiyun.com/yh-material-unpkg/@yh/ta404-ui-dist@1.5.158/dist/ta404-ui.umd.js"></scri` + `pt>
        <scri` + `pt src="http://localhost:8080/lib/moment.min.js"></scri` + `pt>
        <scri`+`pt type="importmap">
          ${importMaps}
        </scri`+`pt>
        <link rel="stylesheet" type="text/css" href="https://lc.yinhaiyun.com/yh-material-unpkg/@yh/ta404-ui-dist@1.5.158/dist/style.css"></link>
        <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
      }

      #lowcode_preview {
        width: 100%;
        height: 100%;
      }
      </style>
      <style>
      ${globalCss}
      </style>
      <style>
      ${css}
      </style>
      <script type="module">
      const {h} = Vue;

      ${globalJs}
      
      ${globalVars}

      const option = {
        ${components},
        ${data},
        ${mounted},
        methods: {
          ${methods}
          renderNode(templateAst) {
            if (templateAst.type === 2 || templateAst.type === 3) {
              return templateAst.text
            }
            const attrsMap = templateAst.attrsMap
            for (const key in attrsMap) {
                if (key.startsWith(':')) {
                    let value
                    value = new Function('const { ' + Object.keys(this).join(',') +'} = this;return (' + attrsMap[key] +')').call(this)
                    attrsMap[key.slice(1)] = value
                    if (typeof value === 'string') {
                        delete attrsMap[key]
                    }
                }
            }
          const children = templateAst.children || []

          const scopedSlots = templateAst.scopedSlots || {}
          const scopedSlotsNodes = []
          for (const key in scopedSlots) {
              const slotName = key.replaceAll('"', '')
              this.slotScope =  scopedSlots[key].slotScope
              const template = h(
                  'template',
                  {
                    slot: slotName,
                    slotScope: scopedSlots[key].slotScope
                  },
                  scopedSlots[key].children.map(child => this.renderNode(child))
              )
              delete this.slotScope
              scopedSlotsNodes.push(template)
          }

          const events = {}

          for (const key in templateAst.events || {}) {
              try{
                  events[key] =
                      new Function('return (this.' + templateAst.events[key].value +')').call(this)
              } catch (e) {

              }

          }
          return h(
              templateAst.tag,
              {
                  props: attrsMap,
                  on: events,
                  class: [attrsMap.class]
              },
              [...children.map(child => this.renderNode(child)), ...scopedSlotsNodes]
          )
        },
      },
      render: function (h) {
          const templateAst = window.parent.templateAst
          return this.renderNode(templateAst)
      },
    }

    function onLoad() {
        new Vue(option).$mount('#lowcode_preview')
    }

    setTimeout(() => {
        onLoad()
    })
    </scri`+`pt>
</head>
<body>
<div style="height: 100%;width: 100%">
  <div id="lowcode_preview"></div>
</div>
</body>
</html>
`
}
