import { CardState } from "./card";

type CardList = number[];



export interface GameState {
    stack_list_ids: CardList[];
    home_ids: CardList;
    stopka_ids: CardList;
    cards: CardState[];
}

export enum DcCardStates {
    NONE,
    OPENED,
    STOPKA, STOPKA_CARD_1, STOPKA_CARD_2, STOPKA_CARD_3, STOPKA_CARD_4, STOPKA_CARD_5,
    HOME,
    STACK_1, STACK_2, STACK_3, STACK_4, STACK_5, STACK_6, STACK_7, STACK_8, STACK_9, STACK_10,
}

export enum DcTransitionStates {
    RENDER_ORDER,
    POSITION,
    OPENED
}

