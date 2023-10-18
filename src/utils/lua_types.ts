declare global {
    type hash = HTMLDivElement
    const get_hash_prop: typeof _get_hash_prop
    const set_hash_prop: typeof _set_hash_prop
    const json: ReturnType<typeof json_module>
    const math: ReturnType<typeof math_module>
    const vmath: ReturnType<typeof vmath_module>
    const go: ReturnType<typeof go_module>
    const flow: ReturnType<typeof flow_module>
    type vector3 = {
        x: number,
        y: number,
        z: number,
    }
    type AnyTable = { [k: string | number]: any }
    const log: (..._args: any) => void
    const error: (..._args: any) => void
}

function _get_hash_prop(_go: hash, prop: string, def: any = null) {
    return (_go.dataset[prop] !== undefined ? _go.dataset[prop] : def) as typeof def;
}

function _set_hash_prop(_go: hash, prop: string, val: string | number | boolean) {
    _go.dataset[prop] = val + '';
}

//
// ---------------------------------------------------------------------
//

function flow_module() {
    const stack_messages: [string, AnyTable, null][] = [];
    let promise: Promise<void> | null;
    let _resolver: () => void;
    let is_ready = true;

    function init_promise() {
        promise = new Promise((resolve) => _resolver = resolve);
    }
    init_promise();

    async function delay(sec: number) {
        await delay_fnc(sec * 1000);
    }

    function _set_active(val: boolean) {
        is_ready = val;
    }

    async function until_any_message(): Promise<[string, AnyTable, null]> {
        while (true) {
            if (stack_messages.length > 0) {
                promise = null;
                return stack_messages.shift()!;
            }
            if (promise) {
                await promise;
            }
            else {
                init_promise();
            }
        }
    }

    function on_message(message_id: string, message: any, sender = null): void {
        if (!is_ready)
            return;
        stack_messages.push([message_id, message, sender]);
        _resolver();
    }

    return { until_any_message, on_message, delay, _set_active };
}

//
// ---------------------------------------------------------------------
//

function math_module() {

    function random(min: number, max: number) {
        var min = Math.ceil(min);
        var max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function abs(v: number) {
        return Math.abs(v);
    }

    return { random, abs }

}

//
// ---------------------------------------------------------------------
//

function vmath_module() {

    function vector3(x = 0, y = 0, z = 0) {
        return { x, y, z };
    }

    return { vector3 }
}

//
// ---------------------------------------------------------------------
//

function go_module() {

    function get(_go: hash, prop: string) {
        if (prop == 'euler.z') {
            return 0;
        }
        else {
            error('Свойство не объявлено:', prop, _go);
        }
    }

    function set_scale(scale: vector3, _go: hash) {
        const old_pos = get_position(_go);
        set_hash_prop(_go, 'sx', scale.x.toFixed(2));
        set_hash_prop(_go, 'sy', scale.y.toFixed(2));
        const size = _get_size(_go)
        _go.style.width = size.x + 'px';
        _go.style.height = size.y + 'px';
        set_position(old_pos, _go);
    }

    function _get_size(_go: hash) {
        const w = get_hash_prop(_go, 'w', 1) as number;
        const h = get_hash_prop(_go, 'h', 1) as number;
        const scale = get_scale(_go);
        return { x: w * scale.x, y: h * scale.y, z: 1 };
    }

    function set_position(pos: vector3, _go: hash) {
        const offset = _get_size(_go);
        _go.style.left = (pos.x - offset.x * 0.5) + 'px';
        _go.style.top = (-pos.y - offset.y * 0.5) + 'px';
    }

    function get_position(_go: hash) {
        const offset = _get_size(_go);
        return { x: _go.offsetLeft + offset.x / 2, y: -_go.offsetTop - offset.y / 2, z: _go.style.zIndex != undefined ? parseInt(_go.style.zIndex) : 0 };
    }

    function get_world_position(_go: hash) {
        return get_position(_go); // todo local
    }

    function get_scale(_go: hash) {
        const x = get_hash_prop(_go, 'sx') != null ? parseFloat(get_hash_prop(_go, 'sx')!) : 1;
        const y = get_hash_prop(_go, 'sy') != null ? parseFloat(get_hash_prop(_go, 'sy')!) : 1;
        return { x, y, z: 1 }
    }

    return { get, set_scale, set_position, get_position, get_scale, _get_size, get_world_position }
}

//
// ---------------------------------------------------------------------
//

function json_module() {
    function encode(data: any) {
        return JSON.stringify(data)
    }

    function decode(s: string) {
        return JSON.parse(s)
    }

    return { encode, decode }
}

//
// ---------------------------------------------------------------------
//

function get_args_str(..._args: any) {
    let str = '';
    for (const k in _args) {
        const a = _args[k];
        if (typeof a == 'object') {
            str += json.encode(a) + ', ';
        }
        else
            str += a + ', ';
    }
    if (str != '')
        str = str.substr(0, str.length - 2);
    return str
}

function delay_fnc(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }


export function register_lua_types() {
    (window as any).json = json_module();
    (window as any).math = math_module();
    (window as any).vmath = vmath_module();
    (window as any).go = go_module();
    (window as any).flow = flow_module();
    (window as any).get_hash_prop = _get_hash_prop;
    (window as any).set_hash_prop = _set_hash_prop;
    (window as any).log = (..._args: any) => console.log(get_args_str(..._args));
    (window as any).error = (..._args: any) => console.error(get_args_str(..._args));
}