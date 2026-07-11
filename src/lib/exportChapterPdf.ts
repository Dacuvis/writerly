import { jsPDF } from "jspdf";

type ChapterPdf = { title: string; content_html: string; font_size: number };

export function exportChapterPdf(chapter: ChapterPdf, manuscriptTitle: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 64; const width = pdf.internal.pageSize.getWidth() - margin * 2; const pageBottom = pdf.internal.pageSize.getHeight() - margin;
  let y = margin;
  const nextLine = (lines: string[], size: number, gap: number) => {
    pdf.setFont("times", "normal"); pdf.setFontSize(size);
    const height = size * 1.42;
    for (const line of lines) { if (y + height > pageBottom) { pdf.addPage(); y = margin; } pdf.text(line, margin, y); y += height; }
    y += gap;
  };
  pdf.setTextColor(90, 94, 84); pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.text(manuscriptTitle.toUpperCase(), margin, y); y += 27;
  pdf.setTextColor(38, 37, 34); pdf.setFont("times", "bold"); pdf.setFontSize(30); pdf.text(chapter.title, margin, y); y += 42;
  const document = new DOMParser().parseFromString(chapter.content_html, "text/html");
  Array.from(document.body.children).forEach((element) => {
    const text = element.textContent?.trim(); if (!text) return;
    const match = element.tagName.match(/^H([1-6])$/); const level = match ? Number(match[1]) : 0;
    if (level) { const size = Math.max(13, 28 - level * 2); pdf.setFont("times", "bold"); pdf.setFontSize(size); const lines = pdf.splitTextToSize(text, width); const height = size * 1.35; if (y + lines.length * height > pageBottom) { pdf.addPage(); y = margin; } lines.forEach((line: string) => { pdf.text(line, margin, y); y += height; }); y += 13; return; }
    nextLine(pdf.splitTextToSize(text, width), chapter.font_size, 12);
  });
  const safeName = chapter.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "chapter";
  pdf.save(`${safeName}.pdf`);
}
