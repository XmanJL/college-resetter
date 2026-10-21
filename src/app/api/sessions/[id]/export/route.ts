import { currentUser, serverSupabaseFetch } from "@/lib/supabase";

type PdfLine = {
  text: string;
  font: "regular" | "bold" | "serif";
  size: number;
  color: string;
  gapBefore?: number;
};

function pdfSafe(value: unknown) {
  return String(value ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7e]/g, "?");
}

function wrapText(value: unknown, width: number) {
  const words = pdfSafe(value).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return ["None added yet."];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(session: Record<string, unknown>) {
  const thought = session.thought || "Nothing added yet.";
  const tags = session.tags && typeof session.tags === "object" ? Object.keys(session.tags as Record<string, unknown>).join(" - ") : "";
  const state = session.state || "No feeling selected yet.";
  const activity = session.activity ? ` - ${session.activity}` : "";
  const nextStep = session.next_step || "No next step added yet.";
  const duration = session.duration || "25 minutes";
  const visibility = session.visibility === "anonymous_community" ? "community" : "private";
  const createdAt = session.created_at
    ? new Date(String(session.created_at)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Just now";

  const lines: PdfLine[] = [
    { text: "RESET ROOM", font: "bold", size: 10, color: "0.25 0.44 0.55" },
    { text: "A place to come back to", font: "serif", size: 25, color: "0.13 0.21 0.29", gapBefore: 8 },
    { text: `Saved ${createdAt}  -  ${visibility}`, font: "regular", size: 10, color: "0.38 0.46 0.52", gapBefore: 7 },
    { text: "01 / UNLOAD", font: "bold", size: 10, color: "0.25 0.44 0.55", gapBefore: 28 },
    ...wrapText(thought, 78).map((text) => ({ text, font: "serif" as const, size: 15, color: "0.13 0.21 0.29" })),
    ...(tags ? [{ text: `Threads: ${tags}`, font: "regular" as const, size: 10, color: "0.38 0.46 0.52", gapBefore: 6 }] : []),
    { text: "02 / RELIEVE", font: "bold", size: 10, color: "0.25 0.44 0.55", gapBefore: 25 },
    ...wrapText(`${state}${activity}`, 86).map((text) => ({ text, font: "regular" as const, size: 12, color: "0.13 0.21 0.29" })),
    { text: "03 / RESET", font: "bold", size: 10, color: "0.25 0.44 0.55", gapBefore: 25 },
    ...wrapText(nextStep, 78).map((text) => ({ text, font: "serif" as const, size: 15, color: "0.13 0.21 0.29" })),
    { text: `Time: ${duration}`, font: "regular", size: 10, color: "0.38 0.46 0.52", gapBefore: 6 },
    { text: "Your name, email, and private notes never appear in a community preview.", font: "regular", size: 9, color: "0.38 0.46 0.52", gapBefore: 32 },
  ];

  const pages: PdfLine[][] = [];
  let page: PdfLine[] = [];
  let used = 0;
  for (const line of lines) {
    const lineHeight = line.size + 6;
    const gap = line.gapBefore || 0;
    if (page.length && used + gap + lineHeight > 690) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(line);
    used += gap + lineHeight;
  }
  if (page.length) pages.push(page);

  const objects: string[] = [];
  const addObject = (value: string) => {
    objects.push(value);
    return objects.length;
  };
  const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const fontSerif = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>");
  const pageIds: number[] = [];

  for (const pageLines of pages) {
    let content = "q 0.96 0.98 0.99 rg 0 0 612 792 re f Q\n";
    let y = 744;
    for (const line of pageLines) {
      y -= line.gapBefore || 0;
      const font = line.font === "bold" ? fontBold : line.font === "serif" ? fontSerif : fontRegular;
      content += `BT /F${font} ${line.size} Tf ${line.color} rg 54 ${y} Td (${escapePdfText(line.text)}) Tj ET\n`;
      y -= line.size + 6;
    }
    const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}endstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent PAGES /MediaBox [0 0 612 792] /Resources << /Font << /F${fontRegular} ${fontRegular} 0 R /F${fontBold} ${fontBold} 0 R /F${fontSerif} ${fontSerif} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageIds.push(pageId);
  }

  const pagesId = addObject(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
  );
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  const pdfPages = objects.map((object) => object.replaceAll("PAGES", `${pagesId} 0 R`));
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < pdfPages.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${pdfPages[index]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${pdfPages.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${pdfPages.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rows = await serverSupabaseFetch<Array<Record<string, unknown>>>(
    `reset_sessions?id=eq.${id}&owner_id=eq.${user.id}&select=*`,
  );
  if (!rows?.[0]) return Response.json({ error: "Not found" }, { status: 404 });
  const pdf = buildPdf(rows[0]);
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reset-room-${id}.pdf"`,
    },
  });
}
