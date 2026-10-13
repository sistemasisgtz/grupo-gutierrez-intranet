// =========================================================
// GRUPO GUTIERREZ
// YO · FOTO DEL EMPLEADO
// =========================================================

(() => {

    "use strict";


    const db =
        window.ggSupabase;


    const BUCKET =
        "employee-photos";


    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );


    // =====================================================
    // START
    // =====================================================

    function initialize() {


        if (
            !db
            ||
            !document.getElementById(
                "yoAvatar"
            )
        ) {

            return;

        }


        // Dejamos cargar primero el dashboard
        // y después traemos la foto.

        const run =
            () => {

                void loadEmployeePhoto();

            };


        if (
            "requestIdleCallback"
            in
            window
        ) {

            window.requestIdleCallback(
                run,
                {
                    timeout:
                        1200
                }
            );

        }

        else {

            window.setTimeout(
                run,
                250
            );

        }

    }


    // =====================================================
    // FOTO
    // =====================================================

    async function loadEmployeePhoto() {


        const token =
            sessionStorage.getItem(
                "gg_intranet_token"
            );


        if (
            !token
        ) {

            return;

        }


        try {


            const {
                data:
                    photoPath,

                error

            } =
                await db.rpc(

                    "intranet_get_employee_photo",

                    {

                        p_session_token:
                            token

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            if (
                !photoPath
            ) {

                return;

            }


            const {
                data
            } =
                db
                    .storage
                    .from(
                        BUCKET
                    )
                    .getPublicUrl(
                        photoPath
                    );


            const publicUrl =
                data?.publicUrl;


            if (
                !publicUrl
            ) {

                return;

            }


            const avatar =
                document.getElementById(
                    "yoAvatar"
                );


            const image =
                document.getElementById(
                    "yoEmployeePhoto"
                );


            if (
                !avatar
                ||
                !image
            ) {

                return;

            }


            image.onload =
                () => {

                    avatar.classList
                        .add(
                            "has-photo"
                        );

                };


            image.onerror =
                () => {

                    avatar.classList
                        .remove(
                            "has-photo"
                        );

                };


            image.src =
                publicUrl;

        }

        catch (
            error
        ) {

            console.error(
                "[YO FOTO]",
                error
            );

        }

    }

})();