/* eslint-disable @typescript-eslint/no-empty-function */
import { CallbackCb, DcTransitionItems, StateItemInfo, TransitionInfoCallback, TransitionList } from "../logic_state_machine/state_interfaces";

interface TaskData {
    id: number;
    is_active: boolean;
    state: StateItemInfo;
    transitions: TransitionList;
}

export function TransitionManager(get_transitions_cb: TransitionInfoCallback) {
    let order_item_transitions: number[] = [];
    let transition_mode_one_item: DcTransitionItems = DcTransitionItems.SEQUENCE;
    let transition_mode_items: DcTransitionItems = DcTransitionItems.SEQUENCE;
    const process_list: TaskData[] = [];
    let go_list: hash[];
    let cb_processed: CallbackCb;
    let is_applying = false;
    let is_processing = false;
    let current_task_id = 0;
    let id_task_counter = 0;

    // задаем список гошек, которыми будем манипулировать
    function set_go_list(list: hash[]) {
        go_list = list;
    }

    // задаем порядок следования переходов DcTransitionStates
    function set_order_trasitions(list: number[]) {
        order_item_transitions = list;
    }

    // настройка способа выполнения переходов между всеми объектами SEQUENCE/PARALLEL
    function set_transition_mode_items(mode: DcTransitionItems) {
        transition_mode_items = mode;
    }

    // настройка способа выполнения переходов для одного объекта SEQUENCE/PARALLEL
    function set_transition_mode_one_item(mode: DcTransitionItems) {
        transition_mode_one_item = mode;
    }

    function get_task_by_id(id: number) {
        for (let i = 0; i < process_list.length; i++) {
            const task = process_list[i];
            if (task.id == id)
                return task;
        }
        return null;
    }

    function is_all_done() {
        for (let i = 0; i < process_list.length; i++) {
            const task = process_list[i];
            if (task.is_active) {
                return false;
            }
        }
        return true;
    }

    // из списка удаляем завершенные действия
    function clear_processing_list() {
        for (let i = process_list.length - 1; i >= 0; i--) {
            const task = process_list[i];
            if (!task.is_active)
                process_list.splice(i, 1);
        }
    }

    // приходит список состояний для обработки
    // дальше нужно их преобразовать в действия
    function apply_states(states: StateItemInfo[]) {
        clear_processing_list();
        is_processing = true;
        is_applying = true;
        for (let i = 0; i < states.length; i++) {
            add_processing_state(states[i]);
        }
        is_applying = false;
        if (is_all_done()) {
            do_all_processed();
        }
    }

    // помечаем завершенными прошлые анимации для конкретной гошки, 
    // т.к. анимация отменится при запуске новой и соответственно колбек не сработает
    function skip_old_task(task: TaskData) {
        for (let i = 0; i < process_list.length; i++) {
            const find_task = process_list[i];
            if (task.id != find_task.id &&
                task.state.id_item == find_task.state.id_item &&
                (transition_mode_items == DcTransitionItems.PARALLEL || (transition_mode_items == DcTransitionItems.SEQUENCE && find_task.id < task.id))
            ) {
                //log('cancel id:', _task.state.id_item);
                find_task.is_active = false;
            }
        }
    }

    // добавляем задачу в очередь обработки
    function add_processing_state(state: StateItemInfo) {
        id_task_counter++;
        const item = { id: id_task_counter, is_active: true, state, transitions: get_transitions_cb(state) };
        process_list.push(item);

        if (transition_mode_items == DcTransitionItems.PARALLEL) {
            process_task(item);
        }
        else if (transition_mode_items == DcTransitionItems.SEQUENCE) {
            // если еще не запущены задачи и это первая то запускаем
            if (current_task_id == 0) {
                current_task_id = id_task_counter;
                process_task(item);
            }
        }
    }

    function wait_all_trasitions_done(task: TaskData, cb_end: CallbackCb) {
        const all = order_item_transitions.length;
        let cnt = 0;
        for (let i = 0; i < order_item_transitions.length; i++) {
            const id_trasition = order_item_transitions[i];
            process_transition(task, id_trasition, () => {
                cnt++;
                if (cnt == all)
                    cb_end();
            });
        }
    }

    // запуск задачи для гошки(рекурсивно выполняются все переходы)
    function process_task(task: TaskData, cur_index = 0) {
        // перешагнули индекс из списка всех переходов, помечаем задачу завершенной
        if (cur_index > order_item_transitions.length - 1) {
            //log("processed");
            next_task(task);
            return;
        }
        // в момент начала обработки удаляем старые задачи для этой гошки
        if (cur_index == 0)
            skip_old_task(task);
        const id_trasition = order_item_transitions[cur_index];

        if (transition_mode_one_item == DcTransitionItems.SEQUENCE)
            process_transition(task, id_trasition, () => process_task(task, cur_index + 1));
        else if (transition_mode_one_item == DcTransitionItems.PARALLEL)
            wait_all_trasitions_done(task, () => next_task(task));
    }

    function process_transition(task: TaskData, id_trasition: number, cb_end: CallbackCb) {
        for (let i = 0; i < task.transitions.length; i++) {
            const [task_trasition, task_fnc] = task.transitions[i];
            if (task_trasition == id_trasition) {
                const _go = go_list[task.state.id_item];
                task_fnc(_go, () => cb_end());
                return true;
            }
        }
        error('run_transition не найден переход', id_trasition, task);
        cb_end();
        return false;
    }


    function next_task(cur_task: TaskData) {
        //log('next task', process_list.length);
        cur_task.is_active = false;
        if (transition_mode_items == DcTransitionItems.SEQUENCE) {
            const next_id = current_task_id + 1;
            const next_t = get_task_by_id(next_id);
            if (next_t != null) {
                current_task_id = next_id;
                process_task(next_t);
            }
            else {
                do_all_processed();
            }
        }
        else if (transition_mode_items == DcTransitionItems.PARALLEL) {
            if (is_all_done()) {
                do_all_processed();
            }
        }
    }

    function do_all_processed() {
        // во время обработки очереди нельзя завершить задачи
        current_task_id = 0;
        if (!is_applying) {
            on_all_processed();
        }
    }

    function on_all_processed() {
        if (!is_processing)
            return;
        is_processing = false;
        log('all task processed');
        if (cb_processed != null)
            cb_processed();
    }

    function is_all_processed() {
        return !is_processing;
    }

    function set_callback_processed(cb: CallbackCb) {
        cb_processed = cb;
    }

    return { apply_states, set_order_trasitions, set_transition_mode_items, set_transition_mode_one_item, is_all_processed, set_callback_processed, set_go_list };
}