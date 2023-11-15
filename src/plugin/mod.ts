import {PhenoUI} from "./PhenoUI";
import {MessageBus} from "../shared/MessageBus";

figma.root.setRelaunchData({ open: ''});

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
    width: 240,
    height: 600,
    themeColors: true
});

const phenoUI = new PhenoUI();

figma.on('run', evt => {
    const messageBus = new MessageBus(figma, [phenoUI]);
    messageBus.printID('plugin');

    phenoUI.handleOpen(evt);
    messageBus.execute('sayHello', 'tolito', { to: 'toplo' });
});

figma.on('selectionchange', () => {
    phenoUI.printTypes(figma.currentPage.selection);
    // figma.ui.postMessage('selectionchange');
});


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
