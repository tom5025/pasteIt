<template>
    <div>
        <!-- top row with search and settings on the right -->
        <v-row>
            <v-col
                cols="2">

            </v-col>
            <v-col cols="8">
                <v-text-field
                label=""
                prepend-icon="search"
                @input="onSearchChange">
                </v-text-field>
            </v-col>
            <v-col cols="2" align="right">
                <v-tooltip left>
                    <template v-slot:activator="{ on }">
                        <v-btn
                                class="pasteIt--buttonFlat"
                                v-on="on"
                                v-on:click.stop="settingsDialogVisible = true"
                        >
                            <v-icon>
                                more_vert
                            </v-icon>
                        </v-btn>
                    </template>
                    <span>Settings</span>
                </v-tooltip>
            </v-col>
        </v-row>
        <!-- display contents -->
        <v-row>
            <v-col
                    cols="12"
                    xs="12">
                <v-list>
                    <template v-for="(item, index) in list">
                        <v-hover v-bind:key="item.idx" v-slot:default="{ hover }">
                            <v-list-item
                                    :class="{'ma-1 mt-2 align-center ma-0': true,
                                            'pasteIt--card border-radius-4': true,
                                            'on-hover': hover}"
                                    v-on:click="onItemClick(item)"
                            >
                                <v-list-item-content
                                 v-if="item.type === 'text' || item.type==='rtf'">
                                    <v-row>
                                        <v-col cols="11">
                                            {{item.text}}
                                        </v-col>
                                        <v-col cols="1">
                                            <!-- delete icon -->
                                            <div class="align-self-end">
                                                <v-tooltip left>
                                                    <template v-slot:activator="{ on }">
                                                        <v-btn
                                                                :class="{ 'show-btns ml-2': hover }"
                                                                color="transparent"
                                                                icon
                                                                v-on="on"
                                                                v-on:click.stop="onItemDeleteClick(item)">
                                                            <v-icon
                                                                    :class="{ 'show-btns': hover }"
                                                                    transparent>
                                                                delete_outline
                                                            </v-icon>
                                                        </v-btn>
                                                    </template>
                                                    <span>Delete item</span>
                                                </v-tooltip>
                                            </div>
                                        </v-col>
                                    </v-row>
                                </v-list-item-content>
                                <v-list-item-content
                                v-else-if="item.type === 'image'">
                                    <v-img
                                            :src="'data:image/png;base64,'+getImgBase64(item.data)">
                                        <!-- hover, actions icons -->
                                        <div class="align-self-center">
                                            <v-tooltip bottom>
                                                <template v-slot:activator="{ on }">
                                                    <v-btn :class="{ 'show-btns': hover }"
                                                           color="transparent"
                                                           icon
                                                           v-on="on"
                                                           v-on:click.stop="onItemZoomClick(item)">
                                                        <v-icon
                                                                :class="{ 'show-btns': hover }"
                                                                transparent
                                                                v-if="!zoomedState">
                                                            zoom_in
                                                        </v-icon>
                                                        <v-icon
                                                                :class="{ 'show-btns': hover }"
                                                                transparent
                                                                v-if="zoomedState">
                                                            zoom_out
                                                        </v-icon>
                                                    </v-btn>
                                                </template>
                                                <span v-if="zoomedState">Zoom out</span>
                                                <span v-else>Zoom in</span>
                                            </v-tooltip>
                                            <v-tooltip bottom>
                                                <template v-slot:activator="{ on }">
                                                    <v-btn
                                                            :class="{ 'show-btns ml-2': hover }"
                                                            color="transparent"
                                                            icon
                                                            :loading="ocrProcessing[index]"
                                                            v-on:click.stop="onItemOcrClick(item, index)"
                                                            v-on="on">
                                                        <v-icon
                                                                :class="{ 'show-btns': hover }"
                                                                transparent>
                                                            spellcheck
                                                        </v-icon>
                                                    </v-btn>
                                                </template>
                                                <span>
                                                    OCR - recognize characters on image
                                                </span>
                                            </v-tooltip>

                                        </div>
                                        <!-- delete icon -->
                                        <div class="align-self-end">
                                            <v-tooltip bottom>
                                                <template v-slot:activator="{ on }">
                                                    <v-btn
                                                            :class="{ 'show-btns ml-2': hover }"
                                                            color="transparent"
                                                            icon
                                                            v-on="on"
                                                            v-on:click.stop="onItemDeleteClick(item)">
                                                        <v-icon
                                                                :class="{ 'show-btns': hover }"
                                                                transparent>
                                                            delete_outline
                                                        </v-icon>
                                                    </v-btn>
                                                </template>
                                                <span>Delete item</span>
                                            </v-tooltip>
                                        </div>
                                    </v-img>
                                </v-list-item-content>
                            </v-list-item>
                        </v-hover>
                    </template>
                </v-list>
            </v-col>
        </v-row>
        <v-dialog
            v-model="settingsDialogVisible">
            <v-card>
                <v-card-title>
                    <v-row>
                        <v-col cols="11">
                            settings
                        </v-col>
                        <v-col cols="1">
                            <v-btn v-on:click.stop="settingsDialogVisible = false">
                                <v-icon>
                                    clear
                                </v-icon>
                            </v-btn>
                        </v-col>
                    </v-row>

                </v-card-title>
                <v-card-text>
                    <!-- erase data button -->
                    <v-row>
                        <v-btn color="error"
                               v-on:click.stop="onEraseData()"
                               :loading="erasingData">
                            Erase data
                        </v-btn>
                    </v-row>
                    <!-- launch with windows button -->
                    <v-row>
                        <v-checkbox
                            label="Launch with windows"
                        v-model="launchWithWindows"></v-checkbox>
                    </v-row>
                    <!-- max number of items value -->
                    <v-row>
                        <v-slider
                            v-model="maxNumberOfItemsValue"
                            label="Maximum number of items"
                            persistent-hint
                            step="10"
                            thumb-label="always"
                            ticks
                            max="150"
                        ></v-slider>
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-btn v-on:click.stop="settingsDialogVisible = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>


