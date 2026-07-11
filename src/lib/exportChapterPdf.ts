import { jsPDF } from "jspdf";
import { fontCss } from "./fonts";

type ChapterPdf = { title: string; content_html: string; font_size: number; font_family: string };

export async function exportChapterPdf(chapter: ChapterPdf, manuscriptTitle: string) {
  await document.fonts?.ready;

  const printable = document.createElement("article");
  printable.style.cssText = `position:fixed;left:-10000px;top:0;width:680px;padding:56px 64px;background:#fff;color:#262522;font-family:${fontCss(chapter.font_family)};font-size:${chapter.font_size}px;line-height:1.82;`;
  printable.innerHTML = `<p style="margin:0 0 24px;color:#5a5e54;font:500 10px Arial,sans-serif;letter-spacing:.16em">${escapeHtml(manuscriptTitle.toUpperCase())}</p><h1 style="margin:0 0 38px;font:600 39px/1.12 ${fontCss(chapter.font_family)};letter-spacing:-.035em">${escapeHtml(chapter.title)}</h1><section>${chapter.content_html}</section>`;
  printable.querySelectorAll("p").forEach((element) => { if (!element.style.margin) element.style.margin = "0 0 23px"; });
  printable.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((element) => { element.setAttribute("style", `font-family:${fontCss(chapter.font_family)};line-height:1.2;margin:0 0 22px;`); });
  document.body.append(printable);

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  pdf.html(printable, {
    callback: (document) => {
      printable.remove();
      const safeName = chapter.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "chapter";
      document.save(`${safeName}.pdf`);
    },
    x: 0,
    y: 0,
    width: 595,
    windowWidth: 808,
    html2canvas: { scale: 0.75, backgroundColor: "#ffffff" },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);
}
