/*
    Модуль для работы с камерой и преобразованиями
*/

declare global {
    const Camera: ReturnType<typeof CameraModule>;
}

export function register_camera() {
    (window as any).Camera = CameraModule();
}

function CameraModule() {

    function get_ltrb_bounds() {
        return [0, 0, window.innerWidth, window.innerHeight];
    }

    return { get_ltrb_bounds };

}
