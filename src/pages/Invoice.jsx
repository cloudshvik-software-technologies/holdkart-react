import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—';

const n2  = (v) => Number(v || 0).toFixed(2);
const rupee = (v) => `\u20B9${n2(v)}`;
const fmt   = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Invoice() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    orderService.getOrder(id).then(setOrder).catch(() => navigate('/orders')).finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Load html2canvas
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      // Load jsPDF
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const el = invoiceRef.current;

      // Temporarily reset CSS zoom so PDF is always full-size regardless of screen size
      const prevZoom = el.style.zoom;
      el.style.zoom = '1';

      // Capture the element as-is at 2× scale for sharp text
      const canvas = await window.html2canvas(el, {
        scale:       2,
        useCORS:     true,
        scrollX:     0,
        scrollY:     -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        logging:     false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // A4 dimensions in mm
      const A4_W = 210;
      const A4_H = 297;
      const MARGIN = 8; // mm on each side

      const usableW = A4_W - MARGIN * 2;
      const usableH = A4_H - MARGIN * 2;

      // Scale image to fit usable width; if too tall, scale to fit height instead
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = imgW / imgH;

      let pdfW = usableW;
      let pdfH = usableW / ratio;
      if (pdfH > usableH) {
        pdfH = usableH;
        pdfW = usableH * ratio;
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      pdf.addImage(imgData, 'JPEG', MARGIN, MARGIN, pdfW, pdfH);
      pdf.save(`HoldKart-Invoice-${order.order_number}.pdf`);

      // Restore zoom
      el.style.zoom = prevZoom;

    } catch (e) {
      console.error('PDF generation failed:', e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fa' }}>
      <p style={{ color: '#6b7280' }}>Loading invoice…</p>
    </div>
  );
  if (!order) return null;

  /* ── Amount values — exactly mirrors OrderDetail calculation ── */
  const qty      = order.quantity || 1;
  const prodAmt  = Number(order.order_amount)          || 0;   // item subtotal
  const shipFee  = Number(order.delivery_charge)       || 0;   // shipping
  const phFee    = Number(order.payment_handling_fee)  || 0;   // payment handling fee (0 if not charged)
  const ppFee    = Number(order.protect_promise_fee)   || 0;   // protect promise fee (0 if not charged)
  const grandTotal = prodAmt + shipFee + phFee + ppFee;        // EXACT same as OrderDetail

  /* ── GST breakdown (18% inclusive = 9% SGST + 9% CGST) ── */
  const gstExclusive = (amt) => +(amt / 1.18).toFixed(2);
  const gstAmt       = (amt) => +(amt - gstExclusive(amt)).toFixed(2);
  const halfTax      = (amt) => +(gstAmt(amt) / 2).toFixed(2);

  const prodBase = gstExclusive(prodAmt);
  const prodSgst = halfTax(prodAmt);
  const prodCgst = +(gstAmt(prodAmt) - prodSgst).toFixed(2);

  const shipBase = gstExclusive(shipFee);
  const shipSgst = halfTax(shipFee);
  const shipCgst = +(gstAmt(shipFee) - shipSgst).toFixed(2);

  const phBase   = gstExclusive(phFee);
  const phSgst   = halfTax(phFee);
  const phCgst   = +(gstAmt(phFee) - phSgst).toFixed(2);

  const ppBase   = gstExclusive(ppFee);
  const ppSgst   = halfTax(ppFee);
  const ppCgst   = +(gstAmt(ppFee) - ppSgst).toFixed(2);

  const totGross   = grandTotal;
  const totBase    = prodBase + shipBase + phBase + ppBase;
  const totSgst    = prodSgst + shipSgst + phSgst + ppSgst;
  const totCgst    = prodCgst + shipCgst + phCgst + ppCgst;

  const orderDate  = fmtDate(order.created_date || order.created_at);
  const invoiceNum = `INV-${order.order_number}`;

  /* ── Shared cell styles ── */
  const TH = {
    border: '1px solid #9ca3af', padding: '5px 6px', fontSize: '0.68rem',
    fontWeight: 700, background: '#f3f4f6', verticalAlign: 'middle',
    lineHeight: 1.3, whiteSpace: 'nowrap',
  };
  const TD = {
    border: '1px solid #d1d5db', padding: '5px 6px',
    fontSize: '0.68rem', verticalAlign: 'top', lineHeight: 1.4,
  };
  const thL = (w) => ({ ...TH, textAlign: 'left',   width: w });
  const thR = (w) => ({ ...TH, textAlign: 'right',  width: w });
  const tdL = (x = {}) => ({ ...TD, textAlign: 'left',   ...x });
  const tdR = (x = {}) => ({ ...TD, textAlign: 'right',  ...x });
  const tdC = (x = {}) => ({ ...TD, textAlign: 'center', ...x });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .inv-page { background:#f4f6fa; min-height:100vh; font-family:'Inter','Segoe UI',Arial,sans-serif; padding-top:100px; padding-bottom:60px; }
        .inv-toolbar { max-width:870px; margin:0 auto 14px; padding:0 16px; display:flex; align-items:center; gap:10px; }
        .inv-btn-back { display:inline-flex; align-items:center; gap:6px; background:#fff; border:1.5px solid #e5e7eb; border-radius:8px; padding:9px 18px; font-size:0.87rem; font-weight:600; color:#1f2937; cursor:pointer; font-family:inherit; }
        .inv-btn-back:hover { background:#f4f6fa; }
        .inv-btn-dl { display:inline-flex; align-items:center; gap:8px; background:rgb(240 127 34); border:1px solid #994917; border-radius:8px; padding:9px 22px; font-size:0.87rem; font-weight:700; color:#fff; cursor:pointer; font-family:inherit; box-shadow:0 3px 10px rgba(255,107,0,.35); }
        .inv-btn-dl:disabled { opacity:.65; cursor:not-allowed; }
        .inv-card { max-width:870px; margin:0 auto; padding:0 16px; }
        @media print { .inv-toolbar{display:none} .inv-page{padding-top:0;background:#fff} .inv-doc{box-shadow:none!important} }

        /* Mobile scaling — keeps invoice identical but smaller */
        @media (max-width: 768px) {
          .inv-card { padding: 0 8px; }
          .inv-doc  { zoom: 0.87; }
        }
        @media (max-width: 600px) {
          .inv-doc { zoom: 0.68; }
        }
        @media (max-width: 480px) {
          .inv-doc { zoom: 0.53; }
        }
        @media (max-width: 390px) {
          .inv-doc { zoom: 0.43; }
        }
      `}</style>

      <div className="inv-page">
        <div className="inv-toolbar">
          <button className="inv-btn-back" onClick={() => navigate(`/order/${id}`)}>← Back to Order</button>
          <button className="inv-btn-dl" onClick={handleDownload} disabled={downloading}>
            {downloading ? '⏳ Generating…' : '⬇ Download Invoice'}
          </button>
        </div>

        <div className="inv-card">
          <div ref={invoiceRef} className="inv-doc" style={{
            background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,.08)',
            padding: '24px 28px', fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
            color: '#111', fontSize: '0.78rem', lineHeight: 1.5,
            width: '100%', maxWidth: 810, margin: '0 auto', boxSizing: 'border-box',
          }}>

            {/* ── HEADER ── */}
            <div style={{ textAlign: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '2.5px solid #1e3c72' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 1 }}>
                <span style={{ color: '#1e3c72' }}>Hold</span><span style={{ color: '#FF6B00' }}>Kart</span>
              </div>
              <div style={{ fontSize: '0.6rem', color: '#6b7280', letterSpacing: 1.4, textTransform: 'uppercase' }}>India's Smart Shop</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 6, letterSpacing: 1 }}>Tax Invoice</div>
            </div>

            {/* ── SELLER + ORDER META ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', paddingRight: 16, width: '55%' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 2 }}>
                      Sold By: {order.sellerName || 'HoldKart Seller'}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.7rem' }}>
                      {order.sellerEmail || 'support@holdkart.in'}<br />
                      India &nbsp;|&nbsp; GSTIN: 33AAAAA0000A1Z5
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    {[
                      ['Order #:',       order.order_number],
                      ['Order Date:',    orderDate],
                      ['Invoice Date:',  orderDate],
                      ['Invoice #:',     invoiceNum],
                      ['Payment:',       (order.payment_method || '').toUpperCase().includes('COD') ? 'Cash on Delivery' : (order.payment_method || 'Online')],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', fontSize: '0.7rem', marginBottom: 1 }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── BILLING / SHIPPING ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 10 }}>
              <thead>
                <tr>
                  <th style={{ ...thL('50%'), borderRight: '1px solid #d1d5db' }}>Billing Address</th>
                  <th style={thL('50%')}>Shipping Address</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[0, 1].map((i) => (
                    <td key={i} style={{ ...tdL(), ...(i === 0 ? { borderRight: '1px solid #d1d5db' } : {}) }}>
                      <strong style={{ fontSize: '0.72rem' }}>{order.customer_name || 'Customer'}</strong><br />
                      {order.address}<br />
                      {[order.city, order.state].filter(Boolean).join(', ')}{order.pincode ? ` – ${order.pincode}` : ''}<br />
                      {order.customer_phone ? `Ph: ${order.customer_phone}` : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* ── LINE ITEMS TABLE ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 10, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '26%' }} />
                <col style={{ width: '8%'  }} />
                <col style={{ width: '5%'  }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '7%'  }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign: 'left'  }}>Description</th>
                  <th style={{ ...TH, textAlign: 'right' }}>HSN/SAC</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Qty</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Gross ₹</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Disc ₹</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Taxable ₹</th>
                  <th style={{ ...TH, textAlign: 'right' }}>SGST 9%</th>
                  <th style={{ ...TH, textAlign: 'right' }}>CGST 9%</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Total ₹</th>
                </tr>
              </thead>
              <tbody>

                {/* Product */}
                <tr>
                  <td style={tdL()}>
                    <div style={{ fontWeight: 600 }}>{order.product_name}</div>
                    {(order.variant_color || order.variant_size) && (
                      <div style={{ color: '#374151', fontSize: '0.62rem', fontWeight: 600 }}>
                        {[order.variant_color, order.variant_size].filter(Boolean).join(' / ')}
                      </div>
                    )}
                    {order.category && <div style={{ color: '#6b7280', fontSize: '0.62rem' }}>{order.category}</div>}
                    <div style={{ color: '#555', fontSize: '0.6rem' }}>SGST/UTGST: 9% | CGST: 9%</div>
                  </td>
                  <td style={tdC()}>85183019</td>
                  <td style={tdR()}>{qty}</td>
                  <td style={tdR()}>{fmt(prodAmt)}</td>
                  <td style={tdR()}>0.00</td>
                  <td style={tdR()}>{fmt(prodBase)}</td>
                  <td style={tdR()}>{fmt(prodSgst)}</td>
                  <td style={tdR()}>{fmt(prodCgst)}</td>
                  <td style={tdR({ fontWeight: 600 })}>{fmt(prodAmt)}</td>
                </tr>

                {/* Shipping */}
                {shipFee > 0 && (
                  <tr style={{ background: '#fafafa' }}>
                    <td style={tdL()}>
                      <div style={{ fontWeight: 600 }}>Shipping Charges</div>
                      <div style={{ color: '#555', fontSize: '0.6rem' }}>SAC: 996812 | SGST: 9% | CGST: 9%</div>
                    </td>
                    <td style={tdC()}>996812</td>
                    <td style={tdR()}>1</td>
                    <td style={tdR()}>{fmt(shipFee)}</td>
                    <td style={tdR()}>0.00</td>
                    <td style={tdR()}>{fmt(shipBase)}</td>
                    <td style={tdR()}>{fmt(shipSgst)}</td>
                    <td style={tdR()}>{fmt(shipCgst)}</td>
                    <td style={tdR({ fontWeight: 600 })}>{fmt(shipFee)}</td>
                  </tr>
                )}

                {/* Payment Handling Fee */}
                {phFee > 0 && (
                  <tr style={{ background: '#fafafa' }}>
                    <td style={tdL()}>
                      <div style={{ fontWeight: 600 }}>Payment Handling Charges</div>
                      <div style={{ color: '#555', fontSize: '0.6rem' }}>SAC: 998599 | IGST: 18%</div>
                    </td>
                    <td style={tdC()}>998599</td>
                    <td style={tdR()}>1</td>
                    <td style={tdR()}>{fmt(phFee)}</td>
                    <td style={tdR()}>0.00</td>
                    <td style={tdR()}>{fmt(phBase)}</td>
                    <td style={tdR()}>{fmt(phSgst)}</td>
                    <td style={tdR()}>{fmt(phCgst)}</td>
                    <td style={tdR({ fontWeight: 600 })}>{fmt(phFee)}</td>
                  </tr>
                )}

                {/* Protect Promise Fee */}
                {ppFee > 0 && (
                  <tr style={{ background: '#fafafa' }}>
                    <td style={tdL()}>
                      <div style={{ fontWeight: 600 }}>Protect Promise Fee</div>
                      <div style={{ color: '#555', fontSize: '0.6rem' }}>SAC: 998599 | SGST: 9% | CGST: 9%</div>
                    </td>
                    <td style={tdC()}>998599</td>
                    <td style={tdR()}>1</td>
                    <td style={tdR()}>{fmt(ppFee)}</td>
                    <td style={tdR()}>0.00</td>
                    <td style={tdR()}>{fmt(ppBase)}</td>
                    <td style={tdR()}>{fmt(ppSgst)}</td>
                    <td style={tdR()}>{fmt(ppCgst)}</td>
                    <td style={tdR({ fontWeight: 600 })}>{fmt(ppFee)}</td>
                  </tr>
                )}

                {/* Totals row */}
                <tr style={{ background: '#eef2ff' }}>
                  <td style={{ ...tdL(), fontWeight: 700 }}>Total</td>
                  <td style={{ ...tdC(), fontWeight: 700 }}>—</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{qty}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{fmt(totGross)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>0.00</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{fmt(totBase)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{fmt(totSgst)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{fmt(totCgst)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{fmt(grandTotal)}</td>
                </tr>

              </tbody>
            </table>

            {/* ── GRAND TOTAL + PAYMENT + RETURNS ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 }}>
              <div style={{ flex: 1, fontSize: '0.7rem', color: '#555' }}>
                <strong style={{ color: '#111' }}>Returns Policy:</strong> Please return item with the original brand box/price tag,
                original packing and invoice.<br />
                <em style={{ fontSize: '0.65rem' }}>Goods sold are intended for end user consumption and not for re-sale.</em>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 200 }}>
                {/* Fee breakdown summary */}
                {[
                  ['Item Subtotal:', prodAmt],
                  ...(shipFee > 0 ? [['Shipping:', shipFee]] : []),
                  ...(phFee  > 0 ? [['Payment Handling:', phFee]]  : []),
                  ...(ppFee  > 0 ? [['Protect Promise:', ppFee]]   : []),
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: '0.7rem', color: '#555', marginBottom: 2 }}>
                    <span>{label}</span><span>₹{fmt(val)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1.5px solid #1e3c72', marginTop: 5, paddingTop: 5 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                    <span>Grand Total</span><span>₹{fmt(grandTotal)}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 4 }}>
                  Payment: <strong style={{ color: '#111' }}>
                    {(order.payment_method || '').toUpperCase().includes('COD') ? 'Cash On Delivery' : (order.payment_method || 'Online')}
                  </strong>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#555' }}>
                  Status: <strong style={{ color: order.payment_status === 'Paid' ? '#16a34a' : '#ca8a04' }}>
                    {order.payment_status || 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            {/* ── SIGNATURE ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
              <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                System-generated invoice. Contact: support@holdkart.in
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 22 }}>
                  <span style={{ color: '#1e3c72' }}>Hold</span><span style={{ color: '#FF6B00' }}>Kart</span>
                </div>
                <div style={{ borderTop: '1px solid #555', paddingTop: 3, fontSize: '0.65rem', color: '#555', minWidth: 110 }}>
                  Authorised Signatory
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#9ca3af', marginTop: 6 }}>
              E. &amp; O.E. &nbsp; page 1 of 1
            </div>

          </div>
        </div>
      </div>
    </>
  );
}