import ItemsDao from "../features/dao/itemsdao";
import DbManager from "../features/db";
const {ipcRenderer} = require('electron')
import { VList, VListItem, VListItemContent,
    VTooltip, VHover, VCol, VRow,
    VIcon, VBtn} from 'vuetify/lib'
import { bytesToBase64} from "../lib/base64";
import { bus } from "../main"
import debounce from 'lodash/debounce';
import Settings from "../features/settings";
const { createWorker } = require('tesseract.js');
const homedir = require('os').homedir();
const path = require('path');


const log = require('electron-log');
log.transports.file.level = 'debug';
log.transports.file.file = __dirname + 'pasteIt.log';


ipcRenderer.on('refreshContents', () => {
    console.log('trying to refresh vue contents')
    bus.$emit('refreshIt', null)
})

export default {
  name: 'Home',
    data: () => {
        return {
            list: null,
            zoomedState: false,
            itemsDao: null,
            dbManager: null,
            transparent: 'rgba(255, 255, 255, 0)',
            searchFilter: null,
            ocrProcessing: [],
            erasingData: false,
            settingsDialogVisible: false,
            //settings
            launchWithWindows: false,
            maxNumberOfItemsValue: 100
        }
    },
    components: {
      VList,
      VListItem,
      VListItemContent,
      VTooltip,
      VHover,
      VCol,
      VRow,
      VIcon,
      VBtn
    },
    created() {
      bus.$on('refreshIt', () => {
          this.refreshList()
      })
    },
    async mounted(){
      console.log("home.vue mounted event")
      await this.loadContents()
    },
    watch: {
      async searchFilter (value) {
          await this.refreshList(value)
      },
      maxNumberOfItemsValue(value) {
          ipcRenderer.send('settings-set-maxNumberOfItemsValue', value);
      }
    },
    methods: {
        onSearchChange: debounce(function (input) {
            this.searchFilter = input ? input.trim() : ''
        }, 500),

        async refreshList(searchStr) {
            let lst
            if (!searchStr || searchStr === '') {
                lst = (await this.itemsDao.getList()).rows
                console.log("retrieved items", lst)
            } else
            {
                console.log("search str is ", searchStr)
                lst = (await this.itemsDao.getByText(searchStr)).rows
                console.log("retrieved items with search ", searchStr, lst)
            }
            for (let i = 0; i < lst.length; i++) {
                this.ocrProcessing.push(false)
            }
            this.list = lst
        },
        async loadContents() {
            this.dbManager = new DbManager()
            this.dbManager.createDb()
            this.itemsDao = new ItemsDao(this.dbManager.db)
            const settings = new Settings();
            settings.read()
            this.maxNumberOfItemsValue = settings.settings.maxHistory
            await this.refreshList()
        },
        onItemZoomClick(item) {
            if (!this.zoomedState) {
                this.zoomedState = true
                window.resizeBy(350, 0)
            }
            else {
                this.zoomedState = false
                window.resizeBy(-350, 0)
            }
            console.log("zoom event", item)
        },
        async onItemOcrClick(item, index) {
          log.info('itemocrclick')
            this.ocrProcessing[index] = true;
            this.ocrProcessing = this.ocrProcessing.slice(0);
          log.info('itemocrclick 2')
          try {
            const worker = createWorker({
              workerPath:  'worker.min.js',
              workerBlobURL: false,
              //workerPath: 'https://unpkg.com/tesseract.js@v2.0.0/dist/worker.min.js',
              langPath: path.join(homedir, 'lang-data'),
              corePath: 'tesseract-core.wasm.js',
              //corePath: 'https://unpkg.com/tesseract.js-core@v2.0.0/tesseract-core.wasm.js',
            });


            await worker.load();

            await worker.loadLanguage('eng');

            await worker.initialize('eng');

            const { data: { text } } = await worker.recognize(item.data);

            await this.itemsDao.create('text', text, null)

            await this.refreshList()

          } catch (e) {
           log.error('error occured in ocr click', e)
         }
         log.info('itemocrclick 11')
          this.ocrProcessing[index] = false
        },
        pasteSomething(value) {
            ipcRenderer.send('paste-something', value)
        },
        onItemClick(item) {
            this.pasteSomething(item)
            console.log("clicked item", item)
        },
        async onEraseData() {
            if (confirm('Do you really want to erase all data?')) {
                this.erasingData = true
                await this.itemsDao.deleteAll()
                this.erasingData = false
                this.refreshList()
            }
        },
        async onItemDeleteClick(item) {
            console.log("delete item ", item)
            await this.itemsDao.delete(item.rowid)
            this.refreshList()
            console.log("deleted item")
        },
        getImgBase64(img) {
            return bytesToBase64(img)
        }
    }

}
</script>

<style lang="scss">

</style>

<style scoped>
    .v-list-item {
        transition: opacity .4s ease-in-out;
    }

    /*.v-list-item:not(.on-hover) {*/
    /*    opacity: 0.6;*/
    /*}*/

    .show-btns {
      color: rgba(32, 0, 0, 1) !important;
      background-color:gray
    }
</style>


