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

export async function exportChapterPdf(
  chapter: ChapterPdf,
  manuscriptTitle: string,
) {
  showLoadingIndicator();

  try {
    await document.fonts?.ready;
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 808px;
      overflow: hidden;
      z-index: -9999;
      pointer-events: none;
    `;

    const printable = document.createElement("article");
    // KUNCI UTAMA 1: Kunci lebar ke angka mutlak 808px (menyamai windowWidth jsPDF)
    // agar pembagian ruang kanan-kiri untuk text-align center menjadi 100% presisi.
    printable.style.cssText = `
      width: 808px;
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
        margin: 0 0 24px;
        color: #5a5e54;
        font-weight: 500;
        font-size: 10px;
        font-family: Arial, sans-serif;
        letter-spacing: .16em;
      ">
        ${escapeHtml(manuscriptTitle.toUpperCase())}
      </p>

      <h1 style="
        margin: 0 0 38px;
        font-weight: 600;
        font-size: 39px;
        line-height: 1.12;
        font-family: 'Playfair Display', Georgia, serif;
        letter-spacing: -.035em;
        color: #262522;
      ">
        ${escapeHtml(chapter.title)}
      </h1>

      <section class="editor-content">
        ${chapter.content_html}
      </section>
    `;

    const styleTag = document.createElement("style");
    styleTag.textContent = `
      /* KUNCI UTAMA 2: Hancurkan margin bawaan iframe html2canvas yang sering menggeser layout */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 808px !important;
        box-sizing: border-box;
      }

      .editor-content p,
      .editor-content h1,
      .editor-content h2,
      .editor-content h3,
      .editor-content h4,
      .editor-content h5,
      .editor-content h6 {
        display: block;
        width: 100%;
        margin: 0 0 23px;
        color: #262522;
        box-sizing: border-box;
      }

      .editor-content span {
        display: inline;
      }

      /* Utilitas penangkap kelas alignment jika teks editor menggunakan class */
      .ql-align-center, .text-center { text-align: center !important; }
      .ql-align-right, .text-right { text-align: right !important; }
      .ql-align-justify, .text-justify { text-align: justify !important; }
    `;
    printable.prepend(styleTag);

    wrapper.appendChild(printable);
    document.body.appendChild(wrapper);

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    await pdf.html(printable, {
      x: 0,
      y: 0,
      width: 595,
      windowWidth: 808,
      autoPaging: "text",
      html2canvas: {
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      },
      callback: (doc) => {
        wrapper.remove();
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
