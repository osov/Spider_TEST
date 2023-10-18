export function set_flag(num: number, index: number, val: boolean) {
    const v_or = 2 << index;
    const v_and = ~v_or;
    if (val)
        return num | v_or;
    else
        return num & v_and;
}

export function is_flag(num: number, index: number) {
    const v_or = 2 << index;
    return (num & v_or) == v_or;
}