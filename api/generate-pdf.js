const PDFDocument = require('pdfkit');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    company = 'Your Venue',
    users = 1000,
    current_revenue = 1000000,
    lift = 0.15,
    monthly_roi = 50000,
    annual_roi = 500000,
    three_year_value = 1500000,
    payback_days = 30,
    roi_x = '5.0'
  } = req.body;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="lucra-roi-${company.toLowerCase().replace(/[^a-z0-9]/g,'-')}.pdf"`);

  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  doc.pipe(res);

  const GREEN = '#10B981';
  const DARK = '#1a1a1a';
  const GRAY = '#666666';
  const LIGHTGRAY = '#f5f5f5';

  // Header bar
  doc.rect(0, 0, 612, 80).fill('#0a0a0b');
  doc.fontSize(28).font('Helvetica-Bold').fillColor(GREEN).text('LUCRA', 50, 22);
  doc.fontSize(11).font('Helvetica').fillColor('#888888').text('ROI Leave-Behind', 50, 56);
  doc.fontSize(12).fillColor('#cccccc').text(company, 0, 46, { align: 'right', width: 562 });

  // Hero ROI section
  doc.rect(50, 100, 512, 90).fill(LIGHTGRAY);
  doc.fontSize(52).font('Helvetica-Bold').fillColor(GREEN).text(`${roi_x}x ROI`, 0, 106, { align: 'center', width: 612 });
  doc.fontSize(13).font('Helvetica').fillColor(GRAY).text(`Pays for itself in ${payback_days} days`, 0, 166, { align: 'center', width: 612 });

  // 4-stat row
  const stats = [
    { label: 'Monthly Lift', value: '$' + Number(monthly_roi).toLocaleString() },
    { label: 'Annual Impact', value: '$' + Number(annual_roi).toLocaleString() },
    { label: '3-Year Value', value: '$' + Number(three_year_value).toLocaleString() },
    { label: 'Payback', value: payback_days + ' days' }
  ];
  const statW = 118, statY = 210;
  stats.forEach(function(s, i) {
    const x = 50 + i * (statW + 8);
    doc.rect(x, statY, statW, 62).fill('#ecfdf5');
    doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(s.label, x, statY + 9, { width: statW, align: 'center' });
    doc.fontSize(15).font('Helvetica-Bold').fillColor(GREEN).text(s.value, x, statY + 26, { width: statW, align: 'center' });
  });

  // Inputs summary
  doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text('Deal Inputs', 50, 295);
  doc.moveTo(50, 312).lineTo(562, 312).strokeColor('#e0e0e0').stroke();
  const inputs = [
    ['Daily Visitors', Number(users).toLocaleString() + ' / day'],
    ['ARPU Lift', '+' + Math.round(lift * 100) + '%'],
    ['Annual Revenue Base', '$' + Number(current_revenue).toLocaleString()],
  ];
  inputs.forEach(function(inp, i) {
    const y = 320 + i * 22;
    doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(inp[0], 50, y);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK).text(inp[1], 0, y, { align: 'right', width: 562 });
  });

  // Pitch box
  doc.rect(50, 395, 512, 85).fill('#ecfdf5');
  const pitch = `"You get ${Number(users).toLocaleString()} visitors a day. At 10% opt-in that's ${Math.round(users * 0.1)} competing through Lucra monthly. Each spends ${Math.round(lift * 100)}% more — generating $${Number(monthly_roi).toLocaleString()}/mo on a fixed fee. That's ${roi_x}x return. Lucra pays for itself in ${payback_days} days."`;
  doc.fontSize(10).font('Helvetica-Oblique').fillColor('#065f46').text(pitch, 62, 406, { width: 490, lineGap: 4 });

  // Why Lucra
  doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text('Why Lucra', 50, 498);
  doc.moveTo(50, 514).lineTo(562, 514).strokeColor('#e0e0e0').stroke();
  const bullets = [
    '✓  White-labeled — your brand, your experience',
    '✓  Live in weeks, not months',
    '✓  +110% repeat visit frequency (D&B case study)',
    '✓  No upfront costs — pure ROI from day one'
  ];
  bullets.forEach(function(b, i) {
    doc.fontSize(10).font('Helvetica').fillColor(DARK).text(b, 60, 522 + i * 19);
  });

  // Footer
  doc.rect(0, 718, 612, 74).fill('#0a0a0b');
  doc.fontSize(11).font('Helvetica-Bold').fillColor(GREEN).text('Mat Weiss', 50, 732);
  doc.fontSize(9).font('Helvetica').fillColor('#888888').text('Founding Account Executive, Lucra', 50, 748);
  doc.fontSize(9).fillColor('#666666').text('mat.weiss@lucrasports.com  ·  lucrasports.com', 50, 763);
  doc.fontSize(9).fillColor('#555555').text(`Prepared for ${company}`, 0, 748, { align: 'right', width: 562 });

  doc.end();
};
