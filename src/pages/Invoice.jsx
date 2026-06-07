import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—';

const n2 = (v) => Number(v || 0).toFixed(2);
const rupee = (v) => `\u20B9${n2(v)}`;

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
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      await window.html2pdf().set({
        margin: [6, 6, 6, 6],
        filename: `HoldKart-Invoice-${order.order_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' },
      }).from(invoiceRef.current).save();
    } catch { window.print(); }
    finally { setDownloading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fa' }}>
      <p style={{ color: '#6b7280' }}>Loading invoice…</p>
    </div>
  );
  if (!order) return null;

  /* ── Fee values — use stored value if > 0, else standard defaults ── */
  const qty     = order.quantity || 1;
  const prodAmt = Number(order.order_amount) || 0;
  const phFeeRaw = Number(order.payment_handling_fee);
  const ppFeeRaw = Number(order.protect_promise_fee);
  const phFee   = (!isNaN(phFeeRaw) && phFeeRaw > 0) ? phFeeRaw : 10;
  const ppFee   = (!isNaN(ppFeeRaw) && ppFeeRaw > 0) ? ppFeeRaw : 9;
  const grandTotal = prodAmt + phFee + ppFee;

  /* ── Product GST: 18% inclusive → 9% SGST + 9% CGST ── */
  const prodBase = +( prodAmt / 1.18 ).toFixed(2);
  const prodTax  = +( prodAmt - prodBase ).toFixed(2);
  const prodSgst = +( prodTax / 2 ).toFixed(2);
  const prodCgst = +( prodTax - prodSgst ).toFixed(2);   // handles rounding

  /* ── Payment Handling Fee: IGST 18% (shown split as SGST+CGST for uniformity) ── */
  const phBase  = +( phFee / 1.18 ).toFixed(2);
  const phTax   = +( phFee - phBase ).toFixed(2);
  const phSgst  = +( phTax / 2 ).toFixed(2);
  const phCgst  = +( phTax - phSgst ).toFixed(2);

  /* ── Protect Promise Fee: 18% inclusive → 9% SGST + 9% CGST ── */
  const ppBase  = +( ppFee / 1.18 ).toFixed(2);
  const ppTax   = +( ppFee - ppBase ).toFixed(2);
  const ppSgst  = +( ppTax / 2 ).toFixed(2);
  const ppCgst  = +( ppTax - ppSgst ).toFixed(2);

  /* ── Totals row ── */
  const totGross    = prodAmt + phFee + ppFee;
  const totTaxable  = prodBase + phBase + ppBase;
  const totSgst     = prodSgst + phSgst + ppSgst;
  const totCgst     = prodCgst + phCgst + ppCgst;

  const orderDate  = fmtDate(order.created_date || order.created_at);
  const invoiceNum = `INV-${order.order_number}`;

  /* ── cell style helpers ── */
  const TH_BASE = {
    border: '1px solid #d1d5db',
    padding: '6px 7px',
    fontSize: '0.7rem',
    fontWeight: 700,
    background: '#f3f4f6',
    verticalAlign: 'middle',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
  };
  const TD_BASE = {
    border: '1px solid #d1d5db',
    padding: '6px 7px',
    fontSize: '0.7rem',
    verticalAlign: 'top',
    lineHeight: 1.4,
  };

  const thL  = (w) => ({ ...TH_BASE, textAlign: 'left',  width: w });
  const thR  = (w) => ({ ...TH_BASE, textAlign: 'right', width: w });
  const tdL  = (extra = {}) => ({ ...TD_BASE, textAlign: 'left',  ...extra });
  const tdR  = (extra = {}) => ({ ...TD_BASE, textAlign: 'right', ...extra });
  const tdC  = (extra = {}) => ({ ...TD_BASE, textAlign: 'center', ...extra });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .inv-page { background:#f4f6fa; min-height:100vh; font-family:'Inter','Segoe UI',Arial,sans-serif; padding-top:100px; padding-bottom:60px; }
        .inv-toolbar { max-width:860px; margin:0 auto 14px; padding:0 16px; display:flex; align-items:center; gap:10px; }
        .inv-btn-back { display:inline-flex; align-items:center; gap:6px; background:#fff; border:1.5px solid #e5e7eb; border-radius:8px; padding:9px 18px; font-size:0.87rem; font-weight:600; color:#1f2937; cursor:pointer; font-family:inherit; }
        .inv-btn-back:hover { background:#f4f6fa; }
        .inv-btn-dl { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#FF6B00,#E85D04); border:none; border-radius:8px; padding:9px 22px; font-size:0.87rem; font-weight:700; color:#fff; cursor:pointer; font-family:inherit; box-shadow:0 3px 10px rgba(255,107,0,.35); }
        .inv-btn-dl:disabled { opacity:.65; cursor:not-allowed; }
        .inv-card { max-width:860px; margin:0 auto; padding:0 16px; }
        @media print { .inv-toolbar{display:none} .inv-page{padding-top:0;background:#fff} .inv-doc{box-shadow:none!important} }
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
            color: '#111', fontSize: '0.8rem', lineHeight: 1.5,
            width: '100%', maxWidth: 800, margin: '0 auto', boxSizing: 'border-box',
          }}>

            {/* ── TITLE BAR ── */}
            <div style={{ textAlign: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '2px solid #1e3c72' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 1 }}>
                <span style={{ color: '#1e3c72' }}>Hold</span><span style={{ color: '#FF6B00' }}>Kart</span>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', letterSpacing: 1.4, textTransform: 'uppercase' }}>India's Smart Shop</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: 6, letterSpacing: 1 }}>Tax Invoice</div>
            </div>

            {/* ── SELLER + ORDER META ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'top', paddingRight: 16, width: '55%' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: 2 }}>
                      Sold By: {order.sellerName || 'HoldKart Seller'}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.72rem' }}>
                      {order.sellerEmail || 'support@holdkart.in'}<br />
                      India &nbsp;|&nbsp; GSTIN: 33AAAAA0000A1Z5
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                    {[
                      ['Order ID:', order.order_number],
                      ['Order Date:', orderDate],
                      ['Invoice Date:', orderDate],
                      ['Invoice #:', invoiceNum],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', fontSize: '0.72rem', marginBottom: 1 }}>
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
                      <strong style={{ fontSize: '0.75rem' }}>{order.customer_name || 'Customer'}</strong><br />
                      {order.address}<br />
                      {[order.city, order.state].filter(Boolean).join(', ')}{order.pincode ? ` ${order.pincode}` : ''}<br />
                      {order.customer_phone ? `Phone: ${order.customer_phone}` : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* ── PRODUCT TABLE ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: 10, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '25%' }} />{/* Product */}
                <col style={{ width: '9%'  }} />{/* HSN/SAC */}
                <col style={{ width: '5%'  }} />{/* Qty */}
                <col style={{ width: '11%' }} />{/* Gross Amt */}
                <col style={{ width: '9%'  }} />{/* Disc/Coup */}
                <col style={{ width: '12%' }} />{/* Taxable Val */}
                <col style={{ width: '11%' }} />{/* SGST */}
                <col style={{ width: '9%'  }} />{/* CGST */}
                <col style={{ width: '9%'  }} />{/* Total */}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...TH_BASE, textAlign: 'left' }}>Product</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>HSN/SAC</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>Qty</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>Gross Amt ₹</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>Disc ₹</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>Taxable ₹</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>SGST ₹</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>CGST ₹</th>
                  <th style={{ ...TH_BASE, textAlign: 'right' }}>Total ₹</th>
                </tr>
              </thead>
              <tbody>

                {/* ── Product row ── */}
                <tr>
                  <td style={tdL()}>
                    <div style={{ fontWeight: 600 }}>{order.product_name}</div>
                    {order.category && <div style={{ color: '#6b7280', fontSize: '0.65rem' }}>{order.category}</div>}
                    <div style={{ color: '#6b7280', fontSize: '0.65rem' }}>Warranty: 1 Year</div>
                    <div style={{ color: '#555', fontSize: '0.63rem', marginTop: 1 }}>SGST/UTGST: 9.0%&nbsp;&nbsp;CGST: 9.0%</div>
                  </td>
                  <td style={tdC()}>85183019</td>
                  <td style={tdR()}>{qty}</td>
                  <td style={tdR()}>{rupee(prodAmt)}</td>
                  <td style={tdR()}>0.00</td>
                  <td style={tdR()}>{rupee(prodBase)}</td>
                  <td style={tdR()}>{rupee(prodSgst)}</td>
                  <td style={tdR()}>{rupee(prodCgst)}</td>
                  <td style={tdR()}>{rupee(prodAmt)}</td>
                </tr>

                {/* ── Payment Handling Fee ── */}
                {phFee > 0 && (
                  <tr style={{ background: '#fafafa' }}>
                    <td style={tdL()}>
                      <div style={{ fontWeight: 600 }}>Payment Handling Charges</div>
                      <div style={{ color: '#555', fontSize: '0.63rem' }}>SAC: 998599 | IGST: 18.0%</div>
                    </td>
                    <td style={tdC()}>—</td>
                    <td style={tdR()}>1</td>
                    <td style={tdR()}>{rupee(phFee)}</td>
                    <td style={tdR()}>0.00</td>
                    <td style={tdR()}>{rupee(phBase)}</td>
                    <td style={tdR()}>{rupee(phSgst)}</td>
                    <td style={tdR()}>{rupee(phCgst)}</td>
                    <td style={tdR()}>{rupee(phFee)}</td>
                  </tr>
                )}

                {/* ── Protect Promise Fee ── */}
                {ppFee > 0 && (
                  <tr style={{ background: '#fafafa' }}>
                    <td style={tdL()}>
                      <div style={{ fontWeight: 600 }}>Protect Promise Fee</div>
                      <div style={{ color: '#555', fontSize: '0.63rem' }}>SAC: 998599 | SGST: 9.0% | CGST: 9.0%</div>
                    </td>
                    <td style={tdC()}>—</td>
                    <td style={tdR()}>1</td>
                    <td style={tdR()}>{rupee(ppFee)}</td>
                    <td style={tdR()}>0.00</td>
                    <td style={tdR()}>{rupee(ppBase)}</td>
                    <td style={tdR()}>{rupee(ppSgst)}</td>
                    <td style={tdR()}>{rupee(ppCgst)}</td>
                    <td style={tdR()}>{rupee(ppFee)}</td>
                  </tr>
                )}

                {/* ── Total row ── */}
                <tr style={{ background: '#eef2ff' }}>
                  <td style={{ ...tdL(), fontWeight: 700 }}>Total</td>
                  <td style={{ ...tdC(), fontWeight: 700 }}>—</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{qty}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{rupee(totGross)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>0.00</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{rupee(totTaxable)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{rupee(totSgst)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{rupee(totCgst)}</td>
                  <td style={{ ...tdR(), fontWeight: 700 }}>{rupee(grandTotal)}</td>
                </tr>

              </tbody>
            </table>

            {/* ── GRAND TOTAL + PAYMENT + RETURNS ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 16 }}>
              <div style={{ flex: 1, fontSize: '0.72rem', color: '#555' }}>
                <strong style={{ color: '#111' }}>Returns Policy:</strong> Please return item with the original brand box/price tag, original packing and invoice.<br />
                <em style={{ fontSize: '0.68rem' }}>Goods sold are intended for end user consumption and not for re-sale.</em>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                  Grand Total &nbsp; {rupee(grandTotal)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: 2 }}>
                  Payment: <strong style={{ color: '#111' }}>
                    {(order.payment_method || '').toUpperCase().includes('COD') ? 'Cash On Delivery' : (order.payment_method || 'Online')}
                  </strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#555' }}>
                  Status: <strong style={{ color: order.payment_status === 'Paid' ? '#16a34a' : '#ca8a04' }}>
                    {order.payment_status || 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            {/* ── SIGNATURE ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
              <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                System-generated invoice. Contact: support@holdkart.in
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 20 }}>
                  <span style={{ color: '#1e3c72' }}>Hold</span><span style={{ color: '#FF6B00' }}>Kart</span>
                </div>
                <div style={{ borderTop: '1px solid #555', paddingTop: 3, fontSize: '0.68rem', color: '#555', minWidth: 110 }}>
                  Authorised Signatory
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.65rem', color: '#9ca3af', marginTop: 8 }}>
              E. &amp; O.E. &nbsp; page 1 of 1
            </div>

          </div>
        </div>
      </div>
    </>
  );
}