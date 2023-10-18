import * as TWEEN from "@tweenjs/tween.js"
import { is_intersect_zone } from "../utils/math_utils";
import { IGameItem } from './modules_const';

interface DragData {
    _hash: hash;
    click_pos: vector3;
    start_pos: vector3;
    z_index: number;
}

type CallbackFunction = () => void;

export function GoManager() {
    let go_list: hash[] = [];
    let game_items: IGameItem[] = [];
    const app_container = document.getElementById('app')!;

    function animate(_time: number) {
        TWEEN.update();
        requestAnimationFrame(animate)
    }

    function init() {
        requestAnimationFrame(animate)
    }

    function on_click(x: number, y: number, isDown: boolean, isMove = false) {
        if (isMove) {
            Manager.send_game('MSG_ON_MOVE', { x, y });
            return on_move(x, y);
        }
        if (isDown) {
            Manager.send_game('MSG_ON_DOWN', { x, y });
            return on_down(x, y);
        }
        else {
            on_up(x, y);
            Manager.send_game('MSG_ON_UP', { x, y });
        }
    }

    let cp = vmath.vector3();
    let sp = vmath.vector3();
    let down_item: IGameItem | null = null;
    let cur_x = 0; let cur_y = 0;
    let start_drag = true;
    function on_down(x: number, y: number) {
        cur_x = x;
        cur_y = y;
        down_item = null;
        const result = get_item_from_pos(x, y);
        if (!result)
            return;
        const [item, items] = result;
        down_item = item;
        cp = { x, y, z: 0 };
        sp = go.get_position(item._hash);
        start_drag = true;
        const hashes: hash[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            hashes.push(item._hash);
        }
        Manager.send_game('MSG_ON_DOWN_HASHES', { hashes });
        Manager.send_game('MSG_ON_DOWN_ITEM', { hash: item._hash, item });
    }

    function on_move(x: number, y: number) {
        cur_x = x;
        cur_y = y;
        process_dragging_list(x, y);

        if (!down_item)
            return;

        if (start_drag) {
            const dx = x - cp.x;
            const dy = y - cp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 10) {
                start_drag = false;
                Manager.send_game('MSG_ON_START_DRAG_ITEM', { hash: down_item._hash, item: down_item });
            }
        }

        if (!down_item.is_dragable)
            return;
        const _hash = down_item._hash;
        const src = go.get_position(_hash);
        const dp = { x: x - cp.x, y: y - cp.y, z: 0 } as vector3;
        const np = { x: sp.x + dp.x, y: sp.y + dp.y, z: 0 } as vector3;
        np.z = src.z;
        go.set_position(np, _hash);

        Manager.send_game('MSG_ON_MOVE_ITEM', { hash: down_item._hash, item: down_item });
    }

    function on_up(x: number, y: number) {
        cur_x = x;
        cur_y = y;
        start_drag = false;
        const result = get_item_from_pos(x, y);
        if (result) {
            const [_item, items] = result;
            const hashes: hash[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                hashes.push(item._hash);
            }
            Manager.send_game('MSG_ON_UP_HASHES', { hashes });
        }

        if (!down_item)
            return;
        const item = down_item;
        const dx = x - cp.x;
        const dy = y - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10)
            Manager.send_game('MSG_ON_CLICK_ITEM', { hash: item._hash, item });
        Manager.send_game('MSG_ON_UP_ITEM', { hash: item._hash, item });
        down_item = null;
    }

    function is_intersect(pos: vector3, item: IGameItem, inner_offset?: vector3) {
        return is_intersect_hash(pos, get_go_by_item(item), inner_offset);
    }

    function is_intersect_hash(pos: vector3, _go: hash, inner_offset = { x: 0, y: 0, z: 0 }) {
        return is_intersect_zone(pos, go.get_position(_go), get_go_sprite_size_hash(_go), go.get(_go, 'euler.z')!, inner_offset);
    }

    function get_item_from_pos(x: number, y: number): null | [IGameItem, IGameItem[]] {
        const tp = { x, y, z: 0 };
        const results = [];
        const zlist = [];

        for (let i = 0; i < game_items.length; i++) {
            const gi = game_items[i];
            const id = gi._hash;
            if (gi.is_clickable) {
                if (is_intersect(tp, gi)) {
                    results.push(gi);
                    const pos = go.get_world_position(id);
                    zlist.push(pos.z);
                }
            }
        }
        if (results.length > 0) {
            let result = results[0];
            let z = zlist[0];
            for (let i = 0; i < results.length; i++) {
                if (zlist[i] >= z) {
                    z = zlist[i];
                    result = results[i];
                }
            }
            return [result, results];
        }
        return null;
    }

    function get_go_by_item(item: IGameItem) {
        for (let i = 0; i < go_list.length; i++) {
            const id = go_list[i];
            if (id == item._hash)
                return id;
        }
        error('go not found(get_go_by_item)' + item._hash);
        return go_list[0];
    }

    function get_item_by_go(_hash: hash) {
        for (let i = 0; i < game_items.length; i++) {
            const item = game_items[i];
            if (_hash == item._hash)
                return item;
        }
        error('item not found(get_item_by_go)' + _hash);
        return game_items[0];
    }

    function make_go(name = 'cell', pos: vector3, is_add_list = false) {
        const template = document.getElementById(name);
        if (!template) {
            error('Шаблон не найден:', name);
            return document.createElement("div");
        }
        if (!template.style.width || !template.style.height) {
            error('Не заданы размеры для шаблона:', name);
            return document.createElement("div");
        }
        const item = template.cloneNode() as HTMLDivElement;
        item.removeAttribute('id');
        set_hash_prop(item, 'w', template.style.width.split('px').join(''))
        set_hash_prop(item, 'h', template.style.height.split('px').join(''))
        item.style.left = pos.x + 'px';
        item.style.top = pos.y + 'px';
        set_render_order_hash(item, pos.z);
        app_container.append(item);
        if (is_add_list)
            go_list.push(item);
        return item;
    }

    function add_game_item<T extends IGameItem>(gi: T, add_go_list = true) {
        game_items.push(gi);
        if (add_go_list)
            go_list.push(gi._hash);
    }

    function set_sprite_hash(_go: hash, id_anim: string) {
        _go.style.backgroundImage = `url(./assets/cards/${id_anim}.png)`;
        //_go.style.backgroundImage = `linear-gradient(to right, #ffffff00, #ffffff00), url(/assets/cards/${id_anim}.png)`;

        set_hash_prop(_go, 'sprite', id_anim);
    }

    function get_sprite_hash(_go: hash) {
        return get_hash_prop(_go, 'sprite') !== undefined ? get_hash_prop(_go, 'sprite')! : '';
    }

    function set_color_hash(_go: hash, _color: string, _alpha = 1, _name = 'sprite') {
        // todo
        // log('set_color_hash')
    }

    function get_go_sprite_size_hash(_go: hash) {
        return go._get_size(_go);
    }

    function set_position_xy_hash(_go: hash, x: number, y: number, align_x = 0.5, align_y = 0.5) {
        const pos = go.get_position(_go);
        pos.x = x;
        pos.y = y;
        if (align_x != 0.5 || align_y != 0.5) {
            const size = get_go_sprite_size_hash(_go);
            pos.x += (0.5 - align_x) * size.x;
            pos.y += (0.5 - align_y) * size.y;
        }
        go.set_position(pos, _go);
    }

    function get_render_order_hash(_go: hash) {
        return _go.style.zIndex !== undefined ? parseInt(_go.style.zIndex) : 0;
    }

    function set_render_order_hash(_go: hash, index: number) {
        _go.style.zIndex = index + '';
    }

    function rotate_to_with_time_hash(_go: hash, angle: number, timeSec: number, delay = 0, cb?: CallbackFunction) {
        const src = { val: get_hash_prop(_go, 'angle', 0) };
        const to = { val: angle };
        new TWEEN.Tween(src)
            .to(to, timeSec * 1000)
            .onUpdate(() => {
                _go.style.transform = `rotate(${src.val}deg)`;
                set_hash_prop(_go, 'angle', src.val);
            })
            .delay(delay * 1000)
            .onComplete(() => { if (cb) cb() })
            .start()
    }

    function move_to_with_time_hash(_go: hash, pos: vector3, timeSec: number, delay = 0, cb?: CallbackFunction) {
        const src = go.get_position(_go);
        new TWEEN.Tween(src)
            .to(pos, timeSec * 1000)
            .onUpdate(() => {
                go.set_position(src, _go);
            })
            .delay(delay * 1000)
            .onComplete(() => { if (cb) cb() })
            .start()
    }

    function do_scale_anim_hash(_go: hash, scale: vector3, timeSec: number, delay = 0, cb?: CallbackFunction) {
        const src = go.get_scale(_go);
        new TWEEN.Tween(src)
            .to(scale, timeSec * 1000)
            .onUpdate(() => {
                go.set_scale(src, _go);
            })
            .delay(delay * 1000)
            .onComplete(() => { if (cb) cb() })
            .start()
    }

    let drag_list: DragData[] = [];
    function start_dragging_list(list: hash[], inc_z_index = 0) {
        stop_dragging_list(list, true);
        const click_pos = { x: cur_x, y: cur_y, z: 0 };
        for (let i = 0; i < list.length; i++) {
            const h = list[i];
            const z_index = get_render_order_hash(h);
            set_render_order_hash(h, z_index + inc_z_index);
            drag_list.push({ _hash: h, click_pos, start_pos: go.get_position(h), z_index });
        }
    }

    function process_dragging_list(x: number, y: number) {
        const wp = { x, y, z: 0 };
        for (let i = 0; i < drag_list.length; i++) {
            const dl = drag_list[i];
            const _hash = dl._hash;
            const dp = { x: wp.x - dl.click_pos.x, y: wp.y - dl.click_pos.y, z: 0 } as vector3;
            const np = { x: dl.start_pos.x + dp.x, y: dl.start_pos.y + dp.y, z: 0 } as vector3;
            np.z = dl.start_pos.z;
            go.set_position(np, _hash);
        }
    }

    function stop_dragging_list(list: hash[], reset_pos = false) {
        for (let i = 0; i < list.length; i++) {
            const h = list[i];
            for (let j = drag_list.length - 1; j >= 0; j--) {
                const dl = drag_list[j];
                if (h == dl._hash) {
                    if (reset_pos)
                        go.set_position(dl.start_pos, dl._hash);
                    set_render_order_hash(dl._hash, dl.z_index);
                    drag_list.splice(j, 1);
                }
            }
        }
    }

    function stop_all_dragging(reset_pos = false) {
        const tmp: hash[] = [];
        for (let i = 0; i < drag_list.length; i++) {
            tmp.push(drag_list[i]._hash);
        }
        stop_dragging_list(tmp, reset_pos);
    }

    function reset_dragging_list(time: number, cb_end?: CallbackFunction) {
        let is_end = false;
        for (let i = 0; i < drag_list.length; i++) {
            const dl = drag_list[i];
            move_to_with_time_hash(dl._hash, dl.start_pos, time, 0, () => {
                if (!is_end) {
                    is_end = true;
                    stop_all_dragging();
                    if (cb_end)
                        cb_end();
                }
            });
        }
    }

    function do_message(message_id: string, message: any, _sender: hash) {
        if (message_id == ID_MESSAGES.MSG_TOUCH) {
            if (message.pressed)
                on_click(message.x, message.y, true);
            else if (message.released)
                on_click(message.x, message.y, false);
            else
                on_click(message.x, message.y, false, true);
        }
    }


    init();
    return {
        do_message,
        make_go, add_game_item, set_sprite_hash, set_color_hash, set_position_xy_hash, get_render_order_hash, set_render_order_hash, get_sprite_hash,
        do_scale_anim_hash, move_to_with_time_hash, rotate_to_with_time_hash,
        get_item_by_go,
        start_dragging_list, stop_all_dragging, stop_dragging_list, reset_dragging_list
    };

}