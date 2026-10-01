/**
 * Generazione del PDF del preventivo.
 *
 * Regola di fondo: la provvigione e' un dato interno dell'agente e non viene
 * mai riportata nel documento consegnato al cliente. Qui compaiono solo
 * prezzo applicato, quantita' e totali.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfRiga {
  apcpro: string;
  descrizione: string;
  apunmi: string;
  quantita: number;
  prezzo: number;
  sconto: number;
  totale: number;
}

export interface PreventivoPdfData {
  numero: string;
  clientName: string;
  agenteNome: string;
  validUntil: string | null;
  notes: string | null;
  righe: PdfRiga[];
  subtotal: number;
  discount: number;
  iva: number;
  total: number;
}

const AZIENDA = 'Roloil';

const formatDateIt = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmt = (n: number) =>
  n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function generatePreventivoPdf(data: PreventivoPdfData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // --- Intestazione ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(AZIENDA, margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestione Preventivi', pageWidth - margin, y, { align: 'right' });
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Detti preventivo / cliente ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PREVENTIVO', margin, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.numero, pageWidth - margin, y, { align: 'right' });
  y += 7;

  doc.text(`Cliente: ${data.clientName}`, margin, y);
  y += 5;
  doc.text(`Agente: ${data.agenteNome}`, margin, y);
  y += 5;
  if (data.validUntil) {
    doc.text(`Valido fino al: ${formatDateIt(data.validUntil)}`, margin, y);
    y += 5;
  }
  doc.text(`Data: ${formatDateIt(new Date().toISOString())}`, margin, y);
  y += 10;

  // --- Tabella righe ---
  autoTable(doc, {
    startY: y,
    head: [['Codice', 'Descrizione', 'Qtà', 'Prezzo', 'Sconto', 'Totale']],
    body: data.righe.map((r) => [
      r.apcpro,
      r.descrizione,
      `${r.quantita} ${r.apunmi}`,
      fmt(r.prezzo),
      r.sconto > 0 ? `${r.sconto}%` : '-',
      fmt(r.totale)
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' }
    }
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // --- Totali ---
  const totalsX = pageWidth - margin - 60;
  const line = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 10);
    doc.text(label, totalsX, y);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += bold ? 7 : 5;
  };

  line('Subtotale', fmt(data.subtotal));
  if (data.discount > 0) line('Sconto', `-${fmt(data.discount)}`);
  line(`IVA (22%)`, fmt(data.iva));
  line('Totale', fmt(data.total), true);

  // --- Note ---
  if (data.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Note', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(data.notes, pageWidth - margin * 2) as string[];
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  doc.save(`preventivo-${data.numero}.pdf`);
}