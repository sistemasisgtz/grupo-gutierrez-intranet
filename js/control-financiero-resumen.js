// =========================================================
// GRUPO GUTIERREZ
// CONTROL FINANCIERO · RESUMEN EJECUTIVO
// =========================================================

(() => {

    "use strict";


    let fin =
        null;


    document.addEventListener(
        "ggfinance:control-ready",
        init,
        {
            once:
                true
        }
    );


    function init() {


        fin =
            window.GGFinance;


        initializeFilters();

        bindFilters();

        render();


        document.addEventListener(
            "ggfinance:requests-updated",
            render
        );

    }


    function initializeFilters() {


        const years =
            availableYears();


        const currentYear =
            String(
                new Date()
                    .getFullYear()
            );


        const year =
            document.getElementById(
                "financeSummaryYear"
            );


        year.innerHTML = `

            <option value="">
                Todos los años
            </option>

            ${
                years
                    .map(
                        value => `

                            <option
                                value="${value}"
                                ${
                                    String(
                                        value
                                    ) ===
                                    currentYear

                                        ?

                                        "selected"

                                        :

                                        ""
                                }
                            >
                                ${value}
                            </option>

                        `
                    )
                    .join(
                        ""
                    )
            }

        `;


        fillMonths(
            "financeSummaryMonth"
        );


        fillWeeks(
            "financeSummaryWeek"
        );

    }


    function bindFilters() {


        [

            "financeSummaryYear",

            "financeSummaryMonth",

            "financeSummaryWeek",

            "financeSummaryFrom",

            "financeSummaryTo"

        ]
        .forEach(
            id => {

                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(
                        "change",
                        render
                    );

            }
        );

    }


    function render() {


        const requests =
            filteredRequests();


        const paid =
            requests.filter(
                request =>
                    request.payment_confirmed
                    &&
                    request.actual_amount !==
                    null
            );


        const pending =
            requests.filter(
                request =>
                    request.authorization_status ===
                    "pending"
            );


        const authorizedUnpaid =
            requests.filter(
                request =>

                    request.authorization_status ===
                    "authorized"

                    &&

                    !request.payment_confirmed
            );


        setMoney(

            "financeSummaryPaid",

            sum(
                paid,
                actual
            )

        );


        setMoney(

            "financeSummaryPending",

            sum(
                pending,
                projected
            )

        );


        setMoney(

            "financeSummaryAuthorized",

            sum(
                authorizedUnpaid,
                projected
            )

        );


        setMoney(

            "financeSummaryCosts",

            sum(

                paid.filter(
                    request =>
                        request.movement_type ===
                        "COSTO"
                ),

                actual

            )

        );


        setMoney(

            "financeSummaryExpenses",

            sum(

                paid.filter(
                    request =>
                        request.movement_type ===
                        "GASTO"
                ),

                actual

            )

        );


        renderByGroup(
            requests
        );

    }


    function filteredRequests() {


        const requests =
            window
                .GGFinanceControl
                .getRequests();


        const year =
            value(
                "financeSummaryYear"
            );


        const month =
            value(
                "financeSummaryMonth"
            );


        const week =
            value(
                "financeSummaryWeek"
            );


        const from =
            value(
                "financeSummaryFrom"
            );


        const to =
            value(
                "financeSummaryTo"
            );


        return requests.filter(
            request => {


                const referenceDate =
                    request.payment_date
                    ||
                    request.request_date;


                if (
                    from
                    &&
                    referenceDate <
                    from
                ) {

                    return false;

                }


                if (
                    to
                    &&
                    referenceDate >
                    to
                ) {

                    return false;

                }


                const date =
                    new Date(
                        `${referenceDate}T12:00:00`
                    );


                if (
                    year
                    &&
                    String(
                        date.getFullYear()
                    ) !==
                    year
                ) {

                    return false;

                }


                if (
                    month
                    &&
                    String(
                        date.getMonth()
                        +
                        1
                    ) !==
                    month
                ) {

                    return false;

                }


                if (
                    week
                    &&
                    String(
                        isoWeek(
                            date
                        )
                    ) !==
                    week
                ) {

                    return false;

                }


                return true;

            }
        );

    }


    function renderByGroup(
        requests
    ) {


        const host =
            document.getElementById(
                "financeSummaryByGroup"
            );


        if (
            !host
        ) {

            return;

        }


        const groups =
            window
                .GGFinanceControl
                .getGroups()
                .filter(
                    group =>
                        group.active
                );


        const rows =
            groups.map(
                group => {


                    const groupRequests =
                        requests.filter(
                            request =>
                                request.group_id ===
                                group.id
                        );


                    const paid =
                        groupRequests.filter(
                            request =>
                                request.payment_confirmed
                                &&
                                request.actual_amount !==
                                null
                        );


                    const pending =
                        groupRequests.filter(
                            request =>
                                request.authorization_status ===
                                "pending"
                        );


                    const authorized =
                        groupRequests.filter(
                            request =>

                                request.authorization_status ===
                                "authorized"

                                &&

                                !request.payment_confirmed
                        );


                    return {

                        group,

                        paid:
                            sum(
                                paid,
                                actual
                            ),

                        pending:
                            sum(
                                pending,
                                projected
                            ),

                        authorized:
                            sum(
                                authorized,
                                projected
                            ),

                        costs:
                            sum(

                                paid.filter(
                                    request =>
                                        request.movement_type ===
                                        "COSTO"
                                ),

                                actual

                            ),

                        expenses:
                            sum(

                                paid.filter(
                                    request =>
                                        request.movement_type ===
                                        "GASTO"
                                ),

                                actual

                            )

                    };

                }
            );


        host.innerHTML = `

            <table class="finance-table compact-table">

                <thead>

                    <tr>

                        <th>Grupo</th>

                        <th>Total pagado</th>

                        <th>Pendiente autorización</th>

                        <th>Autorizado sin pagar</th>

                        <th>Costos pagados</th>

                        <th>Gastos pagados</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        rows
                            .map(
                                row => `

                                    <tr>

                                        <td>
                                            <strong>
                                                ${
                                                    fin.escapeHtml(
                                                        row.group.name
                                                    )
                                                }
                                            </strong>
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    row.paid
                                                )
                                            }
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    row.pending
                                                )
                                            }
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    row.authorized
                                                )
                                            }
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    row.costs
                                                )
                                            }
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    row.expenses
                                                )
                                            }
                                        </td>

                                    </tr>

                                `
                            )
                            .join(
                                ""
                            )
                    }

                </tbody>

            </table>

        `;

    }


    function availableYears() {


        const years =
            new Set();


        window
            .GGFinanceControl
            ?.getRequests()
            ?.forEach(
                request => {

                    const date =
                        request.payment_date
                        ||
                        request.request_date;


                    if (
                        date
                    ) {

                        years.add(
                            Number(
                                date.slice(
                                    0,
                                    4
                                )
                            )
                        );

                    }

                }
            );


        years.add(
            new Date()
                .getFullYear()
        );


        return [
            ...years
        ]
        .sort(
            (
                a,
                b
            ) =>
                b - a
        );

    }


    function fillMonths(
        id
    ) {


        const select =
            document.getElementById(
                id
            );


        const months = [

            "Enero",

            "Febrero",

            "Marzo",

            "Abril",

            "Mayo",

            "Junio",

            "Julio",

            "Agosto",

            "Septiembre",

            "Octubre",

            "Noviembre",

            "Diciembre"

        ];


        select.innerHTML = `

            <option value="">
                Todos los meses
            </option>

            ${
                months
                    .map(
                        (
                            month,
                            index
                        ) => `

                            <option value="${index + 1}">
                                ${month}
                            </option>

                        `
                    )
                    .join(
                        ""
                    )
            }

        `;

    }


    function fillWeeks(
        id
    ) {


        const select =
            document.getElementById(
                id
            );


        select.innerHTML = `

            <option value="">
                Todas las semanas
            </option>

            ${
                Array.from(
                    {
                        length:
                            53
                    },
                    (
                        _,
                        index
                    ) =>
                        index + 1
                )
                .map(
                    week => `

                        <option value="${week}">
                            Semana ${week}
                        </option>

                    `
                )
                .join(
                    ""
                )
            }

        `;

    }


    function actual(
        request
    ) {

        return Number(
            request.actual_amount
            ||
            0
        );

    }


    function projected(
        request
    ) {

        return Number(

            request.actual_amount
            ??
            request.requested_amount
            ??
            0

        );

    }


    function sum(
        requests,
        mapper
    ) {


        return requests.reduce(

            (
                total,
                request
            ) =>

                total
                +
                mapper(
                    request
                ),

            0

        );

    }


    function setMoney(
        id,
        amount
    ) {


        const node =
            document.getElementById(
                id
            );


        if (
            node
        ) {

            node.textContent =
                fin.money(
                    amount
                );

        }

    }


    function value(
        id
    ) {


        return document
            .getElementById(
                id
            )
            ?.value
        ||
        "";

    }


    function isoWeek(
        date
    ) {


        const d =
            new Date(
                Date.UTC(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                )
            );


        const day =
            d.getUTCDay()
            ||
            7;


        d.setUTCDate(
            d.getUTCDate()
            +
            4
            -
            day
        );


        const yearStart =
            new Date(
                Date.UTC(
                    d.getUTCFullYear(),
                    0,
                    1
                )
            );


        return Math.ceil(

            (
                (
                    d - yearStart
                )
                /
                86400000
                +
                1
            )
            /
            7

        );

    }

})();