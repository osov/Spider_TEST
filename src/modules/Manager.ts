import { _UserMessages } from "../game_config";
import { register_lua_types } from "../utils/lua_types";
import { register_camera } from "./Camera";
import { MessageId, Messages, _SystemMessages, _ID_MESSAGES } from "./modules_const";

declare global {
    const Manager: ReturnType<typeof ManagerModule>;
    type UserMessages = _UserMessages;
    type SystemMessages = _SystemMessages;
    const ID_MESSAGES: typeof _ID_MESSAGES;
}

export function register_manager() {
    register_lua_types();
    (window as any).Manager = ManagerModule();
    (window as any).ID_MESSAGES = _ID_MESSAGES;
}


function ManagerModule() {
    function init() {
        document.addEventListener('pointerdown', on_pointer_down, false);
        document.addEventListener('pointerup', on_pointer_up, false);
        document.addEventListener('pointermove', on_pointer_move, false);
        document.addEventListener('pointercancel', on_pointer_cancel, false);
        document.addEventListener("click", (e) => e.preventDefault()); // IOS lock scaling

        // resize logic
        let last_resize = 0;
        let is_wait_resize = false;
        window.addEventListener('resize', (_e) => {
            last_resize = now();
            is_wait_resize = true;
        }, false);
        setInterval(() => {
            if (is_wait_resize) {
                if (now() - last_resize > 0.2) {
                    is_wait_resize = false;
                    Manager.send_game('MSG_ON_RESIZE', {});
                }
            }
        }, 100);
        register_camera();
    }


    function on_pointer_down(e: PointerEvent) {
        flow.on_message(ID_MESSAGES.MSG_TOUCH, { x: e.clientX, y: -e.clientY, pressed: true });
    }

    function on_pointer_up(e: PointerEvent) {
        flow.on_message(ID_MESSAGES.MSG_TOUCH, { x: e.clientX, y: -e.clientY, released: true });
    }

    function on_pointer_move(e: PointerEvent) {
        flow.on_message(ID_MESSAGES.MSG_TOUCH, { x: e.clientX, y: -e.clientY });
    }

    function on_pointer_cancel(e: PointerEvent) {
        log("Cancel event fired")
        flow.on_message(ID_MESSAGES.MSG_TOUCH, { x: e.clientX, y: -e.clientY, released: true, canceled: true });
    }

    function now() {
        return Date.now() / 1000;
    }

    function send_game<T extends MessageId>(message_id: T, message_data?: Messages[T], receiver = null) {
        flow.on_message(message_id, message_data, receiver);
    }

    init();

    return { send_game };

}