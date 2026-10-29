(function browserApp() {

  'use strict';

  const db = window.ggSupabase;

  const $ = id =>
    document.getElementById(id);

  const esc = v =>
    String(v ?? '').replace(
      /[&<>"']/g,
      c => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[c])
    );

  const num = v => Number(v) || 0;

  const money = v =>
    new Intl.NumberFormat(
      'es-MX',
      {
        style:'currency',
        currency:'MXN'
      }
    ).format(num(v));

  const fmt = v =>
    v
      ? new Date(v).toLocaleString(
          'es-MX',
          {
            dateStyle:'medium',
            timeStyle:'short'
          }
        )
      : '—';

  const val = (n,a) =>
    n?.getAttribute(a) || '';

  const direct = (n,name,ns) =>
    [...(n?.children || [])].find(
      x => x.localName===name &&
           x.namespaceURI===ns
    ) || null;

  const children = (n,name,ns) =>
    [...(n?.children || [])].filter(
      x => x.localName===name &&
           x.namespaceURI===ns
    );

  const attrs = el =>
    Object.fromEntries(
      [...(el?.attributes || [])]
        .filter(
          x => ![
            'Sello',
            'Certificado',
            'SelloCFD',
            'SelloSAT'
          ].includes(x.localName)
        )
        .map(x => [x.localName,x.value])
    );

  let section='active';
  let page=0;
  let rows=[];
  let total=0;
  let draft=null;
  let rawXml='';
  let currentDetail=null;
  let mayWrite=false;
  let searchTimer;
  let fetchVersion=0;

  const setMsg=(id,t,error=false)=>{
    $(id).textContent=t;
    $(id).classList.toggle('error',error);
  };

  // =================================================
  // TEMA
  // =================================================

  function theme(t) {

    const chosen =
      t==='light' ? 'light' : 'dark';

    document.documentElement.dataset.gxfTheme=
      chosen;

    $('gxfTheme').textContent=
      chosen==='dark'
        ? '☀ Modo claro'
        : '☾ Modo oscuro';

    try {

      localStorage.setItem(
        'gg-xml-theme',
        chosen
      );

    } catch(_) {
      // El tema funciona aunque no haya storage.
    }
  }

  // =================================================
  // LECTOR XML / CFDI
  // =================================================

  function parseXML(content) {

    if (
      content.length > 2_000_000 ||
      /<!\s*(DOCTYPE|ENTITY)\b/i.test(content)
    ) {

      throw Error(
        'Archivo demasiado grande o con entidades/DOCTYPE no admitidos.'
      );
    }

    const doc = new DOMParser().parseFromString(
      content,
      'application/xml'
    );

    if(doc.querySelector('parsererror')) {
      throw Error('XML mal formado.');
    }

    const root=doc.documentElement;
    const ns=root.namespaceURI;

    if (
      root.localName !== 'Comprobante' ||
      ![
        'http://www.sat.gob.mx/cfd/4',
        'http://www.sat.gob.mx/cfd/3'
      ].includes(ns)
    ) {
      throw Error(
        'Se requiere un CFDI XML 3.3 o 4.0.'
      );
    }

    if(val(root,'TipoDeComprobante') !== 'I') {

      throw Error(
        'Este módulo importa facturas de ingreso (tipo I).'
      );
    }

    const issuer=direct(root,'Emisor',ns);
    const receiver=direct(root,'Receptor',ns);

    const concepts=children(
      direct(root,'Conceptos',ns),
      'Concepto',
      ns
    );

    const stamp=
      doc.getElementsByTagNameNS(
        'http://www.sat.gob.mx/TimbreFiscalDigital',
        'TimbreFiscalDigital'
      )[0];

    if(
      !issuer ||
      !receiver ||
      !stamp ||
      !concepts.length ||
      concepts.length>400
    ) {
      throw Error(
        'CFDI incompleto, sin timbre o con más de 400 conceptos.'
      );
    }

    const uuid=val(stamp,'UUID').toUpperCase();

    if(
      !/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(uuid)
    ) {
      throw Error('UUID fiscal inválido.');
    }

    const taxNode=direct(root,'Impuestos',ns);

    function taxes(node) {

      const box=direct(node,'Impuestos',ns);

      return ['Traslados','Retenciones'].flatMap(
        group =>
          children(
            direct(box,group,ns),
            group==='Traslados'
              ? 'Traslado'
              : 'Retencion',
            ns
          ).map(t=>({
            type:group==='Traslados'
              ? 'traslado'
              : 'retencion',

            ...attrs(t)
          }))
      );
    }

    const items=concepts.map((c,i)=>({

      lineNo:i+1,

      code:val(c,'ClaveProdServ'),

      unitCode:val(c,'ClaveUnidad'),

      unit:val(c,'Unidad'),

      sku:val(c,'NoIdentificacion'),

      description:val(c,'Descripcion'),

      quantity:num(val(c,'Cantidad')),

      unitPrice:num(val(c,'ValorUnitario')),

      amount:num(val(c,'Importe')),

      discount:num(val(c,'Descuento')),

      taxObject:val(c,'ObjetoImp'),

      taxes:taxes(c)

    }));

    const original={

      uuid,

      version:val(root,'Version'),

      series:val(root,'Serie'),

      folio:val(root,'Folio'),

      issuedAt:val(root,'Fecha'),

      stampedAt:val(stamp,'FechaTimbrado'),

      issuerName:val(issuer,'Nombre'),

      issuerRfc:val(issuer,'Rfc'),

      issuerRegime:val(issuer,'RegimenFiscal'),

      receiverName:val(receiver,'Nombre'),

      receiverRfc:val(receiver,'Rfc'),

      receiverRegime:
        val(receiver,'RegimenFiscalReceptor'),

      receiverPostal:
        val(receiver,'DomicilioFiscalReceptor'),

      use:val(receiver,'UsoCFDI'),

      currency:val(root,'Moneda')||'MXN',

      exchangeRate:val(root,'TipoCambio'),

      receiptType:val(root,'TipoDeComprobante'),

      paymentMethod:val(root,'MetodoPago'),

      paymentForm:val(root,'FormaPago'),

      exportType:val(root,'Exportacion'),

      place:val(root,'LugarExpedicion'),

      subtotal:num(val(root,'SubTotal')),

      discount:num(val(root,'Descuento')),

      total:num(val(root,'Total')),

      taxTransferred:
        num(val(taxNode,'TotalImpuestosTrasladados')),

      taxWithheld:
        num(val(taxNode,'TotalImpuestosRetenidos')),

      certNumber:val(root,'NoCertificado'),

      satCertNumber:val(stamp,'NoCertificadoSAT'),

      certifierRfc:val(stamp,'RfcProvCertif'),

      taxes:taxes(root),

      extra:attrs(root),

      complements:[
        ...doc.getElementsByTagNameNS(
          ns,
          'Complemento'
        )
      ].flatMap(
        x => [...x.children].map(
          k => k.localName
        )
      )

    };

    if(
      !original.issuerRfc ||
      !original.receiverRfc ||
      !original.issuedAt ||
      !val(root,'Total') ||
      !Number.isFinite(Number(val(root,'Total'))) ||
      original.total<0
    ) {
      throw Error(
        'Datos fiscales esenciales incompletos.'
      );
    }

    return {
      original,
      items
    };
  }

  // =================================================
  // COMPONENTES DE LA VISTA PREVIA
  // =================================================

  function kv(label,value) {

    return (
      '<div class="gxf-kv">' +
        '<small>'+esc(label)+'</small>' +
        '<strong>'+esc(value??'—')+'</strong>' +
      '</div>'
    );
  }

  function field(name,label,value,type='text') {

    return (
      '<label class="gxf-field">' +
        esc(label) +
        '<input data-head="'+name+'"' +
        ' type="'+type+'"' +
        ' value="'+esc(value||'')+'"' +
        ' maxlength="220">' +
      '</label>'
    );
  }

  function itemTax(taxes) {

    return taxes.map(
      t=>esc(
        (
          t.type==='traslado'
            ? 'Traslado '
            : 'Retención '
        ) +
        (t.Impuesto||'') +
        ' ' +
        (t.TasaOCuota||'') +
        ' $' +
        (t.Importe||'0')
      )
    ).join(' / ')||'—';
  }

  // =================================================
  // VISTA PREVIA COMPLETA
  // =================================================

  function preview() {

    const o=draft.original;

    const initialTotal=
      o.subtotal -
      o.discount +
      o.taxTransferred -
      o.taxWithheld;

    const mismatch=
      Math.abs(initialTotal-o.total)>.03;

    $('gxfPreview').hidden=false;

    $('gxfPreview').innerHTML=`

      <div class="gxf-preview-head">

        <div>
          <span class="gxf-chip good">
            XML leído · CFDI ${esc(o.version)}
          </span>

          <h3 class="gxf-subtitle">
            Factura
            ${esc(
              (o.series+'-'+o.folio).replace(/^-/, '')
            )}
          </h3>
        </div>

        <strong class="gxf-amount">
          ${money(o.total)}
        </strong>

      </div>

      <div class="gxf-grid">

        ${kv('Emisor',o.issuerName)}
        ${kv('RFC emisor',o.issuerRfc)}
        ${kv('Régimen emisor',o.issuerRegime)}
        ${kv('Receptor',o.receiverName)}
        ${kv('RFC receptor',o.receiverRfc)}

        ${kv(
          'Régimen receptor / CP',
          (o.receiverRegime||'—')+
          ' / '+
          (o.receiverPostal||'—')
        )}

        ${kv('Fecha emisión',o.issuedAt)}
        ${kv('Timbrado',o.stampedAt)}
        ${kv('UUID',o.uuid)}

        ${kv(
          'Método / forma pago',
          (o.paymentMethod||'—')+
          ' / '+
          (o.paymentForm||'—')
        )}

        ${kv(
          'Uso CFDI / Lugar',
          (o.use||'—')+
          ' / '+
          (o.place||'—')
        )}

        ${kv(
          'Moneda / Tipo cambio',
          (o.currency||'—')+
          ' / '+
          (o.exchangeRate||'—')
        )}

        ${kv('Subtotal',money(o.subtotal))}
        ${kv('Descuento',money(o.discount))}

        ${kv(
          'Impuestos trasladados',
          money(o.taxTransferred)
        )}

        ${kv('Retenciones',money(o.taxWithheld))}
        ${kv('TOTAL FISCAL',money(o.total))}
        ${kv('Certificado SAT',o.satCertNumber)}

      </div>

      <div class="gxf-tip">

        <strong>Fuente fiscal protegida.</strong>

        Los ajustes siguientes son de uso interno
        y NO cambian el XML original, el UUID,
        los RFC ni los importes fiscales timbrados.

        ${
          mismatch
            ? '<strong>Revisa: el cálculo simple de impuestos no coincide con el total declarado.</strong>'
            : 'La suma general del comprobante es consistente.'
        }

      </div>

      <h3 class="gxf-subtitle">
        Datos internos editables
      </h3>

      <div class="gxf-edit-grid">

        ${field('series','Serie mostrada',o.series)}
        ${field('folio','Folio mostrado',o.folio)}

        ${field(
          'receiverName',
          'Cliente mostrado',
          o.receiverName
        )}

        ${field(
          'issuerName',
          'Emisor mostrado',
          o.issuerName
        )}

        ${field(
          'reference',
          'Folio proyecto / referencia interna',
          ''
        )}

        ${field(
          'notes',
          'Notas internas',
          ''
        )}

      </div>

      <h3 class="gxf-subtitle">
        Partidas del CFDI (${draft.items.length})
      </h3>

      <div class="gxf-items">

        <table class="gxf-table">

          <thead>
            <tr>
              <th># / Código SAT</th>
              <th>Descripción interna editable</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio unitario</th>
              <th>Importe interno</th>
              <th>Impuestos originales</th>
            </tr>
          </thead>

          <tbody>

            ${
              draft.items.map((it,i)=>`

                <tr>

                  <td>
                    ${i+1}

                    <small>
                      ${esc(it.code)}
                      /
                      ${esc(it.sku||'—')}
                    </small>
                  </td>

                  <td>
                    <input
                      type="text"
                      data-line="${i}"
                      data-field="description"
                      maxlength="2000"
                      value="${esc(it.description)}"
                    >
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      data-line="${i}"
                      data-field="quantity"
                      value="${it.quantity}"
                    >
                  </td>

                  <td>
                    ${esc(it.unit||it.unitCode)}
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      data-line="${i}"
                      data-field="unitPrice"
                      value="${it.unitPrice}"
                    >
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      data-line="${i}"
                      data-field="amount"
                      value="${it.amount}"
                    >
                  </td>

                  <td>
                    ${itemTax(it.taxes)}
                  </td>

                </tr>

              `).join('')
            }

          </tbody>
        </table>

      </div>

      <div class="gxf-tip">

        Se conservarán <strong>dos versiones</strong>:

        el concepto extraído del XML y el ajuste interno
        que captures.

        El importe fiscal de la factura no se recalcula
        al editar partidas internas.

        Otros módulos podrán elegir cuál utilizar.

      </div>

      <h3 class="gxf-subtitle">
        Impuestos y complementos
      </h3>

      <div class="gxf-grid">

        ${kv(
          'Traslados / Retenciones',
          itemTax(o.taxes)
        )}

        ${kv(
          'Complementos',
          o.complements.join(', ')||'—'
        )}

        ${kv(
          'Serie certificado emisor',
          o.certNumber
        )}

      </div>
    `;

    $('gxfSave').disabled=false;
  }

  // =================================================
  // CARGAR XML
  // =================================================

  async function onFile(file) {

    if(!file) return;

    $('gxfSave').disabled=true;

    try {

      if(file.size>2_000_000) {
        throw Error('Máximo 2 MB por factura.');
      }

      if(!/\.xml$/i.test(file.name)) {
        throw Error('Selecciona un archivo .xml.');
      }

      rawXml=await file.text();

      draft=parseXML(rawXml);

      preview();

      setMsg(
        'gxfImportMessage',
        'Listo para revisar y guardar. No se ha enviado nada a Supabase.'
      );

    } catch(e) {

      draft=null;
      rawXml='';

      $('gxfPreview').hidden=true;

      setMsg(
        'gxfImportMessage',
        e.message,
        true
      );
    }
  }

  // =================================================
  // GUARDAR FACTURA Y PARTIDAS
  // =================================================

  async function save() {

    if(!draft || !mayWrite) return;

    const display={};

    for(
      const input of
      $('gxfPreview').querySelectorAll('[data-head]')
    ) {

      display[input.dataset.head]=
        input.value.trim();
    }

    const items=draft.items.map(
      it=>({

        source:it,

        edited:{
          description:it.description,
          quantity:it.quantity,
          unitPrice:it.unitPrice,
          amount:it.amount
        }

      })
    );

    for(
      const input of
      $('gxfPreview').querySelectorAll('[data-line]')
    ) {

      const row=items[Number(input.dataset.line)];

      if(!row) {
        throw Error('Partida fuera de rango.');
      }

      const f=input.dataset.field;

      const isNum=f!=='description';

      if(
        isNum &&
        (
          input.value.trim()==='' ||
          !Number.isFinite(Number(input.value)) ||
          Number(input.value)<0
        )
      ) {

        setMsg(
          'gxfImportMessage',
          'Corrige los importes y cantidades de las partidas.',
          true
        );

        return;
      }

      row.edited[f]=
        isNum
          ? Number(input.value)
          : input.value.trim();
    }

    $('gxfSave').disabled=true;

    setMsg(
      'gxfImportMessage',
      'Guardando factura y '+items.length+' partidas…'
    );

    try {

      const {error}=await db.rpc(
        'gg_xml_import',
        {
          p_xml:rawXml,
          p_original:draft.original,
          p_display:display,
          p_items:items
        }
      );

      if(error) throw error;

      $('gxfImportDialog').close();

      draft=null;
      rawXml='';

      page=0;
      section='active';

      setActiveTab();

      await load();

      setMsg(
        'gxfMessage',
        'Factura y partidas guardadas correctamente.'
      );

    } catch(e) {

      setMsg(
        'gxfImportMessage',
        'No se guardó: '+e.message,
        true
      );

    } finally {

      $('gxfSave').disabled=false;
    }
  }

  // =================================================
  // FILTROS Y REGISTRO
  // =================================================

  function setActiveTab() {

    document
      .querySelectorAll('[data-gxf-section]')
      .forEach(
        b=>b.classList.toggle(
          'active',
          b.dataset.gxfSection===section
        )
      );
  }

  function stats(data) {

    $('gxfStats').innerHTML=[

      ['Facturas activas',data.active_count||0],

      ['Facturas ocultas',data.hidden_count||0],

      ['En este filtro',data.total||0],

      ['Página actual',page+1]

    ].map(
      ([l,v])=>

        '<article class="gxf-stat">'+
          '<small>'+esc(l)+'</small>'+
          '<strong>'+esc(v)+'</strong>'+
        '</article>'

    ).join('');
  }

  async function load() {

    const serial=++fetchVersion;

    setMsg(
      'gxfMessage',
      'Consultando registro de facturas…'
    );

    let data,error;

    try {

      ({
        data,
        error
      }=await db.rpc(
        'gg_xml_list',
        {
          p_hidden:section==='hidden',

          p_search:
            $('gxfSearch').value.trim(),

          p_from:
            $('gxfFrom').value||null,

          p_to:
            $('gxfTo').value||null,

          p_page:page
        }
      ));

    } catch(e) {

      if(serial===fetchVersion) {
        setMsg('gxfMessage',e.message,true);
      }

      return;
    }

    if(serial!==fetchVersion) return;

    if(error) {

      setMsg('gxfMessage',error.message,true);

      return;
    }

    rows=data?.items||[];

    total=Number(data?.total)||0;

    stats(data||{});

    $('gxfRows').innerHTML=
      rows.length

      ? rows.map(r=>`

          <tr>

            <td>

              <strong>
                ${esc(
                  (r.serie||'')+'-'+(r.folio||'')
                )}
              </strong>

              <small>
                ${esc(r.fiscal_uuid)}
              </small>

            </td>

            <td>${esc(r.receiver_name)}</td>

            <td>${esc(r.receiver_rfc)}</td>

            <td>${esc(r.issued_at)}</td>

            <td>

              <strong>
                ${money(r.total)}
              </strong>

              <small>
                ${esc(r.currency)}
              </small>

            </td>

            <td>
              ${esc(fmt(r.created_at))}
            </td>

            <td>
              ${esc(r.created_email)}
            </td>

            <td>

              <div class="gxf-actions">

                <button
                  class="gxf-btn"
                  data-detail="${esc(r.id)}"
                  type="button">
                  Ver
                </button>

                ${
                  mayWrite

                    ? `
                      <button
                        class="gxf-btn"
                        data-hide="${esc(r.id)}"
                        type="button">

                        ${
                          r.hidden
                            ? 'Restaurar'
                            : 'Ocultar'
                        }

                      </button>
                    `

                    : ''
                }

              </div>

            </td>

          </tr>

        `).join('')

      : `
          <tr>
            <td colspan="8" class="gxf-empty">
              Todavía no hay facturas en esta sección
              con esos filtros.
            </td>
          </tr>
        `;

    $('gxfPageText').textContent=
      total

        ? `${
            page*25+1
          }–${
            Math.min((page+1)*25,total)
          } de ${total}`

        : '0 resultados';

    $('gxfPrev').disabled=page===0;

    $('gxfNext').disabled=(page+1)*25>=total;

    setMsg(
      'gxfMessage',
      'Haz clic en «Ver» para consultar conceptos y descargar el XML original. Filtro por fecha de carga.'
    );
  }

  // =================================================
  // PARTIDAS DEL REGISTRO
  // =================================================

  function itemList(record) {

    return (
      '<div class="gxf-items gxf-detail-items">' +
      '<table class="gxf-table">' +

      '<thead><tr>'+

      '<th># / Clave SAT</th>'+
      '<th>Descripción (interna)</th>'+
      '<th>Cantidad</th>'+
      '<th>Unidad</th>'+
      '<th>Precio</th>'+
      '<th>Importe</th>'+
      '<th>Impuestos originales</th>'+

      '</tr></thead>'+

      '<tbody>'+

      record.items.map(r=>{

        const s=r.original_data||{};

        const e=r.edited_data||{};

        return `

          <tr>

            <td>

              ${r.line_no}

              <small>
                ${esc(s.code)}
              </small>

            </td>

            <td class="gxf-description">

              ${esc(e.description??s.description)}

              ${
                e.description!==s.description

                  ? '<small>Original: '+
                    esc(s.description)+
                    '</small>'

                  : ''
              }

            </td>

            <td>
              ${esc(e.quantity??s.quantity)}
            </td>

            <td>
              ${esc(s.unit||s.unitCode)}
            </td>

            <td>
              ${money(e.unitPrice??s.unitPrice)}
            </td>

            <td>
              ${money(e.amount??s.amount)}
            </td>

            <td>
              ${itemTax(s.taxes||[])}
            </td>

          </tr>

        `;

      }).join('')+

      '</tbody></table></div>'
    );
  }

  // =================================================
  // POPUP DE FACTURA GUARDADA
  // =================================================

  async function showDetail(id) {

    setMsg(
      'gxfMessage',
      'Abriendo factura…'
    );

    const {data,error}=await db.rpc(
      'gg_xml_detail',
      {
        p_id:id
      }
    );

    if(error) {

      setMsg(
        'gxfMessage',
        error.message,
        true
      );

      return;
    }

    currentDetail=data;

    const a=data.invoice;

    const o=a.original_data||{};

    const d=a.display_data||{};

    $('gxfDetail').innerHTML=`

      <div class="gxf-preview-head">

        <h3 class="gxf-subtitle">
          ${esc(d.series??o.series)}-${esc(d.folio??o.folio)}
        </h3>

        <strong class="gxf-amount">
          ${money(a.total)}
        </strong>

      </div>

      <div class="gxf-grid">

        ${kv('UUID',a.fiscal_uuid)}
        ${kv('Fecha de emisión',o.issuedAt)}
        ${kv('Timbrado',o.stampedAt)}

        ${kv(
          'Emisor',
          d.issuerName??o.issuerName
        )}

        ${kv('RFC emisor',a.issuer_rfc)}

        ${kv(
          'Receptor',
          d.receiverName??o.receiverName
        )}

        ${kv('RFC receptor',a.receiver_rfc)}

        ${kv(
          'Subtotal fiscal',
          money(o.subtotal)
        )}

        ${kv(
          'IVA / otros traslados',
          money(o.taxTransferred)
        )}

        ${kv(
          'Retenciones',
          money(o.taxWithheld)
        )}

        ${kv(
          'Total fiscal',
          money(a.total)
        )}

        ${kv('Moneda',a.currency)}

        ${kv(
          'Método / Forma',
          o.paymentMethod+' / '+o.paymentForm
        )}

        ${kv('Uso CFDI',o.use)}
        ${kv('Fecha de carga',fmt(a.created_at))}
        ${kv('Cargada por',a.created_email)}
        ${kv('Referencia interna',d.reference||'—')}
        ${kv('Notas',d.notes||'—')}

      </div>

      <div class="gxf-tip">

        <strong>
          Documento original intacto.
        </strong>

        Los datos ajustados para uso interno
        se muestran como tales.

        Puedes descargar el XML original
        para revisar el documento fiscal.

      </div>

      <h3 class="gxf-subtitle">
        Partidas (${data.items.length})
      </h3>

      ${itemList(data)}

      <h3 class="gxf-subtitle">
        Impuestos y timbrado
      </h3>

      <div class="gxf-grid">

        ${kv(
          'Impuestos del CFDI',
          itemTax(o.taxes||[])
        )}

        ${kv(
          'Complementos',
          (o.complements||[]).join(', ')||'—'
        )}

        ${kv(
          'Certificado emisor',
          o.certNumber
        )}

        ${kv(
          'Certificado SAT',
          o.satCertNumber
        )}

        ${kv(
          'PAC',
          o.certifierRfc
        )}

      </div>
    `;

    $('gxfDetailDialog').showModal();
  }

  // =================================================
  // OCULTAR / RESTAURAR
  // =================================================

  async function toggleHide(id) {

    const hide=section==='active';

    if(
      !confirm(
        hide
          ? '¿Ocultar esta factura del registro activo?'
          : '¿Restaurar esta factura al registro activo?'
      )
    ) {
      return;
    }

    const {error}=await db.rpc(
      'gg_xml_set_hidden',
      {
        p_id:id,
        p_hidden:hide
      }
    );

    if(error) {

      setMsg(
        'gxfMessage',
        error.message,
        true
      );

      return;
    }

    await load();
  }

  // =================================================
  // DESCARGAR XML ORIGINAL
  // =================================================

  function downloadOriginal() {

    if(!currentDetail?.invoice?.original_xml) {
      return;
    }

    const a=currentDetail.invoice;

    const objectUrl=URL.createObjectURL(
      new Blob(
        [a.original_xml],
        {
          type:'application/xml;charset=utf-8'
        }
      )
    );

    const link=document.createElement('a');

    link.href=objectUrl;

    link.download=
      'CFDI_'+a.fiscal_uuid+'.xml';

    document.body.append(link);

    link.click();

    link.remove();

    setTimeout(
      ()=>URL.revokeObjectURL(objectUrl),
      1000
    );
  }

  // =================================================
  // INICIALIZAR
  // =================================================

  async function init() {

    if(!db) {

      setMsg(
        'gxfMessage',
        'Error: cliente Supabase no cargado.',
        true
      );

      return;
    }

    const {data,error}=await db.auth.getUser();

    if(error||!data?.user) {

      location.replace('index.html');

      return;
    }

    // Permisos de lectura y escritura.

    const [r,w]=await Promise.all([

      db.rpc(
        'gg_xml_allowed',
        {p_write:false}
      ),

      db.rpc(
        'gg_xml_allowed',
        {p_write:true}
      )

    ]);

    if(r.error||r.data!==true) {

      setMsg(
        'gxfMessage',
        'Tu cuenta no tiene permiso para consultar XML y Facturas. Solicita acceso a Finanzas.',
        true
      );

      $('gxfAdd').hidden=true;

      return;
    }

    mayWrite=!w.error&&w.data===true;

    $('gxfAdd').hidden=!mayWrite;

    // Tema.

    try {

      theme(
        localStorage.getItem('gg-xml-theme')||
        'dark'
      );

    } catch(_) {

      theme('dark');
    }

    $('gxfTheme').addEventListener(
      'click',
      ()=>theme(
        document.documentElement.dataset.gxfTheme==='dark'
          ? 'light'
          : 'dark'
      )
    );

    // Abrir importación.

    $('gxfAdd').addEventListener(
      'click',
      ()=>{

        $('gxfFile').value='';

        $('gxfPreview').hidden=true;

        $('gxfPreview').replaceChildren();

        $('gxfSave').disabled=true;

        draft=null;
        rawXml='';

        setMsg(
          'gxfImportMessage',
          'Selecciona un XML para empezar.'
        );

        $('gxfImportDialog').showModal();
      }
    );

    // Cerrar ventanas.

    document
      .querySelectorAll('[data-gxf-close]')
      .forEach(
        b=>b.addEventListener(
          'click',
          ()=>$(

            b.dataset.gxfClose==='import'
              ? 'gxfImportDialog'
              : 'gxfDetailDialog'

          ).close()
        )
      );

    // Zona de arrastre.

    $('gxfDrop').addEventListener(
      'click',
      ()=>$('gxfFile').click()
    );

    $('gxfDrop').addEventListener(
      'keydown',
      e=>{

        if(
          e.key==='Enter' ||
          e.key===' '
        ) {

          e.preventDefault();

          $('gxfFile').click();
        }
      }
    );

    $('gxfFile').addEventListener(
      'change',
      e=>onFile(e.target.files?.[0])
    );

    $('gxfDrop').addEventListener(
      'dragover',
      e=>{

        e.preventDefault();

        $('gxfDrop').classList.add('dragging');
      }
    );

    $('gxfDrop').addEventListener(
      'dragleave',
      ()=>$('gxfDrop').classList.remove('dragging')
    );

    $('gxfDrop').addEventListener(
      'drop',
      e=>{

        e.preventDefault();

        $('gxfDrop').classList.remove('dragging');

        onFile(e.dataTransfer.files?.[0]);
      }
    );

    // Guardar.

    $('gxfSave').addEventListener(
      'click',
      ()=>save().catch(
        e=>setMsg(
          'gxfImportMessage',
          e.message,
          true
        )
      )
    );

    $('gxfDownloadXml').addEventListener(
      'click',
      downloadOriginal
    );

    // Acciones del registro.

    $('gxfRows').addEventListener(
      'click',
      e=>{

        const view=e.target.closest(
          '[data-detail]'
        );

        const hide=e.target.closest(
          '[data-hide]'
        );

        if(view) {
          showDetail(view.dataset.detail);
        }

        if(hide) {
          toggleHide(hide.dataset.hide);
        }
      }
    );

    // Activas / Ocultas.

    document
      .querySelectorAll('[data-gxf-section]')
      .forEach(
        b=>b.addEventListener(
          'click',
          ()=>{

            section=b.dataset.gxfSection;

            page=0;

            setActiveTab();

            load();
          }
        )
      );

    // Filtros.

    $('gxfRefresh').addEventListener(
      'click',
      load
    );

    $('gxfClear').addEventListener(
      'click',
      ()=>{

        $('gxfSearch').value='';
        $('gxfFrom').value='';
        $('gxfTo').value='';

        page=0;

        load();
      }
    );

    $('gxfSearch').addEventListener(
      'input',
      ()=>{

        clearTimeout(searchTimer);

        searchTimer=setTimeout(
          ()=>{

            page=0;

            load();
          },
          300
        );
      }
    );

    ['gxfFrom','gxfTo'].forEach(
      id=>$(id).addEventListener(
        'change',
        ()=>{

          page=0;

          load();
        }
      )
    );

    // Paginación.

    $('gxfPrev').addEventListener(
      'click',
      ()=>{

        page=Math.max(0,page-1);

        load();
      }
    );

    $('gxfNext').addEventListener(
      'click',
      ()=>{

        page++;

        load();
      }
    );

    // Sesión.

    db.auth.onAuthStateChange(
      ev=>{

        if(ev==='SIGNED_OUT') {
          location.replace('index.html');
        }
      }
    );

    await load();
  }

  if(document.readyState==='loading') {

    document.addEventListener(
      'DOMContentLoaded',
      ()=>init().catch(
        e=>setMsg(
          'gxfMessage',
          e.message,
          true
        )
      ),
      {once:true}
    );

  } else {

    init().catch(
      e=>setMsg(
        'gxfMessage',
        e.message,
        true
      )
    );
  }
})();
