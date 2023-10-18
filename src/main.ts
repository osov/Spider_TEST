import { register_manager } from "./modules/Manager";
import { Game } from "./logic/game_logic";

register_manager();
Game();


document.getElementById('btn_back')!.onclick = function () {
    Manager.send_game('BTN_BACK');
}

document.getElementById('btn_help')!.onclick = function () {
    Manager.send_game('BTN_HELP');
}
document.getElementById('btn_restart')!.onclick = function () {
    Manager.send_game('BTN_RESTART');
}