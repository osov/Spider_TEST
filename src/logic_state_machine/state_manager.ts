/* eslint-disable @typescript-eslint/no-empty-function */

import { TransitionInfoCallback, StateSetInfo, StateItemInfo, StateInfo, DcTransitionItems } from "./state_interfaces";
import { TransitionManager } from "./transition_manager";

export function StateManager(transition_info_cb: TransitionInfoCallback) {
    const states_set: StateSetInfo = {};
    const transition_manager = TransitionManager(transition_info_cb);
    let states_changed_list: StateItemInfo[] = [];
    let force_apply = false;

    // задаем список гошек, которыми будем манипулировать
    function set_go_list(list: hash[]) {
        transition_manager.set_go_list(list);
    }

    // настройка способа выполнения переходов для одного объекта SEQUENCE/PARALLEL
    function configure_seq_item(mode: DcTransitionItems) {
        transition_manager.set_transition_mode_one_item(mode);
    }

    // настройка способа выполнения переходов между всеми объектами SEQUENCE/PARALLEL
    function configure_seq_list_items(mode: DcTransitionItems) {
        transition_manager.set_transition_mode_items(mode);
    }

    // передаем текущий стейт id объекта(из set_go_list) и маску информации + доп индекс если нужен
    function update_states(id: number, mask: number, index: number) {
        let old_state: null | StateInfo = null;
        if (states_set[id] != undefined)
            old_state = states_set[id];
        const new_state: StateInfo = { mask, index };
        states_set[id] = new_state;

        if (force_apply || (old_state == null || (old_state.index != new_state.index || old_state.mask != new_state.mask)))
            on_state_changed(id, old_state, new_state);
    }

    function on_state_changed(id_item: number, old_state: StateInfo | null, new_state: StateInfo) {
        states_changed_list.push({ id_item, state: new_state, old_state });
    }

    // применяем все изменения из собранных состояний
    function apply_state() {
        //log('apply state[' + states_changed_list.length + ']');
        if (states_changed_list.length > 0)
            transition_manager.apply_states(states_changed_list);
        states_changed_list = [];
    }

    function set_force_apply(val: boolean) {
        force_apply = val;
    }

    return { set_go_list, update_states, apply_state, configure_seq_item, configure_seq_list_items, transition_manager, set_force_apply };
}