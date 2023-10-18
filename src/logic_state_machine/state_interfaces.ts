
export interface StateInfo {
    mask: number;
    index: number;
}

export interface StateItemInfo {
    id_item: number;
    state: StateInfo;
    old_state: StateInfo | null;
}

export interface StateSetInfo {
    [k: number]: StateInfo;
}

export enum DcTransitionItems {
    SEQUENCE,
    PARALLEL
}

export type CallbackCb = () => void;
export type TransitionFnc = (_go: hash, cb: CallbackCb) => void;

export type TransitionList = [number, TransitionFnc][];
export type TransitionInfoCallback = (state_info: StateItemInfo) => TransitionList;