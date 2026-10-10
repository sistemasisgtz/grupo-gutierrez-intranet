// =========================================================
// GRUPO GUTIERREZ
// LOGIN INTRANET "YO"
// =========================================================

(() => {

    "use strict";


    const db =
        window.ggSupabase;


    // =====================================================
    // CREAR MODAL
    // =====================================================

    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "yoLoginOverlay";


    overlay.className =
        "yo-login-overlay";


    overlay.innerHTML = `

        <div
            class="yo-login-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="yoLoginTitle"
        >

            <button
                type="button"
                id="yoLoginClose"
                class="yo-login-close"
                aria-label="Cerrar"
            >
                ×
            </button>


            <div class="yo-login-content">


                <div class="yo-login-avatar">

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <circle
                            cx="12"
                            cy="8"
                            r="3.5"
                        ></circle>

                        <path
                            d="
                                M5.5 19
                                C6.2 15.4
                                8.6 13.5
                                12 13.5
                                C15.4 13.5
                                17.8 15.4
                                18.5 19
                            "
                        ></path>

                    </svg>

                </div>


                <span class="yo-login-kicker">
                    GRUPO GUTIERREZ · INTRANET
                </span>


                <h2 id="yoLoginTitle">
                    Mi espacio
                </h2>


                <p class="yo-login-description">
                    Ingresa con el usuario y contraseña
                    de Intranet asignados por Recursos Humanos.
                </p>


                <form id="yoLoginForm">


                    <div class="yo-login-field">

                        <label for="yoLoginUsername">
                            Usuario
                        </label>

                        <input
                            type="text"
                            id="yoLoginUsername"
                            autocomplete="username"
                            required
                        >

                    </div>


                    <div class="yo-login-field">

                        <label for="yoLoginPassword">
                            Contraseña
                        </label>


                        <div class="yo-password-wrap">

                            <input
                                type="password"
                                id="yoLoginPassword"
                                autocomplete="current-password"
                                required
                            >

                            <button
                                type="button"
                                id="yoPasswordToggle"
                                class="yo-password-toggle"
                            >
                                VER
                            </button>

                        </div>

                    </div>


                    <button
                        type="submit"
                        id="yoLoginSubmit"
                        class="yo-login-submit"
                    >
                        Entrar a mi espacio
                    </button>


                    <div
                        id="yoLoginMessage"
                        class="yo-login-message"
                    >
                    </div>


                </form>


                <div class="yo-login-footer">

                    <span class="yo-login-security-dot">
                    </span>

                    Acceso personal protegido

                </div>


            </div>

        </div>

    `;


    document.body
        .appendChild(
            overlay
        );


    // =====================================================
    // DOM
    // =====================================================

    const form =
        document.getElementById(
            "yoLoginForm"
        );


    const usernameInput =
        document.getElementById(
            "yoLoginUsername"
        );


    const passwordInput =
        document.getElementById(
            "yoLoginPassword"
        );


    const submitButton =
        document.getElementById(
            "yoLoginSubmit"
        );


    const message =
        document.getElementById(
            "yoLoginMessage"
        );


    // =====================================================
    // INTERCEPTAR BOTÓN YO
    //
    // CAPTURE PHASE:
    // evita que home.js procese el mismo click.
    // =====================================================

    document.addEventListener(

        "click",

        event => {


            const button =
                event.target.closest(
                    '[data-entry="yo"]'
                );


            if (
                !button
            ) {

                return;

            }


            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            openLogin();

        },

        true

    );


    // =====================================================
    // OPEN
    // =====================================================

    function openLogin() {


        form.reset();


        message.textContent =
            "";


        passwordInput.type =
            "password";


        document.getElementById(
            "yoPasswordToggle"
        )
        .textContent =
            "VER";


        overlay.classList
            .add(
                "active"
            );


        window.setTimeout(
            () => {

                usernameInput.focus();

            },
            100
        );

    }


    // =====================================================
    // CLOSE
    // =====================================================

    function closeLogin() {


        overlay.classList
            .remove(
                "active"
            );


        form.reset();


        message.textContent =
            "";

    }


    document.getElementById(
        "yoLoginClose"
    )
    .addEventListener(
        "click",
        closeLogin
    );


    // =====================================================
    // PASSWORD
    // =====================================================

    document.getElementById(
        "yoPasswordToggle"
    )
    .addEventListener(

        "click",

        event => {


            const hidden =
                passwordInput.type ===
                "password";


            passwordInput.type =
                hidden
                    ?
                    "text"
                    :
                    "password";


            event.currentTarget
                .textContent =
                hidden
                    ?
                    "OCULTAR"
                    :
                    "VER";

        }

    );


    // =====================================================
    // LOGIN
    // =====================================================

    form.addEventListener(

        "submit",

        async event => {


            event.preventDefault();


            if (
                !db
            ) {

                message.textContent =
                    "No fue posible conectar con la Intranet.";

                return;

            }


            const username =
                usernameInput
                    .value
                    .trim();


            const password =
                passwordInput
                    .value;


            if (
                !username
                ||
                !password
            ) {

                message.textContent =
                    "Ingresa usuario y contraseña.";

                return;

            }


            submitButton.disabled =
                true;


            submitButton.textContent =
                "Verificando acceso...";


            message.textContent =
                "";


            try {


                const {
                    data,
                    error
                } =
                    await db.rpc(
                        "intranet_login",
                        {

                            p_username:
                                username,

                            p_password:
                                password

                        }
                    );


                if (
                    error
                ) {

                    throw error;

                }


                const session =
                    Array.isArray(
                        data
                    )
                        ?
                        data[0]
                        :
                        data;


                if (
                    !session?.session_token
                ) {

                    throw new Error(
                        "No fue posible iniciar la sesión."
                    );

                }


                // =========================================
                // SOLO SESSION STORAGE
                //
                // Se elimina al cerrar la pestaña.
                // =========================================

                sessionStorage.setItem(
                    "gg_intranet_token",
                    session.session_token
                );


                sessionStorage.setItem(
                    "gg_intranet_expires_at",
                    session.expires_at
                    ||
                    ""
                );


                passwordInput.value =
                    "";


                submitButton.textContent =
                    "Acceso autorizado ✓";


                window.setTimeout(
                    () => {

                        window.location.href =
                            "yo.html";

                    },
                    300
                );

            }

            catch (
    error
) {

    console.error(
        "[INTRANET LOGIN]",
        error
    );


    message.textContent =
        error?.message
        ||
        error?.details
        ||
        error?.hint
        ||
        "Error desconocido al iniciar sesión.";

}

            finally {


                if (
                    !window.location.href
                        .endsWith(
                            "yo.html"
                        )
                ) {

                    submitButton.disabled =
                        false;


                    submitButton.textContent =
                        "Entrar a mi espacio";

                }

            }

        }

    );

})();