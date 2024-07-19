
<template>
  <div class="container">
    <div class="header">
      <ta-form
          :autoFormCreate='autoFormCreate_RFG8COD7'
          :formLayout='true'
      >
        <ta-form-item
            label='姓名'
            fieldDecoratorId="name" >
          <ta-input   />
        </ta-form-item>
        <ta-form-item
            label='角色'
            fieldDecoratorId="role">
          <ta-select style="width: 100%" :options="roles">
          </ta-select>
        </ta-form-item>
        <ta-form-item
            label='性别'
            fieldDecoratorId="sex" >
          <ta-select style="width: 100%">
            <ta-select-option value="1">男</ta-select-option>
            <ta-select-option value="2">女</ta-select-option>
          </ta-select>
        </ta-form-item>
        <ta-form-item
            label='年龄'
            fieldDecoratorId="age">
          <ta-input-number />
        </ta-form-item>

        <ta-form-item
            :labelCol='{"span":7}'
            :showInfo='true'
            :span='6'
            :wrapperCol='{"span":17}'
            field-decorator-id='_button-60PSHLM5'
            label=' '
            style="text-align: left;"
        >
          <ta-button type='primary'>查询</ta-button>

          <ta-button @click="addInfo">新增</ta-button>
        </ta-form-item>
      </ta-form>
    </div>
    <div class="body">
      <div class="left">
        <ta-e-tree :data='treeData' show-checkbox></ta-e-tree>
      </div>
      <div class="right">
        <ta-big-table
            :data='dataSource_25GS38'
            height='auto'
        >
          <ta-big-table-column type='seq'></ta-big-table-column>

          <ta-big-table-column
              field='name'
              title='姓名'
          ></ta-big-table-column>

          <ta-big-table-column
              field='role'
              title='角色'
          ></ta-big-table-column>

          <ta-big-table-column
              field='sex'
              title='性别'
          ></ta-big-table-column>

          <ta-big-table-column
              field='age'
              title='年龄'
          ></ta-big-table-column>

          <ta-big-table-column
              field='address'
              title='地址'
          ></ta-big-table-column>

          <ta-big-table-column
              field='date'
              title='时间'
              width="160px"
          ></ta-big-table-column>

        </ta-big-table>
      </div>
    </div>
    <user-info ref="userInfo" @close="closeInfo" @saveInfo="saveInfo" :visible="userInfoVisible"/>
  </div>
</template>
<script>

import $api from './api/api.js'
import UserInfo from "./part/userInfo.vue";
import { treeData } from './api/utils.js'
import rsCommonLoading from '@vusion/rs-common-loading';
const roles = [
  { value: '1', label: '开发人员' },
  { value: '2', label: '测试人员' },
  { value: '3', label: '运维人员' }
]
import moment from 'moment'
import './css/index.css'
export default {
  components: {
    UserInfo,
    RsCommonLoading: rsCommonLoading
  },
  data( ) {
    return {
      form_RFG8COD7: undefined,
      userInfoVisible: false,
      dataSource_25GS38: [],
      treeData: treeData(),
      roles,
    }
  },
  mounted( ) {
    this.loadData_25GS38( )
  },
  methods: {
    autoFormCreate_RFG8COD7( form ) {
      this.form_RFG8COD7 = form
    },
    /** 分页组件触发查询表格数据的方法,需要设置url和ref属性 **/
    loadData_25GS38( ) {
      this.dataSource_25GS38 = $api.queryTableData()
      this.dataSource_25GS38.forEach( e => {
        e.date = moment().add(-Math.random()*20, 'day').format('YYYY-MM-DD HH:mm:ss')
      })
    },
    addInfo () {
      this.userInfoVisible = true
    },
    closeInfo () {
      this.userInfoVisible = false
    },
    saveInfo (info) {
      info.date = moment().format('YYYY-MM-DD HH:mm:ss')
      this.dataSource_25GS38.push(info)
    }
  },
}

</script>
<style scoped lang="css">
.container{
  height: 100%;
  width: 100%;
  background: #ECF1F4;
  padding: 10px;

  .aaaa{
    width: auto;
    background: white;
  }
}
/** 设置滚动条的样式 **/
.header{
  height: 150px;
  background: white;
  padding: 10px;
}
.body{
  height: calc(100% - 170px);
  display: flex;
  margin-top: 10px;
}
.left{
  width: 256px;
  height: 100%;
  background: white;
  padding: 10px;
}
.right{
  flex: 1;
  margin-left: 10px;
  background: white;
  padding: 10px;
}
</style>
