import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { fontCss } from "./fonts";

type ChapterPdf = { title: string; content_html: string; font_size: number; font_family: string };
type AlignmentOptions = "left" | "center" | "right";

export async function exportChapterPdf(chapter: ChapterPdf, manuscriptTitle: string, headerAlign: AlignmentOptions = "center", bodyAlign: AlignmentOptions = "left") {
  await document.fonts?.ready;

  const printable = document.createElement("article");
  // Keep element visible (opacity:1) but hidden with transform to avoid visual blink
  printable.style.cssText = `position:fixed;left:0;top:0;opacity:1;width:680px;padding:56px 64px;background:#fff;color:#262522;font-family:${fontCss(chapter.font_family)};font-size:${chapter.font_size}px;line-height:1.82;transform:translateX(-200vw);pointer-events:none;z-index:9999;`;
  
  const headerAlign_css = headerAlign === "right" ? "right" : headerAlign === "center" ? "center" : "left";
  const bodyAlign_css = bodyAlign === "right" ? "right" : bodyAlign === "center" ? "center" : "left";
  
  printable.innerHTML = `<p style="margin:0 0 24px;color:#5a5e54;font:500 10px Arial,sans-serif;letter-spacing:.16em;text-align:${headerAlign_css}">${escapeHtml(manuscriptTitle.toUpperCase())}</p><h1 style="margin:0 0 38px;font:600 39px/1.12 'Playfair Display',Georgia,serif;letter-spacing:-.035em;text-align:${headerAlign_css}">${escapeHtml(chapter.title)}</h1><section style="text-align:${bodyAlign_css}">${chapter.content_html}</section>`;
  printable.querySelectorAll("p").forEach((element) => { if (!element.style.margin) element.style.margin = "0 0 23px"; });
  printable.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((element) => { element.setAttribute("style", "font-family:'Playfair Display',Georgia,serif;line-height:1.2;margin:0 0 22px;text-align:" + bodyAlign_css); });
  document.body.append(printable);

  // eslint-disable-next-line no-console
  console.debug('exportChapterPdf: printable text length', printable.innerText?.length);

  try {
    await new Promise((r) => setTimeout(r, 500));

    const canvas = await html2canvas(printable, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeName = chapter.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "chapter";
    pdf.save(`${safeName}.pdf`);
    printable.remove();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('exportChapterPdf: pdf generation failed, falling back to text-only PDF', err);
    try {
      const text = (printable.innerText || "").trim();
      const safeName = chapter.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "chapter";
      if (text.length) {
        const fallback = new jsPDF({ unit: "pt", format: "a4" });
        const margin = 40;
        const pageWidth = fallback.internal.pageSize.getWidth();
        const maxLineWidth = pageWidth - margin * 2;
        const lines = fallback.splitTextToSize(text, maxLineWidth);
        let cursorY = margin;
        const lineHeight = (chapter.font_size || 12) * 1.2;
        for (let i = 0; i < lines.length; i++) {
          if (cursorY + lineHeight > fallback.internal.pageSize.getHeight() - margin) {
            fallback.addPage();
            cursorY = margin;
          }
          fallback.text(lines[i], margin, cursorY);
          cursorY += lineHeight;
        }
        printable.remove();
        fallback.save(`${safeName}.pdf`);
        return;
      }
    } catch (fallbackErr) {
      // eslint-disable-next-line no-console
      console.error('exportChapterPdf: fallback also failed', fallbackErr);
    }

    printable.remove();
    throw err;
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);
}
