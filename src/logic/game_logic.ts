/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-empty-function */

import { CardData, CardState } from './card';
import { get_random_numbers, make_card_list } from './utils';
import { ViewController } from './view_controller';
import { GameState } from './states';
import { DcTransitionItems } from '../logic_state_machine/state_interfaces';
import { Messages } from '../modules/modules_const';


export function Game() {
    const view = ViewController();
    // logic
    const dc_card_list: CardData[] = []; // Данные о номиналах карт
    let game_state: GameState = {
        stack_list_ids: [],
        home_ids: [],
        stopka_ids: [],
        cards: [] // все игровые карты по порядку с их состояниями
    };

    async function init() {
        init_cards();
        view.init(dc_card_list);
        start_or_resume_game();
        wait_event();
    }


    function init_cards() {
        const tmp = make_card_list(1);
        for (let i = 0; i < tmp.length; i++) {
            const cd = tmp[i];
            dc_card_list.push(cd);
        }
    }

    function start_or_resume_game() {
        for (let i = 0; i < 10; i++)
            game_state.stack_list_ids.push([]);
        new_game();
    }

    async function new_game() {

        const id_cards = get_random_numbers(dc_card_list.length);
        for (let i = 0; i < id_cards.length; i++) {
            game_state.cards.push({ is_open: false });
            const id = id_cards[i];
            add_to_stopka(id);
        }

        view.state_manager.configure_seq_list_items(DcTransitionItems.PARALLEL);
        view.configure_times(0, 0);
        await view.apply_state(game_state, true);

        log('begin >>>');

        view.configure_times(0.5, 0.2);
        view.state_manager.configure_seq_list_items(DcTransitionItems.PARALLEL);

        //return
        for (let j = 0; j < 6; j++) {
            for (let i = 0; i < 10; i++) {
                if (j > 4 && i > 3) {
                    // continue
                }
                else {
                    const id_card = take_stopka();
                    add_to_stack(id_card, i);
                    game_state.cards[id_card].is_open = (i > 3 && j > 3) || (j == 5);
                    await view.apply_state(game_state, false);
                }
            }
        }



        await view.wait_animations();
        log('end processing');
    }


    function add_to_stack(id_card: number, id_stack: number) {
        game_state.stack_list_ids[id_stack].push(id_card);
    }

    function add_to_home(id_card: number) {
        game_state.home_ids.push(id_card);
    }

    function add_to_stopka(id_card: number) {
        game_state.stopka_ids.push(id_card);
    }

    function take_stopka() {
        return game_state.stopka_ids.shift()!;
    }

    async function wait_event() {
        while (true) {
            const [message_id, _message, sender] = await flow.until_any_message();
            view.do_message(message_id, _message, sender);

            if (message_id == 'BTN_BACK') {
                log('BTN_BACK');
            }

            if (message_id == 'BTN_RESTART') {
                log('BTN_RESTART');
            }

            if (message_id == 'BTN_HELP') {
                log('BTN_HELP');
            }

            if (message_id == 'DRAG_CARD') {
                const message = _message as Messages['DRAG_CARD'];
                const id_card = message.id;
                log('DRAG_CARD:', id_card);

                for (let i = 0; i < game_state.stack_list_ids.length; i++) {
                    const cards = game_state.stack_list_ids[i];
                    if (cards.includes(id_card)) {
                        const cards = game_state.stack_list_ids[i];
                        const tmp = cards.slice(cards.indexOf(id_card), cards.length);
                        view.start_drag(tmp);
                        break;
                    }
                }
            }
            if (message_id == 'DROP_STACK') {
                const message = _message as Messages['DROP_STACK'];
                log('DROP_STACK', message);
                view.cancel_drag();
            }
        }
    }


    init();
    return {};
}

