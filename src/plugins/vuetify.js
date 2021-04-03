import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        dark: true,
        themes: {
            dark: {
                primary: '#607d8b',
                secondary: '#cddc39',
                accent: '#ff5722',
                error: '#f44336',
                warning: '#ff9800',
                info: '#00bcd4',
                success: '#4caf50'
            }
        }
    }
});
