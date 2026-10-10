// =========================================================
// GRUPO GUTIERREZ
// LOGIN PARA BOTÓN "SISTEMA"
// =========================================================

(() => {

    "use strict";


    // =====================================================
    // UI
    // =====================================================

    let overlay =
        null;

    let form =
        null;

    let emailInput =
        null;

    let passwordInput =
        null;

    let message =
        null;

    let submitButton =
        null;


    // =====================================================
    // INIT
    // =====================================================

    function initializeSystemLogin() {

        injectLoginModal();

        bindSystemButton();

        bindModalEvents();

    }


    // =====================================================
    // CREATE MODAL
    // =====================================================

    function injectLoginModal() {

        if (
            document.getElementById(
                "systemLoginOverlay"
            )
        ) {

            return;

        }


        const element =
            document.createElement(
                "div"
            );


        element.id =
            "systemLoginOverlay";


        element.className =
            "system-login-overlay";


        element.innerHTML = `

            <div
                class="system-login-card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="systemLoginTitle"
            >

                <div class="system-login-line">
                </div>


                <div class="system-login-content">


                    <div class="system-login-header">


                        <div class="system-login-heading">


                            <div class="system-login-icon">
                                ◇
                            </div>


                            <div>

                                <span class="system-login-kicker">
                                    GRUPO GUTIERREZ
                                </span>

                                <h2 id="systemLoginTitle">
                                    Acceso al Sistema
                                </h2>

                                <p>
                                    Ingresa con tus credenciales corporativas.
                                </p>

                            </div>


                        </div>


                        <button
                            type="button"
                            id="systemLoginClose"
                            class="system-login-close"
                            aria-label="Cerrar"
                        >
                            ×
                        </button>


                    </div>


                    <div class="system-login-divider">
                    </div>


                    <form id="systemLoginForm">


                        <div class="system-login-field">

                            <label for="systemLoginEmail">
                                Correo
                            </label>

                            <div class="system-login-input-wrap">

                                <input
                                    type="email"
                                    id="systemLoginEmail"
                                    placeholder="usuario@empresa.com"
                                    autocomplete="username"
                                    required
                                >

                            </div>

                        </div>


                        <div class="system-login-field">

                            <label for="systemLoginPassword">
                                Contraseña
                            </label>

                            <div class="system-login-input-wrap">

                                <input
                                    type="password"
                                    id="systemLoginPassword"
                                    placeholder="••••••••••••"
                                    autocomplete="current-password"
                                    required
                                >


                                <button
                                    type="button"
                                    id="systemPasswordToggle"
                                    class="system-password-toggle"
                                    aria-label="Mostrar contraseña"
                                >
                                    ◉
                                </button>

                            </div>

                        </div>


                        <div
                            id="systemLoginMessage"
                            class="system-login-message"
                        >
                        </div>


                        <button
                            type="submit"
                            id="systemLoginSubmit"
                            class="system-login-submit"
                        >
                            Entrar al Sistema
                        </button>


                    </form>


                    <div class="system-login-footer">

                        <span class="system-login-security-dot">
                        </span>

                        <span>
                            Autenticación protegida por Supabase
                        </span>

                    </div>


                </div>

            </div>

        `;


        document.body.appendChild(
            element
        );


        overlay =
            element;


        form =
            document.getElementById(
                "systemLoginForm"
            );


        emailInput =
            document.getElementById(
                "systemLoginEmail"
            );


        passwordInput =
            document.getElementById(
                "systemLoginPassword"
            );


        message =
            document.getElementById(
                "systemLoginMessage"
            );


        submitButton =
            document.getElementById(
                "systemLoginSubmit"
            );

    }


    // =====================================================
    // INTERCEPTAR SISTEMA
    //
    // CAPTURE = TRUE
    // ASÍ CORREMOS ANTES DEL home.js ORIGINAL.
    // =====================================================

    function bindSystemButton() {

        document.addEventListener(

            "click",

            event => {

                const button =
                    event.target.closest(
                        '[data-entry="sistema"]'
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

    }


    // =====================================================
    // MODAL EVENTS
    // =====================================================

    function bindModalEvents() {

        document
            .getElementById(
                "systemLoginClose"
            )
            .addEventListener(

                "click",

                closeLogin

            );


        document
            .getElementById(
                "systemPasswordToggle"
            )
            .addEventListener(

                "click",

                togglePassword

            );


        form.addEventListener(

            "submit",

            handleLogin

        );


        // NO CERRAMOS HACIENDO CLICK FUERA.
        // SOLO CON X.

    }


    // =====================================================
    // OPEN
    // =====================================================

    function openLogin() {

        clearMessage();


        emailInput.value =
            "";


        passwordInput.value =
            "";


        overlay.classList
            .add(
                "active"
            );


        window.setTimeout(

            () => {

                emailInput.focus();

            },

            80

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


        passwordInput.value =
            "";


        clearMessage();

    }


    // =====================================================
    // PASSWORD
    // =====================================================

    function togglePassword() {

        const visible =
            passwordInput.type ===
            "text";


        passwordInput.type =

            visible
                ? "password"
                : "text";

    }


    // =====================================================
    // LOGIN
    // =====================================================

    async function handleLogin(
        event
    ) {

        event.preventDefault();


        clearMessage();


        if (
            !window.ggSupabase
        ) {

            showMessage(
                "No se pudo conectar con el sistema de autenticación."
            );

            return;

        }


        const email =
            emailInput.value
                .trim();


        const password =
            passwordInput.value;


        if (
            !email
            ||
            !password
        ) {

            showMessage(
                "Escribe tu correo y contraseña."
            );

            return;

        }


        setLoading(
            true
        );


        try {


            const {
                data,
                error
            } =
                await window.ggSupabase
                    .auth
                    .signInWithPassword({

                        email:
                            email,

                        password:
                            password

                    });


            if (
                error
                ||
                !data?.user
            ) {

                console.error(
                    "[SYSTEM LOGIN]",
                    error
                );


                showMessage(
                    "Correo o contraseña incorrectos."
                );


                return;

            }


            // =================================================
            // SUCCESS
            // =================================================

            submitButton.textContent =
                "Acceso autorizado ✓";


            await delay(
                420
            );


            window.location.href =
                "sistema.html";


        }

        catch (
            error
        ) {

            console.error(
                "[SYSTEM LOGIN]",
                error
            );


            showMessage(
                "No fue posible iniciar sesión. Intenta nuevamente."
            );

        }

        finally {

            setLoading(
                false
            );

        }

    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showMessage(
        text
    ) {

        message.textContent =
            text;


        message.classList
            .add(
                "active"
            );

    }


    function clearMessage() {

        message.textContent =
            "";


        message.classList
            .remove(
                "active"
            );

    }


    // =====================================================
    // LOADING
    // =====================================================

    function setLoading(
        loading
    ) {

        submitButton.disabled =
            loading;


        submitButton.textContent =

            loading
                ? "Validando acceso..."
                : "Entrar al Sistema";

    }


    // =====================================================
    // DELAY
    // =====================================================

    function delay(
        milliseconds
    ) {

        return new Promise(

            resolve => {

                window.setTimeout(
                    resolve,
                    milliseconds
                );

            }

        );

    }


    // =====================================================
    // START
    // =====================================================

    initializeSystemLogin();

})();