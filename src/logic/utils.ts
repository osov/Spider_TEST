import { DcNums, DcMast, CardData } from "./card";

export function make_card_list(level: number) {
    const list: CardData[] = [];
    for (let d = 0; d < 2; d++) {
        for (let m = 0; m < DcMast.length; m++) {
            for (let n = 0; n < DcNums.length; n++) {
                const idMast = m % level;
                const cn = { mast: DcMast[idMast], nom: DcNums[n] };
                list.push(cn);
            }
        }
    }
    return list;
}

export function get_random_numbers(count: number) {
    const list: number[] = [];
    for (let i = 0; i < count; i++) {
        list.push(i);
    }
    for (let i = 0; i < list.length; i++) {
        const r = math.random(0, list.length - 1);
        const tmp = list[r];
        list[r] = list[i];
        list[i] = tmp;
    }
    return list;
}

export function is_equal_pos(p1: vector3, p2: vector3, sigma = 0.001) {
    return (math.abs(p1.x - p2.x) < sigma && math.abs(p1.y - p2.y) < sigma);
}