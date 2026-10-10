// =========================================================
// GRUPO GUTIERREZ
// TABS REUTILIZABLES PARA MÓDULOS
// =========================================================

(() => {

    "use strict";


    function initializeTabs(
        container
    ) {

        const tabs =
            container.querySelectorAll(
                "[data-module-tab]"
            );


        const panels =
            container.querySelectorAll(
                "[data-module-panel]"
            );


        function activate(
            tabName
        ) {

            tabs.forEach(
                tab => {

                    const active =
                        tab.dataset
                            .moduleTab
                        ===
                        tabName;


                    tab.classList
                        .toggle(
                            "active",
                            active
                        );


                    tab.setAttribute(
                        "aria-selected",
                        active
                            ? "true"
                            : "false"
                    );

                }
            );


            panels.forEach(
                panel => {

                    const active =
                        panel.dataset
                            .modulePanel
                        ===
                        tabName;


                    panel.classList
                        .toggle(
                            "active",
                            active
                        );

                }
            );

        }


        tabs.forEach(
            tab => {

                tab.addEventListener(
                    "click",
                    () => {

                        activate(
                            tab.dataset
                                .moduleTab
                        );

                    }
                );

            }
        );


        const initial =
            container.querySelector(
                "[data-module-tab].active"
            )
            ||
            tabs[0];


        if (
            initial
        ) {

            activate(
                initial.dataset
                    .moduleTab
            );

        }

    }


    document
        .querySelectorAll(
            "[data-module-tabs]"
        )
        .forEach(
            initializeTabs
        );

})();