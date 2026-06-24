import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const uploadDir = path.join(process.cwd(), "uploads");

function safeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function saveBase64File(prefix: string, fileName: string, base64: string) {
  await fs.mkdir(uploadDir, { recursive: true });
  const extension = path.extname(fileName) || ".pdf";
  const storedName = `${safeName(prefix)}-${randomUUID()}${extension}`;
  await fs.writeFile(path.join(uploadDir, storedName), Buffer.from(base64, "base64"));
  return {
    fileName: storedName,
    path: `/files/${storedName}`
  };
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function createSimplePdf(title: string, lines: string[]) {
  const contentLines = [
    "BT",
    "/F1 20 Tf",
    "72 740 Td",
    `(${escapePdfText(title)}) Tj`,
    "/F1 11 Tf",
    "0 -34 Td",
    ...lines.flatMap((line) => [`(${escapePdfText(line)}) Tj`, "0 -18 Td"]),
    "ET"
  ];
  const stream = contentLines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body);
}

export async function savePdf(prefix: string, fileName: string, buffer: Buffer) {
  await fs.mkdir(uploadDir, { recursive: true });
  const storedName = `${safeName(prefix)}-${safeName(fileName)}`;
  await fs.writeFile(path.join(uploadDir, storedName), buffer);
  return {
    fileName: storedName,
    path: `/files/${storedName}`
  };
}
