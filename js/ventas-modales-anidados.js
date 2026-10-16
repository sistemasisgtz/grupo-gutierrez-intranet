(() => {

    "use strict";


    function install() {


        if (
            !window.GGSales
        ) {

            return false;

        }


        window.GGSales.openNestedModal =
            openNestedModal;


        window.GGSales.closeNestedModal =
            closeNestedModal;


        return true;

    }


    function openNestedModal({

        kicker =
            "VENTAS",

        title =
            "",

        body =
            "",

        footer =
            "",

        wide =
            false,

        xwide =
            false,

        onOpen =
            null

    }) {


        const root =
            document.getElementById(
                "salesModalRoot"
            );


        if (
            !root
        ) {

            return null;

        }


        const layer =
            document.createElement(
                "div"
            );


        layer.className =
            "sales-modal-backdrop sales-modal-nested";


        const escape =
            window.GGSales
                ?.escapeHtml
            ||
            (
                value =>
                    String(
                        value
                        ??
                        ""
                    )
            );


        layer.innerHTML = `

            <section
                class="
                    sales-modal
                    ${wide ? "wide" : ""}
                    ${xwide ? "xwide" : ""}
                "
            >

                <header>

                    <div>

                        <span>
                            ${escape(kicker)}
                        </span>

                        <h3>
                            ${escape(title)}
                        </h3>

                    </div>


                    <button
                        type="button"
                        data-sales-nested-close
                    >
                        ×
                    </button>

                </header>


                <div class="sales-modal-body">

                    ${body}

                </div>


                ${
                    footer

                        ?

                        `
                            <footer>
                                ${footer}
                            </footer>
                        `

                        :

                        ""
                }


            </section>

        `;


        root.appendChild(
            layer
        );


        layer
            .querySelector(
                "[data-sales-nested-close]"
            )
            ?.addEventListener(

                "click",

                () => {

                    closeNestedModal(
                        layer
                    );

                }

            );


        if (
            typeof onOpen ===
            "function"
        ) {

            onOpen(
                layer
            );

        }


        return layer;

    }


    function closeNestedModal(
        layer =
            null
    ) {


        const root =
            document.getElementById(
                "salesModalRoot"
            );


        if (
            !root
        ) {

            return;

        }


        let target =
            layer;


        if (
            !(target instanceof Element)

            ||

            !target.classList.contains(
                "sales-modal-nested"
            )
        ) {


            const layers =
                root.querySelectorAll(
                    ".sales-modal-nested"
                );


            target =
                layers[
                    layers.length - 1
                ]
                ||
                null;

        }


        target?.remove();

    }


    if (
        !install()
    ) {


        document.addEventListener(

            "ggsales:ready",

            install,

            {
                once:
                    true
            }

        );

    }

})();