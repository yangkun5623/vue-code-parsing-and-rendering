<template>
  <div style="height: 100%;width: 100%">
    <div class="tab">
      <button v-for="(tab, index) in tabs" :class="{ 'active': tab.active }" :key="index" @click="openTab(tab)">{{ tab.name }}</button>
    </div>
    <div class="container">
      <div v-show="tabs[0].active" class="iframe" style="height: calc(100% - 44px)">
        <iframe ref="iframe"  id="iframe"/>
      </div>
      <div class="iframe" v-show="tabs[1].active">
        <json-editor-vue mode="text"
                         v-model="ast"/>
      </div>
      <pre class="iframe" v-show="tabs[2].active">
        <code  id="code">
          {{htmls}}
        </code>
      </pre>
    </div>
  </div>
</template>

<script  >
import JsonEditorVue from 'json-editor-vue'
import { html_beautify as htmlBeautify } from 'js-beautify'
import {loadFile} from "@/components/utils";
import { html } from '@/components/html'
import 'highlight.js/styles/atom-one-dark.css'
import   highlight from 'highlight.js'
import {compiler} from "@/components/compiler";
export default {
  name: 'DefaultCanvas',
  components: {
    JsonEditorVue
  },
  data () {
    return {
      tabs: [
        { name: '预览效果', type: 'preview', active: true },
        { name: 'Ast', type: 'ast', active: false },
        { name: 'HTML 代码', type: 'html', active: false },
      ],
      htmls: '',
      ast: {}
    }
  },
  async mounted() {

    //  获取vue代码
    const mainPage = await loadFile('http://localhost:8080/demo/mainPage.vue')
    // 将vue代码转换为ast

    this.ast = compiler(mainPage)

    // 将template数据通过window传递给iframe,以便后续在脚本中用h函数去渲染节点
    window.templateAst = this.ast.templateAst

    // 将ast数据转换为html
    const srcdoc = await html(this.ast)


    // 美化html
    this.htmls = htmlBeautify(srcdoc)


    // 渲染html
    setTimeout(() => {
      if (this.$refs.iframe) {
        this.$refs.iframe.srcdoc = this.htmls
      }

      // 代码高亮
      highlight.highlightBlock(document.querySelector('#code'))
    })


  },
  methods: {
    openTab(selectedTab) {
      this.tabs.forEach(tab => {
        tab.active = (tab === selectedTab);
      });
    }
  }
}
</script>
<style scoped>
#iframe{
  height: 100%;
  width: 100%;
  border: none;
}

.iframe{
  height: auto;
  width: auto;
  margin: 20px;
}

.tab {
  overflow: hidden;
  border: 1px solid #ccc;
  background-color: #f1f1f1;
}

.tab button {
  background-color: inherit;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 10px 15px;
  transition: 0.3s;
  height: 38px;
}

.tab button:hover {
  background-color: #ddd;
}

.tab button.active {
  background-color: #ccc;
}

.container{
  height: calc(100% - 60px);
  overflow: auto;
  width: 100%;
}
</style>
