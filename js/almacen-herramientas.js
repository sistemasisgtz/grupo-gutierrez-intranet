// =========================================================
// GRUPO GUTIERREZ
// ALMACÉN · HERRAMIENTAS / WORLDSPACE
// =========================================================

(() => {

    "use strict";


    let wh;


    const toolState = {

        responsibles:
            [],

        groups:
            [],

        tools:
            [],

        nodes:
            []

    };


    const view = {

        x:
            40,

        y:
            40,

        scale:
            1,

        minScale:
            .45,

        maxScale:
            1.75

    };


    let editingResponsibleId =
        null;


    let editingGroupId =
        null;


    let editingToolId =
        null;


    let dragNode =
        null;


    let pan =
        null;


    ready(
        init
    );


    function ready(
        callback
    ) {

        if (
            window.GGWarehouse
                ?.state
                ?.ready
        ) {

            callback();

        }

        else {

            document.addEventListener(
                "ggwarehouse:ready",
                callback,
                {
                    once:
                        true
                }
            );

        }

    }


    async function init() {


        wh =
            window.GGWarehouse;


        bindEvents();


        await loadToolData();


        applyTransform();

        renderWorld();


        document.addEventListener(

            "ggwarehouse:refresh",

            async () => {

                await loadToolData();

                renderWorld();

            }

        );

    }


    function bindEvents() {


        document
            .getElementById(
                "warehouseToolResponsiblesButton"
            )
            ?.addEventListener(
                "click",
                openResponsiblesModal
            );


        document
            .getElementById(
                "warehouseToolGroupsButton"
            )
            ?.addEventListener(
                "click",
                openGroupsModal
            );


        document
            .getElementById(
                "warehouseToolsCatalogButton"
            )
            ?.addEventListener(
                "click",
                openToolsModal
            );


        document
            .getElementById(
                "warehouseAddGroupToWorld"
            )
            ?.addEventListener(
                "click",
                openGroupPicker
            );


        document
            .getElementById(
                "warehouseWorldZoomIn"
            )
            ?.addEventListener(

                "click",

                () =>
                    zoomBy(
                        .12
                    )

            );


        document
            .getElementById(
                "warehouseWorldZoomOut"
            )
            ?.addEventListener(

                "click",

                () =>
                    zoomBy(
                        -.12
                    )

            );


        document
            .getElementById(
                "warehouseWorldReset"
            )
            ?.addEventListener(
                "click",
                resetView
            );


        const viewport =
            document.getElementById(
                "warehouseWorldViewport"
            );


        viewport
            ?.addEventListener(
                "wheel",
                handleWheel,
                {
                    passive:
                        false
                }
            );


        viewport
            ?.addEventListener(
                "pointerdown",
                handleViewportPointerDown
            );


        window.addEventListener(
            "pointermove",
            handlePointerMove
        );


        window.addEventListener(
            "pointerup",
            handlePointerUp
        );


        document
            .getElementById(
                "warehouseWorldCanvas"
            )
            ?.addEventListener(
                "pointerdown",
                handleCanvasPointerDown
            );


        document
            .getElementById(
                "warehouseWorldCanvas"
            )
            ?.addEventListener(
                "click",
                handleCanvasClick
            );

    }


    async function loadToolData() {


        const [

            responsibles,

            groups,

            tools,

            nodes

        ] =
            await Promise.all([

                wh.db
                    .from(
                        "warehouse_tool_responsibles"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "name"
                    ),

                wh.db
                    .from(
                        "warehouse_tool_groups"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "name"
                    ),

                wh.db
                    .from(
                        "warehouse_tools"
                    )
                    .select(
                        "*"
                    )
                    .order(
                        "name"
                    ),

                wh.db
                    .from(
                        "warehouse_tool_workspace_nodes"
                    )
                    .select(
                        "*"
                    )

            ]);


        for (
            const result
            of
            [
                responsibles,
                groups,
                tools,
                nodes
            ]
        ) {

            if (
                result.error
            ) {

                throw result.error;

            }

        }


        toolState.responsibles =
            responsibles.data
            ||
            [];


        toolState.groups =
            groups.data
            ||
            [];


        toolState.tools =
            tools.data
            ||
            [];


        toolState.nodes =
            nodes.data
            ||
            [];

    }


    // =====================================================
    // RENDER WORLD
    // =====================================================

    function renderWorld() {


        const canvas =
            document.getElementById(
                "warehouseWorldCanvas"
            );


        const empty =
            document.getElementById(
                "warehouseWorldEmpty"
            );


        if (
            !canvas
        ) {

            return;

        }


        const placed =
            toolState.nodes

                .map(
                    node => ({

                        node,

                        group:
                            toolState.groups
                                .find(
                                    group =>
                                        group.id ===
                                        node.group_id
                                )

                    })
                )

                .filter(
                    item =>
                        item.group
                );


        if (
            empty
        ) {

            empty.classList.toggle(
                "hidden",
                placed.length >
                0
            );

        }


        canvas.innerHTML =
            placed
                .map(
                    ({
                        node,
                        group
                    }) => {


                        const tools =
                            toolState.tools
                                .filter(
                                    tool =>
                                        tool.group_id ===
                                        group.id
                                );


                        return `

                            <section
                                class="warehouse-tool-node"
                                data-world-node="${group.id}"
                                style="
                                    left:
                                    ${
                                        Number(
                                            node.position_x
                                            ||
                                            0
                                        )
                                    }px;

                                    top:
                                    ${
                                        Number(
                                            node.position_y
                                            ||
                                            0
                                        )
                                    }px;
                                "
                            >


                                <header
                                    class="warehouse-tool-node-header"
                                    data-world-node-handle
                                >


                                    <div class="warehouse-tool-node-title">

                                        <span>
                                            GRUPO DE HERRAMIENTAS
                                        </span>

                                        <strong>
                                            ${
                                                wh.escapeHtml(
                                                    group.name
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div
                                        style="
                                            display:flex;
                                            align-items:center;
                                            gap:6px;
                                        "
                                    >

                                        <span class="warehouse-tool-node-count">
                                            ${
                                                tools.length
                                            }
                                        </span>

                                        <button
                                            type="button"
                                            class="warehouse-mini-button"
                                            data-remove-world-node="${group.id}"
                                            title="Quitar del workspace"
                                        >
                                            ×
                                        </button>

                                    </div>


                                </header>


                                <div class="warehouse-tool-node-body">

                                    ${
                                        tools.length

                                        ?

                                        tools
                                            .map(
                                                renderToolCard
                                            )
                                            .join(
                                                ""
                                            )

                                        :

                                        `

                                            <div class="warehouse-tool-empty-group">
                                                Este grupo aún no
                                                tiene herramientas.
                                            </div>

                                        `
                                    }

                                </div>


                            </section>

                        `;

                    }
                )
                .join(
                    ""
                );

    }


    function renderToolCard(
        tool
    ) {


        const responsible =
            toolState.responsibles
                .find(
                    item =>
                        item.id ===
                        tool.responsible_id
                );


        const subtitle =

            responsible

                ?

                `${statusLabel(tool.status)} · ${responsible.name}`

                :

                statusLabel(
                    tool.status
                );


        return `

            <button
                type="button"
                class="warehouse-tool-card"
                data-status="${tool.status}"
                data-tool-status-card="${tool.id}"
            >

                <i class="warehouse-tool-status-dot">
                </i>

                <span class="warehouse-tool-card-copy">

                    <strong>
                        ${
                            wh.escapeHtml(
                                tool.name
                            )
                        }
                    </strong>

                    <small>
                        ${
                            wh.escapeHtml(
                                tool.description
                                ||
                                subtitle
                            )
                        }
                    </small>

                </span>

                <span class="warehouse-tool-status-label">
                    ${
                        wh.escapeHtml(
                            statusLabel(
                                tool.status
                            )
                        )
                    }
                </span>

            </button>

        `;

    }


    function handleCanvasClick(
        event
    ) {


        const statusCard =
            event.target.closest(
                "[data-tool-status-card]"
            );


        const removeNode =
            event.target.closest(
                "[data-remove-world-node]"
            );


        if (
            statusCard
        ) {

            openToolStatusModal(
                statusCard.dataset
                    .toolStatusCard
            );

        }


        if (
            removeNode
        ) {

            event.stopPropagation();


            removeWorldNode(
                removeNode.dataset
                    .removeWorldNode
            );

        }

    }


    // =====================================================
    // PAN
    // =====================================================

    function handleViewportPointerDown(
        event
    ) {


        if (
            event.button !==
            0
        ) {

            return;

        }


        if (
            event.target.closest(
                ".warehouse-tool-node"
            )
        ) {

            return;

        }


        const viewport =
            document.getElementById(
                "warehouseWorldViewport"
            );


        pan = {

            startX:
                event.clientX,

            startY:
                event.clientY,

            originX:
                view.x,

            originY:
                view.y

        };


        viewport
            ?.classList
            .add(
                "is-panning"
            );


        viewport
            ?.setPointerCapture
            ?.(event.pointerId);

    }


    // =====================================================
    // DRAG NODE
    // =====================================================

    function handleCanvasPointerDown(
        event
    ) {


        const handle =
            event.target.closest(
                "[data-world-node-handle]"
            );


        if (
            !handle
            ||
            event.target.closest(
                "[data-remove-world-node]"
            )
        ) {

            return;

        }


        const nodeElement =
            handle.closest(
                "[data-world-node]"
            );


        const groupId =
            nodeElement?.dataset
                .worldNode;


        const node =
            toolState.nodes
                .find(
                    item =>
                        item.group_id ===
                        groupId
                );


        if (
            !node
            ||
            !nodeElement
        ) {

            return;

        }


        event.preventDefault();

        event.stopPropagation();


        dragNode = {

            groupId,

            node,

            element:
                nodeElement,

            startX:
                event.clientX,

            startY:
                event.clientY,

            originX:
                Number(
                    node.position_x
                    ||
                    0
                ),

            originY:
                Number(
                    node.position_y
                    ||
                    0
                )

        };


        nodeElement
            .classList
            .add(
                "is-dragging"
            );

    }


    function handlePointerMove(
        event
    ) {


        if (
            dragNode
        ) {


            const dx =
                (
                    event.clientX
                    -
                    dragNode.startX
                )
                /
                view.scale;


            const dy =
                (
                    event.clientY
                    -
                    dragNode.startY
                )
                /
                view.scale;


            const x =
                Math.round(
                    dragNode.originX
                    +
                    dx
                );


            const y =
                Math.round(
                    dragNode.originY
                    +
                    dy
                );


            dragNode.node.position_x =
                x;


            dragNode.node.position_y =
                y;


            dragNode.element.style.left =
                `${x}px`;


            dragNode.element.style.top =
                `${y}px`;


            return;

        }


        if (
            pan
        ) {


            view.x =
                pan.originX
                +
                (
                    event.clientX
                    -
                    pan.startX
                );


            view.y =
                pan.originY
                +
                (
                    event.clientY
                    -
                    pan.startY
                );


            applyTransform();

        }

    }


    async function handlePointerUp() {


        if (
            dragNode
        ) {


            const current =
                dragNode;


            current.element
                .classList
                .remove(
                    "is-dragging"
                );


            dragNode =
                null;


            const {
                error
            } =
                await wh.db

                    .from(
                        "warehouse_tool_workspace_nodes"
                    )

                    .update({

                        position_x:
                            Number(
                                current.node.position_x
                            ),

                        position_y:
                            Number(
                                current.node.position_y
                            ),

                        updated_by:
                            wh.state.user.id,

                        updated_by_email:
                            wh.userEmail()

                    })

                    .eq(
                        "group_id",
                        current.groupId
                    );


            if (
                error
            ) {

                console.error(
                    error
                );


                wh.toast(
                    "No se pudo guardar la posición del grupo.",
                    true
                );

            }

        }


        if (
            pan
        ) {

            pan =
                null;


            document
                .getElementById(
                    "warehouseWorldViewport"
                )
                ?.classList
                .remove(
                    "is-panning"
                );

        }

    }


    // =====================================================
    // ZOOM
    // =====================================================

    function handleWheel(
        event
    ) {


        event.preventDefault();


        const viewport =
            document.getElementById(
                "warehouseWorldViewport"
            );


        if (
            !viewport
        ) {

            return;

        }


        const rect =
            viewport.getBoundingClientRect();


        const pointerX =
            event.clientX
            -
            rect.left;


        const pointerY =
            event.clientY
            -
            rect.top;


        const worldX =
            (
                pointerX
                -
                view.x
            )
            /
            view.scale;


        const worldY =
            (
                pointerY
                -
                view.y
            )
            /
            view.scale;


        const factor =

            event.deltaY <
            0

                ?

                1.10

                :

                .90;


        const next =
            clamp(

                view.scale
                *
                factor,

                view.minScale,

                view.maxScale

            );


        view.x =
            pointerX
            -
            worldX
            *
            next;


        view.y =
            pointerY
            -
            worldY
            *
            next;


        view.scale =
            next;


        applyTransform();

    }


    function zoomBy(
        amount
    ) {


        view.scale =
            clamp(

                view.scale
                +
                amount,

                view.minScale,

                view.maxScale

            );


        applyTransform();

    }


    function resetView() {


        view.x =
            40;


        view.y =
            40;


        view.scale =
            1;


        applyTransform();

    }


    function applyTransform() {


        const canvas =
            document.getElementById(
                "warehouseWorldCanvas"
            );


        if (
            canvas
        ) {

            canvas.style.transform =

                `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;

        }


        const label =
            document.getElementById(
                "warehouseWorldZoomLabel"
            );


        if (
            label
        ) {

            label.textContent =
                `${Math.round(view.scale * 100)}%`;

        }

    }


    // =====================================================
    // ADD GROUP
    // =====================================================

    function openGroupPicker() {


        const placedIds =
            new Set(

                toolState.nodes
                    .map(
                        node =>
                            node.group_id
                    )

            );


        const available =
            toolState.groups
                .filter(
                    group =>
                        !placedIds.has(
                            group.id
                        )
                );


        wh.openModal({

            kicker:
                "WORKSPACE",

            title:
                "Agregar grupo",

            body:

                available.length

                    ?

                    `

                        <div class="warehouse-world-group-picker">

                            ${
                                available
                                    .map(
                                        group => {


                                            const count =
                                                toolState.tools
                                                    .filter(
                                                        tool =>
                                                            tool.group_id ===
                                                            group.id
                                                    )
                                                    .length;


                                            return `

                                                <button
                                                    type="button"
                                                    class="warehouse-world-group-pick"
                                                    data-pick-world-group="${group.id}"
                                                >

                                                    <span>

                                                        <strong>
                                                            ${
                                                                wh.escapeHtml(
                                                                    group.name
                                                                )
                                                            }
                                                        </strong>

                                                        <small>
                                                            ${
                                                                count
                                                            }
                                                            ${
                                                                count ===
                                                                1
                                                                    ?
                                                                    "herramienta"
                                                                    :
                                                                    "herramientas"
                                                            }
                                                        </small>

                                                    </span>

                                                    <span>
                                                        ＋
                                                    </span>

                                                </button>

                                            `;

                                        }
                                    )
                                    .join(
                                        ""
                                    )
                            }

                        </div>

                    `

                    :

                    `

                        <div class="warehouse-empty">
                            Todos los grupos existentes ya están
                            colocados. Crea otro grupo desde
                            el catálogo.
                        </div>

                    `,

            onOpen:
                root => {


                    root
                        .querySelectorAll(
                            "[data-pick-world-group]"
                        )
                        .forEach(
                            button => {


                                button.addEventListener(

                                    "click",

                                    () =>
                                        addWorldNode(
                                            button.dataset
                                                .pickWorldGroup
                                        )

                                );

                            }
                        );

                }

        });

    }


    async function addWorldNode(
        groupId
    ) {


        const index =
            toolState.nodes.length;


        const position = {

            group_id:
                groupId,

            position_x:
                70
                +
                (
                    index
                    %
                    4
                )
                *
                360,

            position_y:
                70
                +
                Math.floor(
                    index
                    /
                    4
                )
                *
                260,

            updated_by:
                wh.state.user.id,

            updated_by_email:
                wh.userEmail()

        };


        const {
            error
        } =
            await wh.db

                .from(
                    "warehouse_tool_workspace_nodes"
                )

                .insert(
                    position
                );


        if (
            error
        ) {

            console.error(
                error
            );


            wh.toast(
                String(
                    error.message
                    ||
                    error
                ),
                true
            );


            return;

        }


        toolState.nodes
            .push(
                position
            );


        wh.closeModal();


        renderWorld();


        wh.toast(
            "Grupo colocado en el workspace."
        );

    }


    async function removeWorldNode(
        groupId
    ) {


        const {
            error
        } =
            await wh.db

                .from(
                    "warehouse_tool_workspace_nodes"
                )

                .delete()

                .eq(
                    "group_id",
                    groupId
                );


        if (
            error
        ) {

            console.error(
                error
            );


            wh.toast(
                "No se pudo quitar el grupo.",
                true
            );


            return;

        }


        toolState.nodes =
            toolState.nodes
                .filter(
                    node =>
                        node.group_id !==
                        groupId
                );


        renderWorld();

    }


    // =====================================================
    // RESPONSABLES
    // =====================================================

    function openResponsiblesModal() {


        editingResponsibleId =
            null;


        wh.openModal({

            kicker:
                "HERRAMIENTAS",

            title:
                "Responsables",

            body: `

                <form id="whResponsibleForm">


                    <div class="warehouse-form-grid">


                        <div class="warehouse-form-field full">

                            <label>
                                Nombre *
                            </label>

                            <input
                                id="whResponsibleName"
                                required
                            >

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Tipo
                            </label>

                            <select id="whResponsibleScope">

                                <option value="both">
                                    Colaborador o externo
                                </option>

                                <option value="collaborator">
                                    Colaborador
                                </option>

                                <option value="external">
                                    Externo
                                </option>

                            </select>

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Empresa
                            </label>

                            <input id="whResponsibleCompany">

                        </div>


                        <div class="warehouse-form-field full">

                            <label>
                                Teléfono
                            </label>

                            <input id="whResponsiblePhone">

                        </div>


                    </div>


                    <div
                        class="warehouse-form-message"
                        id="whResponsibleMessage"
                    >
                    </div>


                    <button
                        type="submit"
                        class="
                            module-button
                            module-button-primary
                        "
                    >
                        Guardar responsable
                    </button>


                </form>


                <div
                    id="whResponsibleList"
                    class="warehouse-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#whResponsibleForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveResponsible
                        );


                    root
                        .querySelector(
                            "#whResponsibleList"
                        )
                        ?.addEventListener(
                            "click",
                            handleResponsibleListClick
                        );


                    renderResponsibleList();

                }

        });

    }


    function renderResponsibleList() {


        const host =
            document.getElementById(
                "whResponsibleList"
            );


        if (
            !host
        ) {

            return;

        }


        host.innerHTML =

            toolState.responsibles.length

                ?

                toolState.responsibles
                    .map(
                        item => `

                            <article class="warehouse-catalog-item">

                                <div>

                                    <strong>
                                        ${
                                            wh.escapeHtml(
                                                item.name
                                            )
                                        }
                                    </strong>

                                    <small>

                                        ${
                                            wh.escapeHtml(
                                                scopeLabel(
                                                    item.scope
                                                )
                                            )
                                        }

                                        ${
                                            item.company

                                                ?

                                                ` · ${
                                                    wh.escapeHtml(
                                                        item.company
                                                    )
                                                }`

                                                :

                                                ""
                                        }

                                    </small>

                                </div>

                                <div class="warehouse-table-actions">

                                    <button
                                        type="button"
                                        class="warehouse-mini-button"
                                        data-edit-responsible="${item.id}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="
                                            warehouse-mini-button
                                            danger
                                        "
                                        data-delete-responsible="${item.id}"
                                    >
                                        Borrar
                                    </button>

                                </div>

                            </article>

                        `
                    )
                    .join(
                        ""
                    )

                :

                `

                    <div class="warehouse-empty">
                        No hay responsables.
                    </div>

                `;

    }


    function handleResponsibleListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-edit-responsible]"
            );


        const del =
            event.target.closest(
                "[data-delete-responsible]"
            );


        if (
            edit
        ) {


            const item =
                toolState.responsibles
                    .find(
                        row =>
                            row.id ===
                            edit.dataset
                                .editResponsible
                    );


            if (
                !item
            ) {

                return;

            }


            editingResponsibleId =
                item.id;


            document
                .getElementById(
                    "whResponsibleName"
                )
                .value =
                item.name
                ||
                "";


            document
                .getElementById(
                    "whResponsibleScope"
                )
                .value =
                item.scope
                ||
                "both";


            document
                .getElementById(
                    "whResponsibleCompany"
                )
                .value =
                item.company
                ||
                "";


            document
                .getElementById(
                    "whResponsiblePhone"
                )
                .value =
                item.phone
                ||
                "";

        }


        if (
            del
        ) {

            deleteResponsible(
                del.dataset
                    .deleteResponsible
            );

        }

    }


    async function saveResponsible(
        event
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const payload = {

            name:
                document
                    .getElementById(
                        "whResponsibleName"
                    )
                    .value
                    .trim(),

            scope:
                document
                    .getElementById(
                        "whResponsibleScope"
                    )
                    .value,

            company:
                document
                    .getElementById(
                        "whResponsibleCompany"
                    )
                    .value
                    .trim()
                ||
                null,

            phone:
                document
                    .getElementById(
                        "whResponsiblePhone"
                    )
                    .value
                    .trim()
                ||
                null

        };


        const message =
            document.getElementById(
                "whResponsibleMessage"
            );


        if (
            !payload.name
        ) {

            return;

        }


        try {

            let result;


            if (
                editingResponsibleId
            ) {

                result =
                    await wh.db
                        .from(
                            "warehouse_tool_responsibles"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            editingResponsibleId
                        );

            }

            else {

                result =
                    await wh.db
                        .from(
                            "warehouse_tool_responsibles"
                        )
                        .insert({

                            ...payload,

                            created_by:
                                wh.state.user.id,

                            created_by_email:
                                wh.userEmail()

                        });

            }


            if (
                result.error
            ) {

                throw result.error;

            }


            editingResponsibleId =
                null;


            form.reset();


            await loadToolData();


            renderResponsibleList();

            renderWorld();


            wh.toast(
                "Responsable guardado."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[RESPONSABLE]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    String(
                        error?.message
                        ||
                        error
                    );

            }

        }

    }


    async function deleteResponsible(
        id
    ) {


        const item =
            toolState.responsibles
                .find(
                    row =>
                        row.id ===
                        id
                );


        if (
            !item

            ||

            !window.confirm(
                `¿Eliminar a ${item.name} de responsables?`
            )
        ) {

            return;

        }


        const {
            error
        } =
            await wh.db

                .from(
                    "warehouse_tool_responsibles"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            wh.toast(
                String(
                    error.message
                    ||
                    error
                ),
                true
            );

            return;

        }


        await loadToolData();


        renderResponsibleList();

        renderWorld();

    }


    // =====================================================
    // GRUPOS
    // =====================================================

    function openGroupsModal() {


        editingGroupId =
            null;


        wh.openModal({

            kicker:
                "HERRAMIENTAS",

            title:
                "Grupos",

            body: `

                <form id="whGroupForm">

                    <div class="warehouse-form-field">

                        <label>
                            Nombre del grupo *
                        </label>

                        <input
                            id="whGroupName"
                            required
                            placeholder="Ej. Taller mecánico"
                        >

                    </div>

                    <div
                        class="warehouse-form-message"
                        id="whGroupMessage"
                    >
                    </div>

                    <button
                        type="submit"
                        class="
                            module-button
                            module-button-primary
                        "
                    >
                        Guardar grupo
                    </button>

                </form>


                <div
                    id="whGroupList"
                    class="warehouse-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#whGroupForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveGroup
                        );


                    root
                        .querySelector(
                            "#whGroupList"
                        )
                        ?.addEventListener(
                            "click",
                            handleGroupListClick
                        );


                    renderGroupList();

                }

        });

    }


    function renderGroupList() {


        const host =
            document.getElementById(
                "whGroupList"
            );


        if (
            !host
        ) {

            return;

        }


        host.innerHTML =

            toolState.groups.length

                ?

                toolState.groups
                    .map(
                        item => {


                            const count =
                                toolState.tools
                                    .filter(
                                        tool =>
                                            tool.group_id ===
                                            item.id
                                    )
                                    .length;


                            return `

                                <article class="warehouse-catalog-item">

                                    <div>

                                        <strong>
                                            ${
                                                wh.escapeHtml(
                                                    item.name
                                                )
                                            }
                                        </strong>

                                        <small>

                                            ${
                                                count
                                            }

                                            ${
                                                count ===
                                                1
                                                    ?
                                                    "herramienta"
                                                    :
                                                    "herramientas"
                                            }

                                        </small>

                                    </div>

                                    <div class="warehouse-table-actions">

                                        <button
                                            type="button"
                                            class="warehouse-mini-button"
                                            data-edit-group="${item.id}"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            class="
                                                warehouse-mini-button
                                                danger
                                            "
                                            data-delete-group="${item.id}"
                                        >
                                            Borrar
                                        </button>

                                    </div>

                                </article>

                            `;

                        }
                    )
                    .join(
                        ""
                    )

                :

                `

                    <div class="warehouse-empty">
                        No hay grupos.
                    </div>

                `;

    }


    function handleGroupListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-edit-group]"
            );


        const del =
            event.target.closest(
                "[data-delete-group]"
            );


        if (
            edit
        ) {


            const item =
                toolState.groups
                    .find(
                        row =>
                            row.id ===
                            edit.dataset
                                .editGroup
                    );


            if (
                !item
            ) {

                return;

            }


            editingGroupId =
                item.id;


            document
                .getElementById(
                    "whGroupName"
                )
                .value =
                item.name
                ||
                "";

        }


        if (
            del
        ) {

            deleteGroup(
                del.dataset
                    .deleteGroup
            );

        }

    }


    async function saveGroup(
        event
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const name =
            document
                .getElementById(
                    "whGroupName"
                )
                .value
                .trim();


        const message =
            document.getElementById(
                "whGroupMessage"
            );


        if (
            !name
        ) {

            return;

        }


        try {

            let result;


            if (
                editingGroupId
            ) {

                result =
                    await wh.db
                        .from(
                            "warehouse_tool_groups"
                        )
                        .update({

                            name

                        })
                        .eq(
                            "id",
                            editingGroupId
                        );

            }

            else {

                result =
                    await wh.db
                        .from(
                            "warehouse_tool_groups"
                        )
                        .insert({

                            name,

                            created_by:
                                wh.state.user.id,

                            created_by_email:
                                wh.userEmail()

                        });

            }


            if (
                result.error
            ) {

                throw result.error;

            }


            editingGroupId =
                null;


            form.reset();


            await loadToolData();


            renderGroupList();

            renderWorld();


            wh.toast(
                "Grupo guardado."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[GRUPO HERRAMIENTAS]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    friendlyError(
                        error
                    );

            }

        }

    }


    async function deleteGroup(
        id
    ) {


        const item =
            toolState.groups
                .find(
                    row =>
                        row.id ===
                        id
                );


        if (
            !item

            ||

            !window.confirm(
                `¿Eliminar el grupo ${item.name}?`
            )
        ) {

            return;

        }


        const {
            error
        } =
            await wh.db

                .from(
                    "warehouse_tool_groups"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            wh.toast(
                "No se puede borrar un grupo mientras tenga herramientas asignadas.",
                true
            );

            return;

        }


        await loadToolData();


        renderGroupList();

        renderWorld();

    }


    // =====================================================
    // HERRAMIENTAS
    // =====================================================

    function openToolsModal() {


        editingToolId =
            null;


        wh.openModal({

            kicker:
                "HERRAMIENTAS",

            title:
                "Catálogo de herramientas",

            wide:
                true,

            body: `

                <form id="whToolForm">


                    <div class="warehouse-form-grid">


                        <div class="warehouse-form-field">

                            <label>
                                Herramienta *
                            </label>

                            <input
                                id="whToolName"
                                required
                                placeholder="Ej. Rotomartillo"
                            >

                        </div>


                        <div class="warehouse-form-field">

                            <label>
                                Grupo *
                            </label>

                            <select
                                id="whToolGroup"
                                required
                            >

                                <option value="">
                                    Selecciona...
                                </option>

                                ${
                                    toolState.groups
                                        .map(
                                            group => `

                                                <option value="${group.id}">
                                                    ${
                                                        wh.escapeHtml(
                                                            group.name
                                                        )
                                                    }
                                                </option>

                                            `
                                        )
                                        .join(
                                            ""
                                        )
                                }

                            </select>

                        </div>


                        <div class="warehouse-form-field full">

                            <label>
                                Descripción
                            </label>

                            <textarea
                                id="whToolDescription"
                                placeholder="Modelo, identificación, notas..."
                            ></textarea>

                        </div>


                    </div>


                    <div
                        class="warehouse-form-message"
                        id="whToolMessage"
                    >
                    </div>


                    <button
                        type="submit"
                        class="
                            module-button
                            module-button-primary
                        "
                    >
                        Guardar herramienta
                    </button>


                </form>


                <div
                    id="whToolList"
                    class="warehouse-catalog-list"
                >
                </div>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "#whToolForm"
                        )
                        ?.addEventListener(
                            "submit",
                            saveTool
                        );


                    root
                        .querySelector(
                            "#whToolList"
                        )
                        ?.addEventListener(
                            "click",
                            handleToolListClick
                        );


                    renderToolList();

                }

        });

    }


    function renderToolList() {


        const host =
            document.getElementById(
                "whToolList"
            );


        if (
            !host
        ) {

            return;

        }


        host.innerHTML =

            toolState.tools.length

                ?

                toolState.tools
                    .map(
                        item => {


                            const group =
                                toolState.groups
                                    .find(
                                        groupItem =>
                                            groupItem.id ===
                                            item.group_id
                                    );


                            return `

                                <article class="warehouse-catalog-item">

                                    <div>

                                        <strong>
                                            ${
                                                wh.escapeHtml(
                                                    item.name
                                                )
                                            }
                                        </strong>

                                        <small>

                                            ${
                                                wh.escapeHtml(
                                                    group?.name
                                                    ||
                                                    "Sin grupo"
                                                )
                                            }

                                            ·

                                            ${
                                                wh.escapeHtml(
                                                    statusLabel(
                                                        item.status
                                                    )
                                                )
                                            }

                                        </small>

                                    </div>

                                    <div class="warehouse-table-actions">

                                        <button
                                            type="button"
                                            class="warehouse-mini-button"
                                            data-edit-tool="${item.id}"
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            class="
                                                warehouse-mini-button
                                                danger
                                            "
                                            data-delete-tool="${item.id}"
                                        >
                                            Borrar
                                        </button>

                                    </div>

                                </article>

                            `;

                        }
                    )
                    .join(
                        ""
                    )

                :

                `

                    <div class="warehouse-empty">
                        No hay herramientas.
                    </div>

                `;

    }


    function handleToolListClick(
        event
    ) {


        const edit =
            event.target.closest(
                "[data-edit-tool]"
            );


        const del =
            event.target.closest(
                "[data-delete-tool]"
            );


        if (
            edit
        ) {


            const item =
                toolState.tools
                    .find(
                        row =>
                            row.id ===
                            edit.dataset
                                .editTool
                    );


            if (
                !item
            ) {

                return;

            }


            editingToolId =
                item.id;


            document
                .getElementById(
                    "whToolName"
                )
                .value =
                item.name
                ||
                "";


            document
                .getElementById(
                    "whToolGroup"
                )
                .value =
                item.group_id
                ||
                "";


            document
                .getElementById(
                    "whToolDescription"
                )
                .value =
                item.description
                ||
                "";

        }


        if (
            del
        ) {

            deleteTool(
                del.dataset
                    .deleteTool
            );

        }

    }


    async function saveTool(
        event
    ) {


        event.preventDefault();


        const form =
            event.currentTarget;


        const payload = {

            name:
                document
                    .getElementById(
                        "whToolName"
                    )
                    .value
                    .trim(),

            group_id:
                document
                    .getElementById(
                        "whToolGroup"
                    )
                    .value,

            description:
                document
                    .getElementById(
                        "whToolDescription"
                    )
                    .value
                    .trim()
                ||
                null,

            updated_by:
                wh.state.user.id,

            updated_by_email:
                wh.userEmail()

        };


        const message =
            document.getElementById(
                "whToolMessage"
            );


        if (
            !payload.name
            ||
            !payload.group_id
        ) {

            if (
                message
            ) {

                message.textContent =
                    "Nombre y grupo son obligatorios.";

            }


            return;

        }


        try {

            let result;


            if (
                editingToolId
            ) {

                result =
                    await wh.db
                        .from(
                            "warehouse_tools"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            editingToolId
                        );

            }

            else {

                result =
                    await wh.db
                        .from(
                            "warehouse_tools"
                        )
                        .insert(
                            payload
                        );

            }


            if (
                result.error
            ) {

                throw result.error;

            }


            editingToolId =
                null;


            form.reset();


            await loadToolData();


            renderToolList();

            renderWorld();


            wh.toast(
                "Herramienta guardada."
            );

        }

        catch (
            error
        ) {

            console.error(
                "[HERRAMIENTA]",
                error
            );


            if (
                message
            ) {

                message.textContent =
                    friendlyError(
                        error
                    );

            }

        }

    }


    async function deleteTool(
        id
    ) {


        const item =
            toolState.tools
                .find(
                    row =>
                        row.id ===
                        id
                );


        if (
            !item

            ||

            !window.confirm(
                `¿Eliminar la herramienta ${item.name}?`
            )
        ) {

            return;

        }


        const {
            error
        } =
            await wh.db

                .from(
                    "warehouse_tools"
                )

                .delete()

                .eq(
                    "id",
                    id
                );


        if (
            error
        ) {

            wh.toast(
                String(
                    error.message
                    ||
                    error
                ),
                true
            );

            return;

        }


        await loadToolData();


        renderToolList();

        renderWorld();

    }


    // =====================================================
    // TOOL STATUS
    // =====================================================

    function openToolStatusModal(
        toolId
    ) {


        const tool =
            toolState.tools
                .find(
                    item =>
                        item.id ===
                        toolId
                );


        if (
            !tool
        ) {

            return;

        }


        const group =
            toolState.groups
                .find(
                    item =>
                        item.id ===
                        tool.group_id
                );


        const statuses = [

            [
                "available",
                "Disponible",
                "Lista para uso",
                "#64b685"
            ],

            [
                "loan_collaborator",
                "Prestada a colaborador",
                "Requiere responsable",
                "#4b9fd0"
            ],

            [
                "loan_external",
                "Prestada a externo",
                "Requiere responsable",
                "#8b78cf"
            ],

            [
                "workshop",
                "En taller",
                "Revisión o reparación",
                "#cda45e"
            ],

            [
                "damaged",
                "Daño",
                "Herramienta dañada",
                "#cc6c58"
            ],

            [
                "lost",
                "Extravío",
                "No localizada",
                "#c5525d"
            ]

        ];


        wh.openModal({

            kicker:
                group?.name
                ||
                "HERRAMIENTAS",

            title:
                tool.name,

            body: `

                <form id="whToolStatusForm">


                    <div class="warehouse-status-grid">

                        ${
                            statuses
                                .map(
                                    ([

                                        value,

                                        title,

                                        subtitle,

                                        color

                                    ]) => `

                                        <div
                                            class="warehouse-status-option"
                                            style="
                                                --status-color:
                                                ${color};
                                            "
                                        >

                                            <input
                                                type="radio"
                                                id="whStatus_${value}"
                                                name="whToolStatus"
                                                value="${value}"
                                                ${
                                                    tool.status ===
                                                    value
                                                        ?
                                                        "checked"
                                                        :
                                                        ""
                                                }
                                            >

                                            <label for="whStatus_${value}">

                                                <i>
                                                </i>

                                                <span>

                                                    <strong>
                                                        ${title}
                                                    </strong>

                                                    <small>
                                                        ${subtitle}
                                                    </small>

                                                </span>

                                            </label>

                                        </div>

                                    `
                                )
                                .join(
                                    ""
                                )
                        }

                    </div>


                    <div
                        id="whToolResponsibleField"
                        class="warehouse-form-field"
                    >

                        <label>
                            Responsable *
                        </label>

                        <select id="whToolResponsible">
                        </select>

                    </div>


                    <div
                        class="warehouse-form-field"
                        style="margin-top:10px"
                    >

                        <label>
                            Nota de estatus
                        </label>

                        <textarea
                            id="whToolStatusNote"
                            placeholder="Opcional"
                        >${
                            wh.escapeHtml(
                                tool.status_note
                                ||
                                ""
                            )
                        }</textarea>

                    </div>


                    <div
                        id="whToolStatusMessage"
                        class="warehouse-form-message"
                    >
                    </div>


                </form>

            `,

            footer: `

                <button
                    type="button"
                    class="module-button"
                    data-close-tool-status
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    form="whToolStatusForm"
                    class="
                        module-button
                        module-button-primary
                    "
                >
                    Guardar estatus
                </button>

            `,

            onOpen:
                root => {


                    root
                        .querySelector(
                            "[data-close-tool-status]"
                        )
                        ?.addEventListener(
                            "click",
                            wh.closeModal
                        );


                    root
                        .querySelectorAll(
                            'input[name="whToolStatus"]'
                        )
                        .forEach(
                            input => {


                                input.addEventListener(

                                    "change",

                                    () =>
                                        refreshResponsibleField(
                                            tool
                                        )

                                );

                            }
                        );


                    root
                        .querySelector(
                            "#whToolStatusForm"
                        )
                        ?.addEventListener(

                            "submit",

                            event =>
                                saveToolStatus(
                                    event,
                                    tool
                                )

                        );


                    refreshResponsibleField(
                        tool
                    );

                }

        });

    }


    function refreshResponsibleField(
        tool
    ) {


        const status =
            document
                .querySelector(
                    'input[name="whToolStatus"]:checked'
                )
                ?.value
            ||
            "available";


        const field =
            document.getElementById(
                "whToolResponsibleField"
            );


        const select =
            document.getElementById(
                "whToolResponsible"
            );


        if (
            !field
            ||
            !select
        ) {

            return;

        }


        const needs =

            status ===
            "loan_external"

            ||

            status ===
            "loan_collaborator";


        field.style.display =
            needs
                ?
                "grid"
                :
                "none";


        if (
            !needs
        ) {

            return;

        }


        const allowed =
            toolState.responsibles
                .filter(
                    item => {


                        if (
                            status ===
                            "loan_external"
                        ) {

                            return (
                                item.scope ===
                                "external"

                                ||

                                item.scope ===
                                "both"
                            );

                        }


                        return (
                            item.scope ===
                            "collaborator"

                            ||

                            item.scope ===
                            "both"
                        );

                    }
                );


        select.innerHTML = `

            <option value="">
                Selecciona responsable...
            </option>

            ${
                allowed
                    .map(
                        item => `

                            <option
                                value="${item.id}"
                                ${
                                    tool.responsible_id ===
                                    item.id
                                        ?
                                        "selected"
                                        :
                                        ""
                                }
                            >

                                ${
                                    wh.escapeHtml(
                                        item.name
                                    )
                                }

                                ${
                                    item.company

                                        ?

                                        ` · ${
                                            wh.escapeHtml(
                                                item.company
                                            )
                                        }`

                                        :

                                        ""
                                }

                            </option>

                        `
                    )
                    .join(
                        ""
                    )
            }

        `;

    }


    async function saveToolStatus(
        event,
        tool
    ) {


        event.preventDefault();


        const status =
            document
                .querySelector(
                    'input[name="whToolStatus"]:checked'
                )
                ?.value
            ||
            "available";


        const responsibleId =
            document
                .getElementById(
                    "whToolResponsible"
                )
                ?.value
            ||
            null;


        const note =
            document
                .getElementById(
                    "whToolStatusNote"
                )
                ?.value
                .trim()
            ||
            null;


        const message =
            document.getElementById(
                "whToolStatusMessage"
            );


        const submit =
            document.querySelector(
                '[type="submit"][form="whToolStatusForm"]'
            );


        if (
            (
                status ===
                "loan_external"

                ||

                status ===
                "loan_collaborator"
            )

            &&

            !responsibleId
        ) {

            if (
                message
            ) {

                message.textContent =
                    "Selecciona un responsable para registrar el préstamo.";

            }

            return;

        }


        if (
            submit
        ) {

            submit.disabled =
                true;


            submit.textContent =
                "Guardando...";

        }


        try {

            const {
                error
            } =
                await wh.db.rpc(

                    "warehouse_set_tool_status",

                    {

                        p_tool_id:
                            tool.id,

                        p_status:
                            status,

                        p_responsible_id:
                            responsibleId,

                        p_note:
                            note

                    }

                );


            if (
                error
            ) {

                throw error;

            }


            await loadToolData();


            wh.closeModal();


            renderWorld();


            wh.toast(
                "Estatus de herramienta actualizado."
            );


            document.dispatchEvent(

                new CustomEvent(
                    "ggwarehouse:history-refresh"
                )

            );

        }

        catch (
            error
        ) {

            console.error(
                error
            );


            if (
                message
            ) {

                message.textContent =
                    String(
                        error.message
                        ||
                        error
                    );

            }

        }

        finally {

            if (
                submit
                &&
                document.body.contains(
                    submit
                )
            ) {

                submit.disabled =
                    false;


                submit.textContent =
                    "Guardar estatus";

            }

        }

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function statusLabel(
        status
    ) {


        return ({

            available:
                "Disponible",

            loan_external:
                "Prestada a externo",

            workshop:
                "En taller",

            lost:
                "Extravío",

            damaged:
                "Daño",

            loan_collaborator:
                "Prestada a colaborador"

        })[
            status
        ]
        ||
        status;

    }


    function scopeLabel(
        scope
    ) {


        return ({

            collaborator:
                "Colaborador",

            external:
                "Externo",

            both:
                "Colaborador / externo"

        })[
            scope
        ]
        ||
        scope;

    }


    function friendlyError(
        error
    ) {


        const text =
            String(
                error?.message
                ||
                error
                ||
                "Error"
            );


        if (
            text
                .toLowerCase()
                .includes(
                    "duplicate"
                )

            ||

            text
                .toLowerCase()
                .includes(
                    "unique"
                )
        ) {

            return "Ya existe un registro con ese nombre.";

        }


        return text;

    }


    function clamp(
        value,
        min,
        max
    ) {


        return Math.min(

            max,

            Math.max(
                min,
                value
            )

        );

    }

})();