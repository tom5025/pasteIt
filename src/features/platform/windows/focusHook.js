// const ffi = require('ffi'),
//     ref = require('ref');
//
// const user32 = new ffi.Library('user32', {
//     'SetWindowsHookExW': [intPtr, ['int', 'pointer', intPtr, 'int']],
//     'CallNextHookEx': [intPtr, ['int', intPtr ,intPtr]],
//     'UnhookWindowsHookEx': ['bool', [intPtr]],
// });
//
// function callback(nCode, wParam, lParam){
//     console.log(lParam);
//     return user32.CallNextHookEx(nCode, wParam, lParam);
// }
//
// const intPtr = ref.refType('int');
// const funcPtr = ffi.Callback(intPtr, ['int', intPtr, intPtr], callback);
//
//
// const hook = user32.SetWindowsHookExW(13, funcPtr, ref.NULL, 0);
//
import {intToHex} from "vuetify/lib/util/colorUtils";


const ffi = require('ffi')
const ref = require('ref')
const nativeImage  = require('electron').nativeImage

const intPtr = ref.refType('int');
const lpdwordPtr = ref.refType(ref.types.ulong);

const user32 = new ffi.Library('user32', {
    // 'SetWindowsHookExW': [intPtr, ['int', 'pointer', intPtr, 'int']],
    // 'CallNextHookEx': [intPtr, ['int', intPtr ,intPtr]],
    // 'UnhookWindowsHookEx': ['bool', [intPtr]],
    'SetFocus': ['long', ['long']],
    'GetFocus': ['long', []],
    'GetForegroundWindow': ['long', []],
    'GetWindowThreadProcessId': ['long', ['long', lpdwordPtr]],
    'keybd_event': ["void", ["int32", "int32", "int32", "int32"]],
    'AttachThreadInput': ['bool', ['long', 'long', 'bool']]
});

const kernel32 = new ffi.Library('kernel32', {
    'GetCurrentThreadId': ['long', []]
})

const { clipboard } = require('electron')


export default class FocusHook {
    getAppliWinHandle() {
        let activeWindowHandle = null
        let activeWindowThread = null
        let thisThread = null
        let result = user32.GetFocus()
        if (result === 0) {
            activeWindowHandle = user32.GetForegroundWindow()
            if (activeWindowHandle !== 0) {
                let pid = ref.alloc(lpdwordPtr);
                activeWindowThread = user32.GetWindowThreadProcessId(activeWindowHandle, pid)
                thisThread = kernel32.GetCurrentThreadId()
                if (user32.AttachThreadInput(activeWindowThread, thisThread, true)) {
                    result = user32.GetFocus()
                    user32.AttachThreadInput(activeWindowThread, thisThread, false)
                }
            }
        }
        return result
    }

    saveFocusedControl(mainWindowHandle) {
        const h = this.getAppliWinHandle()
        if (h !== mainWindowHandle) this.focusedControlHwnd = h
        //console.log("saved handle", this.focusedControlHwnd)
        return this.focusedControlHwnd
    }

    pasteSomething(item) {
        if (item.type === 'text') clipboard.writeText(item.text)
        else if (item.type === 'image') {
            const img = nativeImage.createFromBuffer(Buffer.from(item.data))
            clipboard.writeImage(img)
        }
        else if (item.type === 'rtf') {
            clipboard.writeRTF(item.text)
        }
        if (!this.focusedControlHwnd) {
            console.log('! No focused control hwnd !')
            return
        }
        console.log('focused control hwnd : ', this.focusedControlHwnd ? intToHex(this.focusedControlHwnd) : '')
        let activeWindowHandle = this.focusedControlHwnd
        let thisThread = null
        if (activeWindowHandle !== 0) {
            let pid = ref.alloc(lpdwordPtr);
            let activeWindowThread = user32.GetWindowThreadProcessId(activeWindowHandle, pid)
            thisThread = kernel32.GetCurrentThreadId()
            if (user32.AttachThreadInput(activeWindowThread, thisThread, true)) {
                user32.SetFocus(activeWindowHandle)

                user32.keybd_event(0x11, 0, 0, 0);
                user32.keybd_event(0x56, 0, 0, 0);
                user32.keybd_event(0x56, 0, 0x0002, 0);
                user32.keybd_event(0x11, 0, 0x0002, 0);

                user32.AttachThreadInput(activeWindowThread, thisThread, false)
            }
        }
    }
}



