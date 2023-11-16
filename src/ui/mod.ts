import {MessageBus} from "../shared/MessageBus";
import {UIManager} from "./UIManager";


async function main() {
    const messageBus = new MessageBus(window, []);
    const manager = new UIManager(document.body, messageBus);
    console.log(manager); // huh?, there's another onel ike this on the other side... sorry future Dario...
}

document.addEventListener('DOMContentLoaded', main);