import {PhenoUI} from "./PhenoUI";
import {MessageBus} from "../shared/MessageBus";


// Skip over invisible nodes and their descendants inside instances
// for faster performance.
// this is going to be problematic one day... a problem for future Dario!
figma.skipInvisibleInstanceChildren = true

// install the relaunch plugin menu when nothing is selected
figma.root.setRelaunchData({ open: ''});

// This shows the HTML page in "ui.html".
// TODO: Choose a sensible size once the UI is fully designed.
figma.showUI(__html__, {
    width: 240,
    height: 600,
    themeColors: true
});

const messageBus = new MessageBus(figma, []);
const phenoUI = new PhenoUI(figma, messageBus);
console.log(phenoUI); // huh? sorry future Dario!


// // Calls to "parent.postMessage" from within the HTML page will trigger this
// // callback. The callback will be passed the "pluginMessage" property of the
// // posted message.
// figma.ui.onmessage = msg => {
//     // One way of distinguishing between different types of messages sent from
//     // your HTML page is to use an object with a "type" property like this.
//     if (msg.type === 'create-rectangles') {
//         console.log('Hello PhenoUI!');
//     }
//
//     // Make sure to close the plugin when you're done. Otherwise the plugin will
//     // keep running, which shows the cancel button at the bottom of the screen.
//     figma.closePlugin();
// };
