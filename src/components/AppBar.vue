<template>
    <div>
        <div class="d-flex align-center">
            <router-link to ="/">
                <v-img
                        alt="Vuetify Logo"
                        class="shrink mr-2"
                        contain
                        src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
                        transition="scale-transition"
                        width="40"
                />
            </router-link>

            <v-img
                    alt="Vuetify Name"
                    class="shrink mt-1 hidden-sm-and-down"
                    contain
                    min-width="100"
                    src="https://cdn.vuetifyjs.com/images/logos/vuetify-name-dark.png"
                    width="100"
            />
        </div>

        <v-spacer></v-spacer>

    </div>

</template>

<script>

    export default {
        name: "AppBar",
        data() {
            return {
                authenticated: false,
                currentUser: null,
                loading: false
            }
        },
        methods: {
        },

        mounted() {
        }
    }
</script>

<style scoped>

</style>
