const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Lucra logo baked in as base64 — no upload needed for Lucra branding
const LUCRA_LOGO_PATH = path.join(__dirname, '../public/lucra-logo.jpg');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    company = 'Your Venue',
    lift = 0.15,
    monthly_roi = 50000,
    annual_roi = 500000,
    three_year_value = 1500000,
    payback_days = 30,
    roi_x = '5.0',
    arpu = 40,
    opt_rate = 10,
    daily_users = 1000,
    brand_color = '#10B981',
    logo_data_url = null
  } = req.body;

  function hexToRgb(hex) {
    const h = (hex || '#10B981').replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  const BRAND = (brand_color && /^#[0-9a-fA-F]{6}$/.test(brand_color)) ? brand_color : '#10B981';
  const LUCRA_GREEN = '#10B981';
  const DARK = '#111111';
  const MID = '#555555';
  const LIGHT = '#f5f5f5';
  const WHITE = '#ffffff';
  const PAGE_W = 612, PAGE_H = 792, MARGIN = 44, CONTENT_W = 524;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="lucra-roi-${company.toLowerCase().replace(/[^a-z0-9]/g,'-')}.pdf"`);
  res.setHeader('Cache-Control', 'no-cache');

  const doc = new PDFDocument({ size: 'LETTER', margin: 0, compress: true });
  doc.pipe(res);

  // ── HEADER ──────────────────────────────────────────────────
  doc.rect(0, 0, PAGE_W, 76).fill('#0d0d0d');

  // Lucra logo (right side) — baked in
  try {
    if (fs.existsSync(LUCRA_LOGO_PATH)) {
      doc.image(LUCRA_LOGO_PATH, PAGE_W - MARGIN - 90, 14, { height: 48, fit: [90, 48] });
    } else {
      // Fallback: text wordmark
      doc.fontSize(22).font('Helvetica-Bold').fillColor(LUCRA_GREEN).text('LUCRA', PAGE_W - MARGIN - 72, 26, { width: 72, align: 'right' });
      doc.fontSize(8).font('Helvetica').fillColor('#666666').text('lucrasports.com', PAGE_W - MARGIN - 90, 52, { width: 90, align: 'right' });
    }
  } catch(e) {
    doc.fontSize(22).font('Helvetica-Bold').fillColor(LUCRA_GREEN).text('LUCRA', PAGE_W - MARGIN - 72, 26, { width: 72, align: 'right' });
  }

  // Customer logo or name (left side)
  let customerLogoDrawn = false;
  if (logo_data_url && logo_data_url.startsWith('data:image/')) {
    try {
      const imgBuffer = Buffer.from(logo_data_url.split(',')[1], 'base64');
      doc.image(imgBuffer, MARGIN, 14, { height: 48, fit: [170, 48] });
      customerLogoDrawn = true;
    } catch(e) {}
  }
  if (!customerLogoDrawn) {
    doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE).text(company, MARGIN, 28, { width: 280 });
  }

  // Brand color accent stripe
  doc.rect(0, 76, PAGE_W, 4).fill(BRAND);

  // ── HERO ────────────────────────────────────────────────────
  const heroY = 98;
  doc.rect(MARGIN, heroY, CONTENT_W, 84).fill(LIGHT);

  // Big ROI number
  doc.fontSize(52).font('Helvetica-Bold').fillColor(BRAND).text(`${roi_x}x`, MARGIN + 4, heroY + 8, { width: 150, align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor(MID).text('projected ROI', MARGIN + 4, heroY + 64, { width: 150, align: 'center' });

  // Separator
  doc.moveTo(MARGIN + 162, heroY + 14).lineTo(MARGIN + 162, heroY + 70).strokeColor('#d0d0d0').lineWidth(1).stroke();

  // Headline
  const hX = MARGIN + 174, hW = CONTENT_W - 174;
  doc.fontSize(15).font('Helvetica-Bold').fillColor(DARK).text(`Built for ${company}.`, hX, heroY + 10, { width: hW });
  doc.fontSize(10).font('Helvetica').fillColor(MID).text(
    `Based on your ${Number(daily_users).toLocaleString()} daily visitors — here's what Lucra delivers in year one.`,
    hX, heroY + 34, { width: hW, lineGap: 2 }
  );

  // ── 4 STAT BOXES ────────────────────────────────────────────
  const statsY = heroY + 96;
  const statW = (CONTENT_W - 12) / 4;
  const stats = [
    { label: 'Monthly Lift',   value: '$' + Number(monthly_roi).toLocaleString(),     sub: 'additional revenue' },
    { label: 'Annual Impact',  value: '$' + Number(annual_roi).toLocaleString(),      sub: 'net of Lucra fee'   },
    { label: '3-Year Value',   value: '$' + Number(three_year_value).toLocaleString(), sub: 'cumulative ROI'    },
    { label: 'Payback Period', value: payback_days + ' days',                          sub: 'to breakeven'      },
  ];
  stats.forEach((s, i) => {
    const x = MARGIN + i * (statW + 4);
    doc.rect(x, statsY, statW, 72).fill(WHITE).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    doc.rect(x, statsY, statW, 3).fill(BRAND);
    doc.fontSize(7.5).font('Helvetica').fillColor(MID).text(s.label.toUpperCase(), x, statsY + 12, { width: statW, align: 'center', characterSpacing: 0.6 });
    doc.fontSize(16).font('Helvetica-Bold').fillColor(BRAND).text(s.value, x, statsY + 28, { width: statW, align: 'center' });
    doc.fontSize(7.5).font('Helvetica').fillColor('#999999').text(s.sub, x, statsY + 52, { width: statW, align: 'center' });
  });

  // ── THE MATH ────────────────────────────────────────────────
  const mathY = statsY + 86;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text('The Math', MARGIN, mathY);
  doc.moveTo(MARGIN, mathY + 17).lineTo(PAGE_W - MARGIN, mathY + 17).strokeColor('#e0e0e0').lineWidth(0.75).stroke();

  const mathRows = [
    ['Daily visitors',                      Number(daily_users).toLocaleString()],
    ['Lucra opt-in rate',                   opt_rate + '%'],
    ['Monthly active competitors',          Math.round(daily_users * opt_rate / 100 * 30).toLocaleString()],
    ['Current avg revenue/user (ARPU)',     '$' + Number(arpu).toLocaleString()],
    ['ARPU lift with Lucra',                '+' + Math.round(lift * 100) + '%  (+$' + (arpu * lift).toFixed(2) + '/user)'],
    ['Monthly incremental revenue',         '$' + Number(monthly_roi).toLocaleString()],
    ['Annual net ROI (after Lucra fee)',    '$' + Number(annual_roi).toLocaleString()],
  ];
  mathRows.forEach((row, i) => {
    const y = mathY + 24 + i * 20;
    doc.rect(MARGIN, y, CONTENT_W, 20).fill(i % 2 === 0 ? '#f9f9f9' : WHITE);
    doc.fontSize(9.5).font('Helvetica').fillColor(MID).text(row[0], MARGIN + 8, y + 5, { width: CONTENT_W * 0.62 });
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(DARK).text(row[1], MARGIN, y + 5, { width: CONTENT_W - 8, align: 'right' });
  });

  // ── WHY IT WORKS ────────────────────────────────────────────
  const whyY = mathY + 24 + mathRows.length * 20 + 18;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK).text('Why It Works', MARGIN, whyY);
  doc.moveTo(MARGIN, whyY + 17).lineTo(PAGE_W - MARGIN, whyY + 17).strokeColor('#e0e0e0').lineWidth(0.75).stroke();

  const bullets = [
    { title: 'Proven engagement lift',     body: '+110% repeat visit frequency — documented across Dave & Buster\'s, bowling alleys, and golf venues.' },
    { title: 'White-labeled, zero friction', body: 'Your brand, your app. Guests compete through your experience — not a third-party platform.' },
    { title: 'Live in weeks, not months',  body: 'No custom dev required. Lucra plugs into existing systems — first competitions live in under 30 days.' },
  ];
  bullets.forEach((b, i) => {
    const y = whyY + 26 + i * 44;
    doc.rect(MARGIN, y, 3, 34).fill(BRAND);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK).text(b.title, MARGIN + 12, y + 2, { width: CONTENT_W - 12 });
    doc.fontSize(9).font('Helvetica').fillColor(MID).text(b.body, MARGIN + 12, y + 16, { width: CONTENT_W - 12 });
  });

  // ── PITCH QUOTE ─────────────────────────────────────────────
  const quoteY = whyY + 26 + bullets.length * 44 + 10;
  doc.rect(MARGIN, quoteY, CONTENT_W, 54).fill(LIGHT);
  doc.rect(MARGIN, quoteY, 3, 54).fill(BRAND);
  const monthlyComp = Math.round(daily_users * opt_rate / 100 * 30).toLocaleString();
  doc.fontSize(9.5).font('Helvetica-Oblique').fillColor('#444444').text(
    `"${Number(daily_users).toLocaleString()} visitors a day. At ${opt_rate}% opt-in, ${monthlyComp} competing monthly — each spending ${Math.round(lift*100)}% more. That's $${Number(monthly_roi).toLocaleString()}/mo in incremental revenue on a fixed fee. ${roi_x}x return. ${payback_days}-day payback."`,
    MARGIN + 12, quoteY + 10, { width: CONTENT_W - 20, lineGap: 2 }
  );

  // ── FOOTER ───────────────────────────────────────────────────
  const footerY = PAGE_H - 54;
  doc.rect(0, footerY, PAGE_W, 54).fill('#0d0d0d');
  doc.rect(0, footerY, PAGE_W, 3).fill(BRAND);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(WHITE).text('Mat Weiss', MARGIN, footerY + 12);
  doc.fontSize(8.5).font('Helvetica').fillColor('#888888').text('Founding Account Executive  ·  Lucra', MARGIN, footerY + 26);
  doc.fontSize(8.5).fillColor('#666666').text('mat.weiss@lucrasports.com', MARGIN, footerY + 38);
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  doc.fontSize(8).font('Helvetica').fillColor('#555555').text(
    `Prepared for ${company}  ·  ${dateStr}`,
    0, footerY + 38, { align: 'right', width: PAGE_W - MARGIN }
  );

  doc.end();
};
