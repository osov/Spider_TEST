/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-interface */
export type VoidCallback = () => void;
export type Messages = UserMessages & SystemMessages;
export type MessageId = keyof Messages;

export interface IGameItem {
    _hash: hash;
    is_clickable?: boolean;
    is_dragable?: boolean;
}

export interface VoidMessage { }
export interface NameMessage extends VoidMessage { name: string; }
export interface InterMessage extends VoidMessage { is_check: boolean; }
export interface ValMessage extends VoidMessage { val: boolean; }
export interface SndMessage extends NameMessage { volume: number; speed: number }
export interface PosXYMessage extends VoidMessage { x: number; y: number }
export interface HashesMessage extends VoidMessage { hashes: hash[] }
export interface ItemMessage extends VoidMessage { hash: hash; item: IGameItem }

export type _SystemMessages = {
    PLAY_SND: SndMessage,
    STOP_SND: NameMessage,
    ON_SOUND_PAUSE: ValMessage,
    RESTART_SCENE: VoidMessage,
    LOAD_SCENE: NameMessage,
    SHOW_RATE: VoidMessage,
    APPLY_CUSTOM_LANG: VoidMessage,
    SCENE_LOADED: NameMessage,
    MANAGER_READY: VoidMessage,
    SHOW_REWARD: VoidMessage,
    SHOW_INTER: InterMessage,
    SHOW_BANNER: VoidMessage,
    HIDE_BANNER: VoidMessage,
    MSG_ON_MOVE: PosXYMessage,
    MSG_ON_DOWN: PosXYMessage,
    MSG_ON_UP: PosXYMessage,

    MSG_ON_DOWN_HASHES: HashesMessage,
    MSG_ON_DOWN_ITEM: ItemMessage,
    MSG_ON_MOVE_ITEM: ItemMessage,
    MSG_ON_UP_HASHES: HashesMessage,
    MSG_ON_UP_ITEM: ItemMessage,
    MSG_ON_CLICK_ITEM: ItemMessage,
    MSG_ON_START_DRAG_ITEM: ItemMessage,
    MSG_ON_RESIZE: VoidMessage,
};

export const _ID_MESSAGES = {
    MSG_TOUCH: ('touch'),
    MSG_ON_MOVE: ('MSG_ON_MOVE'),
    MSG_ON_DOWN: ('MSG_ON_DOWN'),
    MSG_ON_UP: ('MSG_ON_UP'),
    MSG_ON_DOWN_HASHES: ('MSG_ON_DOWN_HASHES'),
    MSG_ON_UP_HASHES: ('MSG_ON_UP_HASHES'),
    MSG_ON_DOWN_ITEM: ('MSG_ON_DOWN_ITEM'),
    MSG_ON_UP_ITEM: ('MSG_ON_UP_ITEM'),
    MSG_ON_MOVE_ITEM: ('MSG_ON_MOVE_ITEM'),
    MSG_ON_CLICK_ITEM: ('MSG_ON_CLICK_ITEM'),
    MSG_ON_START_DRAG_ITEM: ('MSG_ON_START_DRAG_ITEM'),
    MSG_ON_REWARDED: ('MSG_ON_REWARDED')
};