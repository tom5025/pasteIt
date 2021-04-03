<template>
  <v-app>
    <v-content>
      <v-container fluid>
        <router-view>

        </router-view>
      </v-container>

    </v-content>

  </v-app>
</template>

<script>

export default {
  name: 'App',
  components: {
  },
  data: () => ({
    //
  }),
};
</script>


<style lang="scss">
  @import "./styles/app.scss";
  /*html, body {*/
  /*  overflow-y: auto;*/
  /*}*/
</style>
