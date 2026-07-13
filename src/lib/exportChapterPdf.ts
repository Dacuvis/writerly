import { jsPDF } from "jspdf";
import { fontCss } from "./fonts";

type ChapterPdf = {
  title: string;
  content_html: string;
  font_size: number;
  font_family: string;
};

function showLoadingIndicator() {
  const existingIndicator = document.getElementById("pdf-export-indicator");
  if (existingIndicator) existingIndicator.remove();

  const indicator = document.createElement("div");
  indicator.id = "pdf-export-indicator";
  indicator.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 99999;
    background: #262522;
    color: #fff;
    padding: 24px 32px;
    border-radius: 8px;
    font-family: "Instrument Sans", Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 12px;
  `;

  const spinner = document.createElement("div");
  spinner.style.cssText = `
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  indicator.appendChild(spinner);
  indicator.appendChild(document.createTextNode("Exporting to PDF..."));
  document.body.appendChild(indicator);

  return indicator;
}

function hideLoadingIndicator() {
  const indicator = document.getElementById("pdf-export-indicator");
  if (indicator) indicator.remove();
}

export async function exportChapterPdf(
  chapter: ChapterPdf,
  manuscriptTitle: string,
) {
  showLoadingIndicator();

  try {
    // Tunggu semua font selesai dimuat
    await document.fonts?.ready;
    
    // Tambahan delay untuk memastikan fonts fully rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    const printable = document.createElement("article");

    printable.style.cssText = `
      position: fixed;
      left: -99999px;
      top: 0;
      width: 680px;
      padding: 56px 64px;
      background: #ffffff;
      color: #262522;
      font-family: ${fontCss(chapter.font_family)};
      font-size: ${chapter.font_size}px;
      line-height: 1.82;
      box-sizing: border-box;
    `;

    printable.innerHTML = `
      <p style="
        margin:0 0 24px;
        color:#5a5e54;
        font:500 10px Arial,sans-serif;
        letter-spacing:.16em;
      ">
        ${escapeHtml(manuscriptTitle.toUpperCase())}
      </p>

      <h1 style="
        margin:0 0 38px;
        font:600 39px/1.12 'Playfair Display', Georgia, serif;
        letter-spacing:-.035em;
        color:#262522;
      ">
        ${escapeHtml(chapter.title)}
      </h1>

      <section>
        ${chapter.content_html}
      </section>
    `;

    // Ensure all text elements have proper styling and color
    printable.querySelectorAll("p").forEach((element) => {
      const el = element as HTMLElement;
      if (!el.style.margin) {
        el.style.margin = "0 0 23px";
      }
      el.style.color = "#262522";
      el.style.visibility = "visible";
    });

    printable.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((element) => {
      const el = element as HTMLElement;
      el.style.cssText = `
        font-family:'Playfair Display', Georgia, serif;
        line-height:1.2;
        margin:0 0 22px;
        color:#262522;
        visibility:visible;
      `;
    });

    // Apply color to all elements and ensure visibility
    printable.querySelectorAll("*").forEach((element) => {
      const el = element as HTMLElement;
      el.style.color = "#262522";
      el.style.visibility = "visible";
    });

    document.body.appendChild(printable);

    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    pdf.html(printable, {
      x: 0,
      y: 0,
      width: 595,
      windowWidth: 808,

      html2canvas: {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
      },

      callback: (doc) => {
        printable.remove();
        hideLoadingIndicator();

        const safeName =
          chapter.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") ||
          "chapter";

        doc.save(`${safeName}.pdf`);
      },
    });
  } catch (error) {
    hideLoadingIndicator();
    console.error("Error exporting PDF:", error);
    alert("Gagal export PDF. Silakan coba lagi.");
  }
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      })[character] ?? character,
  );
}
