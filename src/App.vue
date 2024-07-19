<template>
  <div id="app">
    <DefaultCanvas/>
  </div>
</template>

<script>
import DefaultCanvas from "@/components/DefaultCanvas.vue";

export default {
  name: 'App',
  components: {
    DefaultCanvas,
  }
}
</script>

<style>
#app {
  height: 100%;
  width: 100%;
}
</style>
