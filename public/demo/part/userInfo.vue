<template>
  <ta-drawer
      @close='cancelModal_CI9A_visible'
      :visible='visible'
      :maskClosable="false"
      :destroy-on-close='true'
      title="用户信息"
      width='600px'
  >
    <ta-form :autoFormCreate='autoFormCreate_BMO99L37'>
      <ta-form-item
          label='姓名'
          fieldDecoratorId="name"
          :require="{message:'请输入姓名!'}">
        <ta-input   />
      </ta-form-item>
      <ta-form-item
          label='角色'
          fieldDecoratorId="role">
        <ta-select style="width: 100%">
          <ta-select-option value="1">开发人员</ta-select-option>
          <ta-select-option value="2">测试人员</ta-select-option>
          <ta-select-option value="3">运维人员</ta-select-option>
        </ta-select>
      </ta-form-item>
      <ta-form-item
          label='性别'
          fieldDecoratorId="sex"
          :require="{message:'请选择性别!'}">
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
          label='地址'
          fieldDecoratorId="address">
        <ta-textarea   />
      </ta-form-item>
    </ta-form>
    <div
        slot="footer"
    >
      <ta-button
          style="marginRight: 8px"
          @click="cancelModal_CI9A_visible"
      >
        取消
      </ta-button>
      <ta-button @click="save" type="primary">
        提交
      </ta-button>
    </div>
  </ta-drawer>
</template>
<script>
import $apii from '../api/api.js';
export default {
  name: 'userInfo',
  props: {
    visible: {
      type: Boolean,
    }
  },
  data( ) {
    return {
      userInfo: {},
    }
  },
  methods: {
    autoFormCreate_BMO99L37( form ) {
      this.form = form
    },
    init(userInfo) {
      if (userInfo) {
        this.userInfo = userInfo
        this.form.setFieldsValue(this.userInfo)
      } else {
        this.userInfo = {}
      }
    },
    save () {
      this.form.validateFields( (err) => {
        if (!err) {
          const formData = this.form.getFieldsValue()
          this.$emit('saveInfo', formData)
          this.$emit('close')
        }
      })
    },
    /** 默认生成的对话框关闭事件,请自行完善 **/
    cancelModal_CI9A_visible( ) {
      this.$emit('close')
    },
  },
}

</script>
<style scoped lang="css">

</style>
