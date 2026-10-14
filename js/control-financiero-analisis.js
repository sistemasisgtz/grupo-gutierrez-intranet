// =========================================================
// GRUPO GUTIERREZ
// CONTROL FINANCIERO · ANÁLISIS
// =========================================================

(() => {

    "use strict";


    let fin =
        null;


    const MONTHS = [

        "ENE",

        "FEB",

        "MAR",

        "ABR",

        "MAY",

        "JUN",

        "JUL",

        "AGO",

        "SEP",

        "OCT",

        "NOV",

        "DIC"

    ];


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

        renderEverything();


        document.addEventListener(
            "ggfinance:requests-updated",
            renderEverything
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


        [

            "financeAnalysisYear",

            "financeFinancialYear"

        ]
        .forEach(
            id => {


                const select =
                    document.getElementById(
                        id
                    );


                select.innerHTML =
                    years
                        .map(
                            year => `

                                <option
                                    value="${year}"
                                    ${
                                        String(
                                            year
                                        ) ===
                                        currentYear

                                            ?

                                            "selected"

                                            :

                                            ""
                                    }
                                >
                                    ${year}
                                </option>

                            `
                        )
                        .join(
                            ""
                        );

            }
        );


        fillMonths(
            "financeAnalysisMonth"
        );


        fillWeeks(
            "financeAnalysisWeek"
        );


        const area =
            document.getElementById(
                "financeAnalysisArea"
            );


        area.innerHTML = `

            <option value="">
                Todas las áreas
            </option>

            ${
                fin.unique(
                    fin.state.rules.map(
                        rule =>
                            rule.area_group
                    )
                )
                .map(
                    value => `

                        <option value="${
                            fin.escapeHtml(
                                value
                            )
                        }">
                            ${
                                fin.escapeHtml(
                                    value
                                )
                            }
                        </option>

                    `
                )
                .join(
                    ""
                )
            }

        `;


        refreshCategoryFilter();

    }


    function bindFilters() {


        [

            "financeAnalysisArea",

            "financeAnalysisYear",

            "financeAnalysisMonth",

            "financeAnalysisWeek",

            "financeAnalysisFrom",

            "financeAnalysisTo",

            "financeAnalysisCategory",

            "financeFinancialYear"

        ]
        .forEach(
            id => {

                document
                    .getElementById(
                        id
                    )
                    ?.addEventListener(

                        "change",

                        () => {


                            if (
                                id ===
                                "financeAnalysisArea"
                            ) {

                                refreshCategoryFilter();

                            }


                            renderEverything();

                        }

                    );

            }
        );

    }


    function renderEverything() {


        renderGroupAmounts();

        renderAnnualMatrix();

        renderCategoryMonthly();

        renderFinancial();

    }


    // =====================================================
    // SOLAMENTE PAGADOS
    // =====================================================

    function paidRequests() {


        return window
            .GGFinanceControl
            .getRequests()
            .filter(
                request =>

                    request.payment_confirmed

                    &&

                    request.actual_amount !==
                    null

                    &&

                    request.payment_date
            );

    }


    // =====================================================
    // FILTRO ANÁLISIS
    // =====================================================

    function analysisRequests() {


        const year =
            value(
                "financeAnalysisYear"
            );


        const month =
            value(
                "financeAnalysisMonth"
            );


        const week =
            value(
                "financeAnalysisWeek"
            );


        const area =
            value(
                "financeAnalysisArea"
            );


        const from =
            value(
                "financeAnalysisFrom"
            );


        const to =
            value(
                "financeAnalysisTo"
            );


        return paidRequests()
            .filter(
                request => {


                    const date =
                        request.payment_date;


                    if (
                        from
                        &&
                        date <
                        from
                    ) {

                        return false;

                    }


                    if (
                        to
                        &&
                        date >
                        to
                    ) {

                        return false;

                    }


                    if (
                        year
                        &&
                        request.payment_year !==
                        Number(
                            year
                        )
                    ) {

                        return false;

                    }


                    if (
                        month
                        &&
                        request.payment_month !==
                        Number(
                            month
                        )
                    ) {

                        return false;

                    }


                    if (
                        week
                        &&
                        request.payment_week !==
                        Number(
                            week
                        )
                    ) {

                        return false;

                    }


                    if (
                        area
                        &&
                        request.area_group !==
                        area
                    ) {

                        return false;

                    }


                    return true;

                }
            );

    }


    // =====================================================
    // REPORTE 1: MONTOS POR GRUPO
    // =====================================================

    function renderGroupAmounts() {


        const host =
            document.getElementById(
                "financeAnalysisGroupAmounts"
            );


        if (
            !host
        ) {

            return;

        }


        const requests =
            analysisRequests();


        const groups =
            groupTotals(
                requests
            );


        host.innerHTML = `

            <table class="finance-table compact-table">

                <thead>

                    <tr>

                        <th>Grupo</th>

                        <th>Solicitudes pagadas</th>

                        <th>Monto pagado</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        groups.length

                            ?

                            groups
                                .map(
                                    row => `

                                        <tr>

                                            <td>
                                                <strong>
                                                    ${
                                                        fin.escapeHtml(
                                                            row.name
                                                        )
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                ${row.count}
                                            </td>

                                            <td class="finance-money">
                                                ${
                                                    fin.money(
                                                        row.amount
                                                    )
                                                }
                                            </td>

                                        </tr>

                                    `
                                )
                                .join(
                                    ""
                                )

                            :

                            `

                                <tr>

                                    <td colspan="3">
                                        Sin información pagada.
                                    </td>

                                </tr>

                            `
                    }

                </tbody>

            </table>

        `;

    }


    // =====================================================
    // REPORTE 2:
    // GRUPO x MES x TIPO
    // =====================================================

    function renderAnnualMatrix() {


        const host =
            document.getElementById(
                "financeAnalysisMatrix"
            );


        if (
            !host
        ) {

            return;

        }


        const year =
            Number(
                value(
                    "financeAnalysisYear"
                )
            );


        const requests =
            paidRequests()
                .filter(
                    request =>
                        request.payment_year ===
                        year
                );


        const groups =
            window
                .GGFinanceControl
                .getGroups()
                .filter(
                    group =>
                        group.active
                );


        const types = [

            "COSTO",

            "GASTO",

            "OTROS",

            "DEUDA"

        ];


        const rows =
            [];


        groups.forEach(
            group => {

                types.forEach(
                    type => {


                        const values =
                            MONTHS.map(
                                (
                                    _,
                                    index
                                ) =>

                                    sum(

                                        requests.filter(
                                            request =>

                                                request.group_id ===
                                                group.id

                                                &&

                                                request.movement_type ===
                                                type

                                                &&

                                                request.payment_month ===
                                                index + 1
                                        )

                                    )

                            );


                        if (
                            values.some(
                                amount =>
                                    amount >
                                    0
                            )
                        ) {

                            rows.push({

                                group:
                                    group.name,

                                type,

                                values

                            });

                        }

                    }
                );

            }
        );


        host.innerHTML = `

            <table class="finance-matrix">

                <thead>

                    <tr>

                        <th>Grupo</th>

                        <th>Tipo</th>

                        ${
                            MONTHS
                                .map(
                                    month =>
                                        `<th>${month}</th>`
                                )
                                .join(
                                    ""
                                )
                        }

                        <th>Total</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        rows.length

                            ?

                            rows
                                .map(
                                    row => `

                                        <tr>

                                            <td>
                                                ${
                                                    fin.escapeHtml(
                                                        row.group
                                                    )
                                                }
                                            </td>

                                            <td>
                                                ${
                                                    fin.escapeHtml(
                                                        row.type
                                                    )
                                                }
                                            </td>

                                            ${
                                                row.values
                                                    .map(
                                                        amount => `

                                                            <td>
                                                                ${
                                                                    fin.money(
                                                                        amount
                                                                    )
                                                                }
                                                            </td>

                                                        `
                                                    )
                                                    .join(
                                                        ""
                                                    )
                                            }

                                            <td>
                                                <strong>
                                                    ${
                                                        fin.money(

                                                            row.values.reduce(
                                                                (
                                                                    total,
                                                                    amount
                                                                ) =>
                                                                    total
                                                                    +
                                                                    amount,
                                                                0
                                                            )

                                                        )
                                                    }
                                                </strong>
                                            </td>

                                        </tr>

                                    `
                                )
                                .join(
                                    ""
                                )

                            :

                            `

                                <tr>

                                    <td colspan="15">
                                        Sin pagos para el año seleccionado.
                                    </td>

                                </tr>

                            `
                    }

                </tbody>

            </table>

        `;

    }


    // =====================================================
    // REPORTE 3:
    // CATEGORÍA x MES
    // =====================================================

    function refreshCategoryFilter() {


        const area =
            value(
                "financeAnalysisArea"
            );


        const categories =
            fin.unique(

                fin.state.rules
                    .filter(
                        rule =>
                            !area
                            ||
                            rule.area_group ===
                            area
                    )
                    .map(
                        rule =>
                            rule.category
                    )

            );


        const select =
            document.getElementById(
                "financeAnalysisCategory"
            );


        if (
            !select
        ) {

            return;

        }


        const previous =
            select.value;


        select.innerHTML = `

            <option value="">
                Todas las categorías
            </option>

            ${
                categories
                    .map(
                        category => `

                            <option value="${
                                fin.escapeHtml(
                                    category
                                )
                            }">
                                ${
                                    fin.escapeHtml(
                                        category
                                    )
                                }
                            </option>

                        `
                    )
                    .join(
                        ""
                    )
            }

        `;


        if (
            categories.includes(
                previous
            )
        ) {

            select.value =
                previous;

        }

    }


    function renderCategoryMonthly() {


        const table =
            document.getElementById(
                "financeAnalysisCategoryTable"
            );


        const chart =
            document.getElementById(
                "financeAnalysisCategoryChart"
            );


        if (
            !table
            ||
            !chart
        ) {

            return;

        }


        const year =
            Number(
                value(
                    "financeAnalysisYear"
                )
            );


        const area =
            value(
                "financeAnalysisArea"
            );


        const category =
            value(
                "financeAnalysisCategory"
            );


        const requests =
            paidRequests()
                .filter(
                    request =>

                        request.payment_year ===
                        year

                        &&

                        (
                            !area
                            ||
                            request.area_group ===
                            area
                        )

                        &&

                        (
                            !category
                            ||
                            request.category ===
                            category
                        )
                );


        const values =
            MONTHS.map(
                (
                    _,
                    index
                ) =>

                    sum(

                        requests.filter(
                            request =>
                                request.payment_month ===
                                index + 1
                        )

                    )

            );


        table.innerHTML = `

            <table class="finance-table compact-table">

                <thead>

                    <tr>

                        <th>Mes</th>

                        <th>Monto pagado</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        MONTHS
                            .map(
                                (
                                    month,
                                    index
                                ) => `

                                    <tr>

                                        <td>
                                            <strong>
                                                ${month}
                                            </strong>
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    values[
                                                        index
                                                    ]
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


        drawChart(

            chart,

            [
                {
                    values,
                    className:
                        "chart-line-1",
                    dotClass:
                        "chart-dot-1"
                }
            ]

        );

    }


    // =====================================================
    // ANÁLISIS FINANCIERO
    // =====================================================

    function renderFinancial() {


        const year =
            Number(
                value(
                    "financeFinancialYear"
                )
            );


        const requests =
            paidRequests()
                .filter(
                    request =>
                        request.payment_year ===
                        year
                );


        renderQuarters(
            requests
        );


        renderFinancialByGroup(
            requests
        );


        renderFinancialMonthly(
            requests
        );

    }


    function renderQuarters(
        requests
    ) {


        const host =
            document.getElementById(
                "financeQuarterCards"
            );


        if (
            !host
        ) {

            return;

        }


        host.innerHTML =
            Array.from(
                {
                    length:
                        4
                },
                (
                    _,
                    quarter
                ) => {


                    const start =
                        quarter
                        *
                        3
                        +
                        1;


                    const end =
                        start
                        +
                        2;


                    const rows =
                        requests.filter(
                            request =>

                                request.payment_month >=
                                start

                                &&

                                request.payment_month <=
                                end
                        );


                    const cost =
                        sum(

                            rows.filter(
                                request =>
                                    request.movement_type ===
                                    "COSTO"
                            )

                        );


                    const expense =
                        sum(

                            rows.filter(
                                request =>
                                    request.movement_type ===
                                    "GASTO"
                            )

                        );


                    const total =
                        sum(
                            rows
                        );


                    return `

                        <article class="finance-quarter-card">

                            <span>
                                TRIMESTRE ${quarter + 1}
                            </span>

                            <strong>
                                ${
                                    fin.money(
                                        total
                                    )
                                }
                            </strong>

                            <small>
                                Costos:
                                ${
                                    fin.money(
                                        cost
                                    )
                                }
                                ·
                                Gastos:
                                ${
                                    fin.money(
                                        expense
                                    )
                                }
                            </small>

                        </article>

                    `;

                }
            )
            .join(
                ""
            );

    }


    function renderFinancialByGroup(
        requests
    ) {


        const host =
            document.getElementById(
                "financeFinancialByGroup"
            );


        const rows =
            groupTotals(
                requests
            );


        host.innerHTML = `

            <table class="finance-table compact-table">

                <thead>

                    <tr>

                        <th>Grupo</th>

                        <th>Costo</th>

                        <th>Gasto</th>

                        <th>Total pagado</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        rows
                            .map(
                                row => {


                                    const groupRequests =
                                        requests.filter(
                                            request =>
                                                request.group_id ===
                                                row.id
                                        );


                                    const cost =
                                        sum(

                                            groupRequests.filter(
                                                request =>
                                                    request.movement_type ===
                                                    "COSTO"
                                            )

                                        );


                                    const expense =
                                        sum(

                                            groupRequests.filter(
                                                request =>
                                                    request.movement_type ===
                                                    "GASTO"
                                            )

                                        );


                                    return `

                                        <tr>

                                            <td>
                                                <strong>
                                                    ${
                                                        fin.escapeHtml(
                                                            row.name
                                                        )
                                                    }
                                                </strong>
                                            </td>

                                            <td class="finance-money">
                                                ${
                                                    fin.money(
                                                        cost
                                                    )
                                                }
                                            </td>

                                            <td class="finance-money">
                                                ${
                                                    fin.money(
                                                        expense
                                                    )
                                                }
                                            </td>

                                            <td class="finance-money">
                                                ${
                                                    fin.money(
                                                        row.amount
                                                    )
                                                }
                                            </td>

                                        </tr>

                                    `;

                                }
                            )
                            .join(
                                ""
                            )
                    }

                </tbody>

            </table>

        `;

    }


    function renderFinancialMonthly(
        requests
    ) {


        const table =
            document.getElementById(
                "financeFinancialMonthlyTable"
            );


        const chart =
            document.getElementById(
                "financeFinancialMonthlyChart"
            );


        const costs =
            [];


        const expenses =
            [];


        const totals =
            [];


        MONTHS.forEach(
            (
                _,
                index
            ) => {


                const month =
                    requests.filter(
                        request =>
                            request.payment_month ===
                            index + 1
                    );


                costs.push(

                    sum(

                        month.filter(
                            request =>
                                request.movement_type ===
                                "COSTO"
                        )

                    )

                );


                expenses.push(

                    sum(

                        month.filter(
                            request =>
                                request.movement_type ===
                                "GASTO"
                        )

                    )

                );


                totals.push(
                    sum(
                        month
                    )
                );

            }
        );


        table.innerHTML = `

            <table class="finance-table compact-table">

                <thead>

                    <tr>

                        <th>Mes</th>

                        <th>Costo</th>

                        <th>Gasto</th>

                        <th>Total pagado</th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        MONTHS
                            .map(
                                (
                                    month,
                                    index
                                ) => `

                                    <tr>

                                        <td>
                                            <strong>
                                                ${month}
                                            </strong>
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    costs[
                                                        index
                                                    ]
                                                )
                                            }
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    expenses[
                                                        index
                                                    ]
                                                )
                                            }
                                        </td>

                                        <td class="finance-money">
                                            ${
                                                fin.money(
                                                    totals[
                                                        index
                                                    ]
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


        drawChart(

            chart,

            [

                {
                    values:
                        costs,
                    className:
                        "chart-line-1",
                    dotClass:
                        "chart-dot-1"
                },

                {
                    values:
                        expenses,
                    className:
                        "chart-line-2",
                    dotClass:
                        "chart-dot-2"
                },

                {
                    values:
                        totals,
                    className:
                        "chart-line-3",
                    dotClass:
                        "chart-dot-3"
                }

            ]

        );

    }


    // =====================================================
    // SVG CHART
    // =====================================================

    function drawChart(
        host,
        series
    ) {


        const width =
            900;


        const height =
            280;


        const left =
            65;


        const right =
            20;


        const top =
            20;


        const bottom =
            40;


        const plotWidth =
            width
            -
            left
            -
            right;


        const plotHeight =
            height
            -
            top
            -
            bottom;


        const max =
            Math.max(

                1,

                ...series.flatMap(
                    item =>
                        item.values
                )

            );


        const x = index =>

            left
            +
            (
                plotWidth
                *
                index
                /
                11
            );


        const y = value =>

            top
            +
            plotHeight
            -
            (
                Number(
                    value
                    ||
                    0
                )
                /
                max
                *
                plotHeight
            );


        const horizontalGrid =
            Array.from(
                {
                    length:
                        5
                },
                (
                    _,
                    index
                ) => {


                    const ratio =
                        index
                        /
                        4;


                    const yy =
                        top
                        +
                        ratio
                        *
                        plotHeight;


                    const amount =
                        max
                        *
                        (
                            1
                            -
                            ratio
                        );


                    return `

                        <line
                            class="chart-grid"
                            x1="${left}"
                            y1="${yy}"
                            x2="${width - right}"
                            y2="${yy}"
                        ></line>

                        <text
                            x="${left - 8}"
                            y="${yy + 4}"
                            text-anchor="end"
                        >
                            ${shortMoney(amount)}
                        </text>

                    `;

                }
            )
            .join(
                ""
            );


        const monthLabels =
            MONTHS
                .map(
                    (
                        month,
                        index
                    ) => `

                        <text
                            x="${x(index)}"
                            y="${height - 12}"
                            text-anchor="middle"
                        >
                            ${month}
                        </text>

                    `
                )
                .join(
                    ""
                );


        const lines =
            series
                .map(
                    item => {


                        const points =
                            item.values
                                .map(
                                    (
                                        value,
                                        index
                                    ) =>
                                        `${x(index)},${y(value)}`
                                )
                                .join(
                                    " "
                                );


                        const dots =
                            item.values
                                .map(
                                    (
                                        value,
                                        index
                                    ) => `

                                        <circle
                                            class="${item.dotClass}"
                                            cx="${x(index)}"
                                            cy="${y(value)}"
                                            r="4"
                                        ></circle>

                                    `
                                )
                                .join(
                                    ""
                                );


                        return `

                            <polyline
                                class="${item.className}"
                                points="${points}"
                            ></polyline>

                            ${dots}

                        `;

                    }
                )
                .join(
                    ""
                );


        host.innerHTML = `

            <svg
                viewBox="0 0 ${width} ${height}"
                preserveAspectRatio="none"
            >

                ${horizontalGrid}

                <line
                    class="chart-axis"
                    x1="${left}"
                    y1="${top}"
                    x2="${left}"
                    y2="${height - bottom}"
                ></line>

                <line
                    class="chart-axis"
                    x1="${left}"
                    y1="${height - bottom}"
                    x2="${width - right}"
                    y2="${height - bottom}"
                ></line>

                ${monthLabels}

                ${lines}

            </svg>

        `;

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function groupTotals(
        requests
    ) {


        const map =
            new Map();


        requests.forEach(
            request => {


                if (
                    !map.has(
                        request.group_id
                    )
                ) {

                    map.set(

                        request.group_id,

                        {

                            id:
                                request.group_id,

                            name:
                                request.group_name_snapshot,

                            amount:
                                0,

                            count:
                                0

                        }

                    );

                }


                const row =
                    map.get(
                        request.group_id
                    );


                row.amount +=
                    Number(
                        request.actual_amount
                        ||
                        0
                    );


                row.count +=
                    1;

            }
        );


        return [
            ...map.values()
        ]
        .sort(
            (
                a,
                b
            ) =>
                b.amount
                -
                a.amount
        );

    }


    function sum(
        requests
    ) {


        return requests.reduce(

            (
                total,
                request
            ) =>

                total
                +
                Number(
                    request.actual_amount
                    ||
                    0
                ),

            0

        );

    }


    function availableYears() {


        const set =
            new Set();


        window
            .GGFinanceControl
            ?.getRequests()
            ?.forEach(
                request => {

                    if (
                        request.payment_year
                    ) {

                        set.add(
                            request.payment_year
                        );

                    }

                }
            );


        set.add(
            new Date()
                .getFullYear()
        );


        return [
            ...set
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


        select.innerHTML = `

            <option value="">
                Todos los meses
            </option>

            ${
                MONTHS
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


    function shortMoney(
        value
    ) {


        const number =
            Number(
                value
                ||
                0
            );


        if (
            number >=
            1000000
        ) {

            return `$${(
                number
                /
                1000000
            ).toFixed(
                1
            )}M`;

        }


        if (
            number >=
            1000
        ) {

            return `$${(
                number
                /
                1000
            ).toFixed(
                0
            )}K`;

        }


        return `$${Math.round(number)}`;

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

})();