/**
 * BucksBuddy Agreement PDF Generator
 * Uses jsPDF (loaded via CDN in index.html)
 */

function generateAgreementPDF(project, contractorProfile) {
  if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    // Load jsPDF dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => generateAgreementPDF(project, contractorProfile);
    document.head.appendChild(script);
    return;
  }

  const { jsPDF } = window.jspdf || window;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, pad = 18;
  const teal = [141, 115, 246];
  const dark = [17, 17, 17];
  const grey = [100, 116, 139];
  const light = [241, 245, 249];

  // Agreement ID & date
  const now = new Date();
  const yr = now.getFullYear();
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  const agrId = `PV-AGR-${yr}-${seq}`;
  const trailId = `PV-TRAIL-${yr}-${seq}`;
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  let y = 0;

  // ── HEADER ──────────────────────────────────────────────
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(...teal);
  doc.rect(0, 0, 5, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('💰 BucksBuddy', pad, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...teal);
  doc.text('Get Paid On Time', pad, 18);

  doc.setTextColor(200, 210, 220);
  doc.setFontSize(8);
  doc.text(`Agreement ID: ${agrId}`, W - pad, 10, { align: 'right' });
  doc.text(dateStr, W - pad, 16, { align: 'right' });

  // Status badge
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(W - pad - 42, 19, 42, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('✅ ACCEPTED', W - pad - 21, 23.5, { align: 'center' });

  y = 38;

  // ── CONTRACTOR DETAILS ───────────────────────────────────
  const drawSection = (title, fields, startY) => {
    doc.setFillColor(...teal);
    doc.rect(pad, startY, W - pad * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, pad + 4, startY + 4.8);

    doc.setFillColor(...light);
    const rowH = fields.length * 6.5 + 8;
    doc.rect(pad, startY + 7, W - pad * 2, rowH, 'F');

    let fy = startY + 13;
    const col2 = pad + (W - pad * 2) / 2;
    const fieldPairs = [];
    for (let i = 0; i < fields.length; i += 2) fieldPairs.push(fields.slice(i, i + 2));
    fieldPairs.forEach(pair => {
      pair.forEach((f, idx) => {
        const x = idx === 0 ? pad + 4 : col2 + 4;
        doc.setTextColor(...grey);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(f.label, x, fy - 2);
        doc.setTextColor(30, 40, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(f.value || '—', x, fy + 2);
      });
      fy += 6.5;
    });
    return startY + 7 + rowH + 4;
  };

  const cp = contractorProfile || {};
  y = drawSection('1. CONTRACTOR DETAILS', [
    { label: 'Business Name', value: cp.company_name || 'Your Company' },
    { label: 'Representative Name', value: cp.full_name || 'Authorized Signatory' },
    { label: 'Phone Number', value: cp.phone || '9999999999' },
    { label: 'Platform ID', value: cp.id || 'usr_xxx' }
  ], y);

  // ── CLIENT DETAILS ───────────────────────────────────────
  y = drawSection('2. CLIENT DETAILS', [
    { label: 'Client Name', value: project.client_name },
    { label: 'Contact Number', value: project.client_phone || 'Not Provided' },
    { label: 'Project Location/Name', value: project.project_name },
    { label: 'Onboarding Date', value: dateStr }
  ], y);

  // ── PAYMENT TERMS ────────────────────────────────────────
  const totalAmount = `Rs. ${Number(project.total_amount).toLocaleString('en-IN')}`;
  y = drawSection('3. PAYMENT TERMS & SCHEDULE', [
    { label: 'Total Project Value', value: totalAmount },
    { label: 'Late Fee Structure', value: `${project.late_fee_pct}% per ${project.late_fee_type}` },
    { label: 'Grace Period', value: `${project.grace_period || 5} days` },
    { label: 'Currency', value: 'INR (Indian Rupees)' }
  ], y);

  // ── TERMS & CONDITIONS ───────────────────────────────────
  doc.setFillColor(...teal);
  doc.rect(pad, y, W - pad * 2, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('4. STANDARD TERMS & CONDITIONS', pad + 4, y + 4.8);
  y += 12;

  doc.setTextColor(...grey);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const terms = [
    "1. This document constitutes a binding agreement between the Contractor and the Client.",
    "2. The Client agrees to pay the Total Project Value as per the agreed schedule.",
    `3. Payments delayed beyond the grace period of ${project.grace_period || 5} days will attract a late fee of ${project.late_fee_pct}% per ${project.late_fee_type}.`,
    "4. All disputes are subject to the jurisdiction of the Contractor's registered city.",
    "5. This agreement is digitally generated and logged via BucksBuddy, and constitutes valid electronic evidence under the IT Act, 2000."
  ];

  terms.forEach(t => {
    const lines = doc.splitTextToSize(t, W - pad * 2);
    doc.text(lines, pad, y);
    y += lines.length * 4.5 + 2;
  });

  // ── DIGITAL SIGNATURE & AUDIT TRAIL ──────────────────────
  y += 10;
  doc.setFillColor(...light);
  doc.rect(pad, y, W - pad * 2, 28, 'F');
  
  doc.setTextColor(...teal);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DIGITAL AUDIT TRAIL', pad + 4, y + 6);
  
  doc.setTextColor(...grey);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Generated On: ${dateStr} ${timeStr}`, pad + 4, y + 12);
  doc.text(`System ID: ${trailId}`, pad + 4, y + 16);
  doc.text(`IP Reference: Logged securely in BucksBuddy Vault`, pad + 4, y + 20);

  doc.setTextColor(150, 160, 170);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.text('This is a system generated document. Physical signature is not required.', W / 2, y + 36, { align: 'center' });

  // Download
  doc.save(`BucksBuddy_Agreement_${project.client_name.replace(/\s+/g, '_')}.pdf`);
}
window.generateAgreementPDF = generateAgreementPDF;
