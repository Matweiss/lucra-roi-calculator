const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Lucra brand constants
const LUCRA_GREEN = '#10B981';
const DARK_BG     = '#0d0d0d';
const DARK_SURF   = '#161616';
const DARK_SURF2  = '#1e1e1e';
const DARK_BORDER = '#2a2a2a';
const TEXT_WHITE  = '#f5f5f5';
const TEXT_DIM    = '#a1a1aa';
const TEXT_FAINT  = '#525252';

const LUCRA_LOGO_PATH = path.join(__dirname, '../public/lucra-logo.jpg');

function F(n) { return '$' + Math.round(n).toLocaleString(); }

function hexToRgb(hex) {
  const h = (hex || '#10B981').replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function setFill(doc, hex) {
  const [r,g,b] = hexToRgb(hex);
  doc.fillColor([r,g,b]);
}

function setStroke(doc, hex) {
  const [r,g,b] = hexToRgb(hex);
  doc.strokeColor([r,g,b]);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    company       = 'Your Company',
    website       = '',
    lift          = 0.15,
    monthly_roi   = 50000,
    annual_roi    = 500000,
    three_year_value = 1500000,
    payback_days  = 30,
    roi_x         = '5.0',
    arpu          = 40,
    opt_rate      = 10,
    daily_users   = 1000,
    logo_data_url = null,
  } = req.body;

  const PAGE_W = 612, PAGE_H = 792;
  const M = 40; // margin
  const CW = PAGE_W - M * 2; // content width

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="lucra-roi-${company.toLowerCase().replace(/[^a-z0-9]/g,'-')}.pdf"`);
  res.setHeader('Cache-Control', 'no-cache');

  const doc = new PDFDocument({ size: 'LETTER', margin: 0, compress: true });
  doc.pipe(res);

  // ── FULL PAGE DARK BG ────────────────────────────────────────────────────────
  setFill(doc, DARK_BG);
  doc.rect(0, 0, PAGE_W, PAGE_H).fill();

  // ── HEADER BAR ──────────────────────────────────────────────────────────────
  setFill(doc, DARK_SURF);
  doc.rect(0, 0, PAGE_W, 80).fill();
  // Green bottom stripe on header
  setFill(doc, LUCRA_GREEN);
  doc.rect(0, 80, PAGE_W, 3).fill();

  // Lucra logo (right side)
  let lucraLogoDrawn = false;
  try {
    if (fs.existsSync(LUCRA_LOGO_PATH)) {
      doc.image(LUCRA_LOGO_PATH, PAGE_W - M - 80, 10, { height: 60, fit: [80, 60] });
      lucraLogoDrawn = true;
    }
  } catch(e) {}
  if (!lucraLogoDrawn) {
    // Fallback wordmark
    setFill(doc, LUCRA_GREEN);
    doc.fontSize(24).font('Helvetica-Bold').text('LUCRA', PAGE_W - M - 68, 28, { width: 68, align: 'right' });
  }

  // Vertical divider
  setStroke(doc, DARK_BORDER);
  doc.moveTo(PAGE_W - M - 100, 18).lineTo(PAGE_W - M - 100, 62).lineWidth(1).stroke();

  // Customer logo or name (left)
  let customerLogoDrawn = false;
  if (logo_data_url && logo_data_url.startsWith('data:image/')) {
    try {
      const buf = Buffer.from(logo_data_url.split(',')[1], 'base64');
      doc.image(buf, M, 12, { height: 56, fit: [200, 56] });
      customerLogoDrawn = true;
    } catch(e) {}
  }
  if (!customerLogoDrawn) {
    setFill(doc, TEXT_WHITE);
    doc.fontSize(20).font('Helvetica-Bold').text(company, M, 28, { width: 260 });
  }

  // ── HERO SECTION ────────────────────────────────────────────────────────────
  const heroY = 100;

  // Big ROI X
  setFill(doc, LUCRA_GREEN);
  doc.fontSize(72).font('Helvetica-Bold').text(`${roi_x}x`, M, heroY + 4, { width: 180, align: 'center' });

  setFill(doc, TEXT_DIM);
  doc.fontSize(11).font('Helvetica').text('projected ROI', M, heroY + 82, { width: 180, align: 'center' });

  // Vertical rule
  setStroke(doc, DARK_BORDER);
  doc.moveTo(M + 188, heroY + 8).lineTo(M + 188, heroY + 88).lineWidth(1).stroke();

  // Headline right of rule
  const hX = M + 200, hW = CW - 200;
  setFill(doc, TEXT_WHITE);
  doc.fontSize(17).font('Helvetica-Bold').text(`Built for ${company}.`, hX, heroY + 10, { width: hW });

  setFill(doc, TEXT_DIM);
  doc.fontSize(10).font('Helvetica').text(
    `Based on ${Number(daily_users).toLocaleString()} daily visitors — here's what Lucra delivers in year one.`,
    hX, heroY + 36, { width: hW, lineGap: 3 }
  );
  if (website) {
    setFill(doc, TEXT_FAINT);
    doc.fontSize(9).font('Helvetica').text(website, hX, heroY + 68, { width: hW });
  }

  // Thin separator
  setFill(doc, DARK_SURF2);
  doc.rect(M, heroY + 100, CW, 1).fill();

  // ── 4 STAT BOXES ────────────────────────────────────────────────────────────
  const statsY = heroY + 112;
  const statW = (CW - 9) / 4;
  const stats = [
    { label: 'Monthly Lift',    value: F(monthly_roi),      sub: 'incremental revenue' },
    { label: 'Annual Impact',   value: F(annual_roi),       sub: 'net of Lucra fee'    },
    { label: '3-Year Value',    value: F(three_year_value), sub: 'cumulative ROI'      },
    { label: 'Payback Period',  value: `${payback_days}d`,  sub: 'to break even'       },
  ];
  stats.forEach((s, i) => {
    const x = M + i * (statW + 3);
    // Box bg
    setFill(doc, DARK_SURF);
    doc.roundedRect(x, statsY, statW, 76, 6).fill();
    // Green top accent
    setFill(doc, LUCRA_GREEN);
    doc.roundedRect(x, statsY, statW, 3, 1).fill();
    // Label
    setFill(doc, TEXT_DIM);
    doc.fontSize(7.5).font('Helvetica').text(s.label.toUpperCase(), x, statsY + 12,
      { width: statW, align: 'center', characterSpacing: 0.5 });
    // Value
    setFill(doc, LUCRA_GREEN);
    doc.fontSize(17).font('Helvetica-Bold').text(s.value, x, statsY + 28,
      { width: statW, align: 'center' });
    // Sub
    setFill(doc, TEXT_FAINT);
    doc.fontSize(7.5).font('Helvetica').text(s.sub, x, statsY + 54,
      { width: statW, align: 'center' });
  });

  // ── THE MATH ─────────────────────────────────────────────────────────────────
  const mathY = statsY + 90;
  setFill(doc, LUCRA_GREEN);
  doc.rect(M, mathY, 3, 15).fill();
  setFill(doc, TEXT_WHITE);
  doc.fontSize(12).font('Helvetica-Bold').text('The Math', M + 10, mathY + 1);

  setFill(doc, DARK_BORDER);
  doc.rect(M, mathY + 20, CW, 0.5).fill();

  const monthlyComp = Math.round(daily_users * opt_rate / 100 * 30);
  const lucraARPU   = (arpu * (1 + lift)).toFixed(2);
  const mathRows = [
    ['Daily visitors',                Number(daily_users).toLocaleString()],
    ['Lucra opt-in rate',             `${opt_rate}%`],
    ['Monthly active competitors',    monthlyComp.toLocaleString()],
    ['Current ARPU',                  `$${Number(arpu).toLocaleString()}`],
    ['ARPU lift with Lucra',          `+${Math.round(lift * 100)}%  ($${(arpu * lift).toFixed(2)}/user)`],
    ['Lucra ARPU',                    `$${lucraARPU}`],
    ['Monthly incremental revenue',   F(monthly_roi)],
    ['Annual net ROI (after fee)',     F(annual_roi)],
  ];
  mathRows.forEach((row, i) => {
    const y = mathY + 26 + i * 19;
    if (i % 2 === 0) {
      setFill(doc, DARK_SURF);
      doc.rect(M, y, CW, 19).fill();
    }
    setFill(doc, TEXT_DIM);
    doc.fontSize(9).font('Helvetica').text(row[0], M + 8, y + 5, { width: CW * 0.62 });
    setFill(doc, i >= 6 ? LUCRA_GREEN : TEXT_WHITE);
    doc.fontSize(9).font('Helvetica-Bold').text(row[1], M, y + 5, { width: CW - 8, align: 'right' });
  });

  const afterMathY = mathY + 26 + mathRows.length * 19 + 14;

  // ── WHY IT WORKS ─────────────────────────────────────────────────────────────
  setFill(doc, LUCRA_GREEN);
  doc.rect(M, afterMathY, 3, 15).fill();
  setFill(doc, TEXT_WHITE);
  doc.fontSize(12).font('Helvetica-Bold').text('Why It Works', M + 10, afterMathY + 1);

  setFill(doc, DARK_BORDER);
  doc.rect(M, afterMathY + 20, CW, 0.5).fill();

  const bullets = [
    { title: 'Proven engagement lift',       body: '+110% repeat visit frequency — validated across Dave & Buster\'s, bowling alleys, and golf venues.' },
    { title: 'White-labeled, zero friction', body: 'Your brand, your app. Guests compete through your experience — not a third-party platform.' },
    { title: 'Live in under 30 days',        body: 'No custom dev required. Lucra integrates with existing systems — first competitions live fast.' },
  ];

  bullets.forEach((b, i) => {
    const y = afterMathY + 28 + i * 40;
    setFill(doc, LUCRA_GREEN);
    doc.rect(M, y, 3, 30).fill();
    setFill(doc, TEXT_WHITE);
    doc.fontSize(10).font('Helvetica-Bold').text(b.title, M + 10, y + 2, { width: CW - 10 });
    setFill(doc, TEXT_DIM);
    doc.fontSize(8.5).font('Helvetica').text(b.body, M + 10, y + 16, { width: CW - 10 });
  });

  const afterBulletsY = afterMathY + 28 + bullets.length * 40 + 10;

  // ── CLOSING PITCH QUOTE ──────────────────────────────────────────────────────
  setFill(doc, DARK_SURF);
  doc.roundedRect(M, afterBulletsY, CW, 52, 6).fill();
  setFill(doc, LUCRA_GREEN);
  doc.roundedRect(M, afterBulletsY, 3, 52, 1).fill();

  const pitchText = `"${Number(daily_users).toLocaleString()} visitors a day. At ${opt_rate}% opt-in, ${monthlyComp.toLocaleString()} competing monthly — each spending ${Math.round(lift * 100)}% more. That's ${F(monthly_roi)}/mo on a fixed fee. ${roi_x}x return. ${payback_days}-day payback."`;
  setFill(doc, TEXT_DIM);
  doc.fontSize(9).font('Helvetica-Oblique').text(pitchText, M + 12, afterBulletsY + 10,
    { width: CW - 20, lineGap: 2 });

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const footerY = PAGE_H - 56;
  setFill(doc, DARK_SURF);
  doc.rect(0, footerY, PAGE_W, 56).fill();
  setFill(doc, LUCRA_GREEN);
  doc.rect(0, footerY, PAGE_W, 2).fill();

  setFill(doc, TEXT_WHITE);
  doc.fontSize(11).font('Helvetica-Bold').text('Mat Weiss', M, footerY + 12);
  setFill(doc, TEXT_DIM);
  doc.fontSize(8.5).font('Helvetica').text('Founding Account Executive  ·  Lucra', M, footerY + 27);
  setFill(doc, TEXT_FAINT);
  doc.fontSize(8.5).font('Helvetica').text('mat.weiss@lucrasports.com', M, footerY + 39);

  const dateStr = new Date().toLocaleDateString('en-US',
    { month: 'long', day: 'numeric', year: 'numeric' });
  setFill(doc, TEXT_FAINT);
  doc.fontSize(8).font('Helvetica').text(
    `Prepared for ${company}  ·  ${dateStr}`,
    0, footerY + 39, { align: 'right', width: PAGE_W - M }
  );
  setFill(doc, LUCRA_GREEN);
  doc.fontSize(8).font('Helvetica-Bold').text(
    'lucrasports.com',
    0, footerY + 12, { align: 'right', width: PAGE_W - M }
  );

  doc.end();
};
