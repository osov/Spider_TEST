interface VoidData { }
interface IdData { id: number }

// пользовательские сообщения под конкретный проект, доступны типы через глобальную тип-переменную UserMessages
export type _UserMessages = {
    BTN_BACK: VoidData
    BTN_HELP: VoidData
    BTN_RESTART: VoidData
    CLICK_CARD: IdData
    DRAG_CARD: IdData
    DROP_STACK: { id_stack: number, id_card: number }
};