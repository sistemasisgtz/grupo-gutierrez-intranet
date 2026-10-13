// =========================================================
// GRUPO GUTIERREZ
// RECURSOS HUMANOS
// FOTO DE EMPLEADO
// =========================================================

(() => {

    "use strict";


    const db =
        window.ggSupabase;


    const BUCKET =
        "employee-photos";


    const MAX_FILE_SIZE =
        5
        *
        1024
        *
        1024;


    const ALLOWED_TYPES =
        new Set([

            "image/jpeg",

            "image/png",

            "image/webp"

        ]);


    let currentEmployeeId =
        null;


    let currentPhotoPath =
        null;


    let selectedFile =
        null;


    let removeRequested =
        false;


    let previewObjectUrl =
        null;


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
                "employeeForm"
            )
        ) {

            return;

        }


        injectPhotoField();

        bindEvents();

        resetPhotoEditor();

    }


    // =====================================================
    // INSERTAR CAMPO
    // =====================================================

    function injectPhotoField() {


        const grid =
            document.querySelector(
                "#employeeForm .module-form-grid"
            );


        if (
            !grid
            ||
            document.getElementById(
                "rhEmployeePhotoField"
            )
        ) {

            return;

        }


        const field =
            document.createElement(
                "div"
            );


        field.id =
            "rhEmployeePhotoField";


        field.className =
            `
            module-field-full
            rh-photo-field
            `;


        field.innerHTML = `

            <div class="rh-photo-heading">

                <div>

                    <span>
                        FOTO DEL EMPLEADO
                    </span>

                    <strong>
                        Perfil
                    </strong>

                </div>

                <small>
                    JPG, PNG o WEBP · máximo 5 MB
                </small>

            </div>


            <div class="rh-photo-editor">


                <div
                    class="rh-photo-preview"
                    id="rhEmployeePhotoPreview"
                >

                    <img
                        id="rhEmployeePhotoPreviewImage"
                        alt=""
                    >

                    <span id="rhEmployeePhotoInitials">
                        GG
                    </span>

                </div>


                <div class="rh-photo-actions">


                    <input
                        id="rhEmployeePhotoInput"
                        class="rh-photo-input"
                        type="file"
                        accept="
                            image/jpeg,
                            image/png,
                            image/webp
                        "
                    >


                    <label
                        class="
                            module-button
                            rh-photo-upload
                        "
                        for="rhEmployeePhotoInput"
                    >
                        Elegir foto
                    </label>


                    <button
                        type="button"
                        id="rhEmployeePhotoRemove"
                        class="module-button"
                    >
                        Quitar foto
                    </button>


                    <small
                        id="rhEmployeePhotoStatus"
                        class="rh-photo-status"
                    >
                        Sin foto seleccionada.
                    </small>


                </div>


            </div>

        `;


        const nameField =
            document
                .getElementById(
                    "employeeName"
                )
                ?.closest(
                    ".module-field"
                );


        if (
            nameField
                ?.nextElementSibling
        ) {

            grid.insertBefore(
                field,
                nameField.nextElementSibling
            );

        }

        else {

            grid.prepend(
                field
            );

        }

    }


    // =====================================================
    // EVENTS
    // =====================================================

    function bindEvents() {


        document
            .getElementById(
                "rhEmployeePhotoInput"
            )
            ?.addEventListener(
                "change",
                handleFileSelection
            );


        document
            .getElementById(
                "rhEmployeePhotoRemove"
            )
            ?.addEventListener(
                "click",
                handleRemovePhoto
            );


        // =============================================
        // NUEVO EMPLEADO
        // =============================================

        document
            .getElementById(
                "employeesButton"
            )
            ?.addEventListener(

                "click",

                () => {


                    currentEmployeeId =
                        null;


                    resetPhotoEditor();


                    updateInitialsFromName();

                }

            );


        // =============================================
        // NOMBRE
        // =============================================

        document
            .getElementById(
                "employeeName"
            )
            ?.addEventListener(
                "input",
                updateInitialsFromName
            );


        // =============================================
        // EDITAR EMPLEADO
        // =============================================

        document.addEventListener(

            "click",

            event => {


                const editButton =
                    event.target.closest(
                        "[data-edit-employee]"
                    );


                if (
                    !editButton
                ) {

                    return;

                }


                currentEmployeeId =
                    editButton.dataset
                        .editEmployee
                    ||
                    null;


                resetPhotoEditor();

                updateInitialsFromName();


                if (
                    currentEmployeeId
                ) {

                    loadEmployeePhoto(
                        currentEmployeeId
                    );

                }

            },

            true

        );


        // =============================================
        // GUARDAR
        // =============================================

        document
            .getElementById(
                "employeeForm"
            )
            ?.addEventListener(

                "submit",

                capturePendingPhoto,

                true

            );

    }


    // =====================================================
    // SELECCIONAR ARCHIVO
    // =====================================================

    function handleFileSelection(
        event
    ) {


        const file =
            event.target
                .files?.[0]
            ||
            null;


        if (
            !file
        ) {

            return;

        }


        if (
            !ALLOWED_TYPES
                .has(
                    file.type
                )
        ) {

            event.target.value =
                "";


            selectedFile =
                null;


            setStatus(
                "Usa una imagen JPG, PNG o WEBP.",
                true
            );


            return;

        }


        if (
            file.size >
            MAX_FILE_SIZE
        ) {

            event.target.value =
                "";


            selectedFile =
                null;


            setStatus(
                "La imagen supera el máximo de 5 MB.",
                true
            );


            return;

        }


        selectedFile =
            file;


        removeRequested =
            false;


        showLocalPreview(
            file
        );


        setStatus(
            file.name,
            false
        );

    }


    // =====================================================
    // QUITAR FOTO
    // =====================================================

    function handleRemovePhoto() {


        selectedFile =
            null;


        removeRequested =
            Boolean(
                currentPhotoPath
            );


        const input =
            document.getElementById(
                "rhEmployeePhotoInput"
            );


        if (
            input
        ) {

            input.value =
                "";

        }


        clearPreviewImage();

        updateInitialsFromName();


        setStatus(

            currentPhotoPath
                ?
                "La foto se quitará al guardar."
                :
                "Sin foto seleccionada.",

            false

        );

    }


    // =====================================================
    // CAPTURAR FOTO AL GUARDAR
    // =====================================================

    function capturePendingPhoto() {


        if (
            !selectedFile
            &&
            !removeRequested
        ) {

            return;

        }


        const action = {

            editingEmployeeId:
                currentEmployeeId,

            username:
                document
                    .getElementById(
                        "employeeIntranetUsername"
                    )
                    ?.value
                    .trim()
                ||
                "",

            file:
                selectedFile,

            removeRequested:
                removeRequested,

            previousPath:
                currentPhotoPath

        };


        void syncPhotoAfterSuccessfulSave(
            action
        );

    }


    // =====================================================
    // ESPERAR A QUE EL EMPLEADO SE GUARDE
    // =====================================================

    async function syncPhotoAfterSuccessfulSave(
        action
    ) {


        const closed =
            await waitForEmployeeModalToClose(
                15000
            );


        if (
            !closed
        ) {

            return;

        }


        try {


            const employeeId =

                action.editingEmployeeId

                ||

                await findEmployeeIdByUsername(
                    action.username
                );


            if (
                !employeeId
            ) {

                throw new Error(
                    "No se encontró el empleado después de guardar."
                );

            }


            let previousPath =
                action.previousPath;


            if (
                !previousPath
            ) {

                previousPath =
                    await getEmployeePhotoPath(
                        employeeId
                    );

            }


            // =================================================
            // QUITAR FOTO
            // =================================================

            if (
                action.removeRequested
                &&
                !action.file
            ) {


                const {
                    error:
                        updateError
                } =
                    await db
                        .from(
                            "hr_employees"
                        )
                        .update({

                            photo_path:
                                null

                        })
                        .eq(
                            "id",
                            employeeId
                        );


                if (
                    updateError
                ) {

                    throw updateError;

                }


                if (
                    previousPath
                ) {


                    const {
                        error:
                            removeError
                    } =
                        await db
                            .storage
                            .from(
                                BUCKET
                            )
                            .remove([
                                previousPath
                            ]);


                    if (
                        removeError
                    ) {

                        console.warn(
                            "[RH FOTOS] No se pudo borrar la foto anterior:",
                            removeError
                        );

                    }

                }


                return;

            }


            if (
                !action.file
            ) {

                return;

            }


            // =================================================
            // NUEVA FOTO
            // =================================================

            const extension =
                getExtension(
                    action.file
                );


            const newPath =
                `${
                    employeeId
                }/${
                    crypto.randomUUID()
                }.${
                    extension
                }`;


            // =================================================
            // STORAGE
            // =================================================

            const {
                error:
                    uploadError
            } =
                await db
                    .storage
                    .from(
                        BUCKET
                    )
                    .upload(
                        newPath,
                        action.file,
                        {

                            cacheControl:
                                "3600",

                            upsert:
                                false,

                            contentType:
                                action.file.type

                        }
                    );


            if (
                uploadError
            ) {

                throw uploadError;

            }


            // =================================================
            // GUARDAR PATH
            // =================================================

            const {
                error:
                    updateError
            } =
                await db
                    .from(
                        "hr_employees"
                    )
                    .update({

                        photo_path:
                            newPath

                    })
                    .eq(
                        "id",
                        employeeId
                    );


            if (
                updateError
            ) {


                await db
                    .storage
                    .from(
                        BUCKET
                    )
                    .remove([
                        newPath
                    ]);


                throw updateError;

            }


            // =================================================
            // BORRAR FOTO ANTERIOR
            // =================================================

            if (
                previousPath
                &&
                previousPath !==
                newPath
            ) {


                const {
                    error:
                        removeError
                } =
                    await db
                        .storage
                        .from(
                            BUCKET
                        )
                        .remove([
                            previousPath
                        ]);


                if (
                    removeError
                ) {

                    console.warn(
                        "[RH FOTOS] No se pudo borrar la foto anterior:",
                        removeError
                    );

                }

            }

        }

        catch (
            error
        ) {


            console.error(
                "[RH FOTOS]",
                error
            );


            window.alert(
                "El empleado se guardó, pero la foto no pudo actualizarse. Inténtalo nuevamente."
            );

        }

    }


    // =====================================================
    // CARGAR FOTO ACTUAL
    // =====================================================

    async function loadEmployeePhoto(
        employeeId
    ) {


        try {


            const {
                data,
                error
            } =
                await db
                    .from(
                        "hr_employees"
                    )
                    .select(
                        `
                        photo_path,
                        full_name
                        `
                    )
                    .eq(
                        "id",
                        employeeId
                    )
                    .maybeSingle();


            if (
                error
            ) {

                throw error;

            }


            currentPhotoPath =
                data?.photo_path
                ||
                null;


            const initials =
                getInitials(

                    data?.full_name

                    ||

                    document
                        .getElementById(
                            "employeeName"
                        )
                        ?.value

                    ||

                    ""

                );


            setInitials(
                initials
            );


            if (
                !currentPhotoPath
            ) {


                clearPreviewImage();


                setStatus(
                    "Este empleado todavía no tiene foto.",
                    false
                );


                return;

            }


            const {
                data:
                    publicData
            } =
                db
                    .storage
                    .from(
                        BUCKET
                    )
                    .getPublicUrl(
                        currentPhotoPath
                    );


            showRemotePreview(
                publicData?.publicUrl
                ||
                ""
            );


            setStatus(
                "Foto actual del empleado.",
                false
            );

        }

        catch (
            error
        ) {


            console.error(
                "[RH FOTOS]",
                error
            );


            setStatus(
                "No se pudo cargar la foto actual.",
                true
            );

        }

    }


    // =====================================================
    // OBTENER PATH
    // =====================================================

    async function getEmployeePhotoPath(
        employeeId
    ) {


        const {
            data,
            error
        } =
            await db
                .from(
                    "hr_employees"
                )
                .select(
                    "photo_path"
                )
                .eq(
                    "id",
                    employeeId
                )
                .maybeSingle();


        if (
            error
        ) {

            throw error;

        }


        return (
            data?.photo_path
            ||
            null
        );

    }


    // =====================================================
    // BUSCAR EMPLEADO NUEVO
    // =====================================================

    async function findEmployeeIdByUsername(
        username
    ) {


        if (
            !username
        ) {

            return null;

        }


        for (
            let attempt = 0;
            attempt < 8;
            attempt += 1
        ) {


            const {
                data,
                error
            } =
                await db
                    .from(
                        "hr_employees"
                    )
                    .select(
                        "id"
                    )
                    .eq(
                        "intranet_username",
                        username
                    )
                    .limit(
                        1
                    )
                    .maybeSingle();


            if (
                error
            ) {

                throw error;

            }


            if (
                data?.id
            ) {

                return data.id;

            }


            await delay(
                350
            );

        }


        return null;

    }


    // =====================================================
    // ESPERAR CIERRE DEL MODAL
    // =====================================================

    function waitForEmployeeModalToClose(
        timeoutMs
    ) {


        const modal =
            document.getElementById(
                "employeeModal"
            );


        if (
            !modal
        ) {

            return Promise.resolve(
                false
            );

        }


        return new Promise(
            resolve => {


                const started =
                    Date.now();


                const timer =
                    window.setInterval(
                        () => {


                            if (
                                !modal.classList
                                    .contains(
                                        "active"
                                    )
                            ) {


                                window.clearInterval(
                                    timer
                                );


                                resolve(
                                    true
                                );


                                return;

                            }


                            if (
                                Date.now()
                                -
                                started
                                >=
                                timeoutMs
                            ) {


                                window.clearInterval(
                                    timer
                                );


                                resolve(
                                    false
                                );

                            }

                        },

                        120

                    );

            }
        );

    }


    // =====================================================
    // RESET
    // =====================================================

    function resetPhotoEditor() {


        selectedFile =
            null;


        removeRequested =
            false;


        currentPhotoPath =
            null;


        const input =
            document.getElementById(
                "rhEmployeePhotoInput"
            );


        if (
            input
        ) {

            input.value =
                "";

        }


        clearPreviewImage();


        setStatus(
            "Sin foto seleccionada.",
            false
        );

    }


    // =====================================================
    // PREVIEW LOCAL
    // =====================================================

    function showLocalPreview(
        file
    ) {


        revokePreviewObjectUrl();


        previewObjectUrl =
            URL.createObjectURL(
                file
            );


        showRemotePreview(
            previewObjectUrl
        );

    }


    // =====================================================
    // PREVIEW
    // =====================================================

    function showRemotePreview(
        url
    ) {


        const image =
            document.getElementById(
                "rhEmployeePhotoPreviewImage"
            );


        const preview =
            document.getElementById(
                "rhEmployeePhotoPreview"
            );


        if (
            !image
            ||
            !preview
            ||
            !url
        ) {

            return;

        }


        image.onload =
            () => {

                preview.classList
                    .add(
                        "has-photo"
                    );

            };


        image.onerror =
            () => {

                preview.classList
                    .remove(
                        "has-photo"
                    );

            };


        image.src =
            url;

    }


    // =====================================================
    // QUITAR PREVIEW
    // =====================================================

    function clearPreviewImage() {


        revokePreviewObjectUrl();


        const image =
            document.getElementById(
                "rhEmployeePhotoPreviewImage"
            );


        const preview =
            document.getElementById(
                "rhEmployeePhotoPreview"
            );


        if (
            image
        ) {

            image.removeAttribute(
                "src"
            );


            image.alt =
                "";

        }


        preview
            ?.classList
            .remove(
                "has-photo"
            );

    }


    // =====================================================
    // REVOKE OBJECT URL
    // =====================================================

    function revokePreviewObjectUrl() {


        if (
            !previewObjectUrl
        ) {

            return;

        }


        URL.revokeObjectURL(
            previewObjectUrl
        );


        previewObjectUrl =
            null;

    }


    // =====================================================
    // INICIALES
    // =====================================================

    function updateInitialsFromName() {


        setInitials(

            getInitials(

                document
                    .getElementById(
                        "employeeName"
                    )
                    ?.value

                ||

                ""

            )

        );

    }


    function setInitials(
        value
    ) {


        const initials =
            document.getElementById(
                "rhEmployeePhotoInitials"
            );


        if (
            initials
        ) {

            initials.textContent =
                value
                ||
                "GG";

        }

    }


    // =====================================================
    // STATUS
    // =====================================================

    function setStatus(
        message,
        isError
    ) {


        const status =
            document.getElementById(
                "rhEmployeePhotoStatus"
            );


        if (
            !status
        ) {

            return;

        }


        status.textContent =
            message;


        status.classList.toggle(
            "error",
            Boolean(
                isError
            )
        );

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function getInitials(
        name
    ) {


        return String(
            name
            ||
            ""
        )
        .trim()
        .split(
            /\s+/
        )
        .filter(
            Boolean
        )
        .slice(
            0,
            2
        )
        .map(
            part =>
                part[0]
                ||
                ""
        )
        .join(
            ""
        )
        .toUpperCase();

    }


    function getExtension(
        file
    ) {


        const byType = {

            "image/jpeg":
                "jpg",

            "image/png":
                "png",

            "image/webp":
                "webp"

        };


        return (
            byType[
                file.type
            ]
            ||
            "jpg"
        );

    }


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

})();