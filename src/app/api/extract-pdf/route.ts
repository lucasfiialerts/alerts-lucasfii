import { NextRequest } from 'next/server';
const PDFParser = require('pdf2json');

// Função auxiliar para decodificar texto com segurança
function safeDecodeURIComponent(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    // Se falhar, retornar string original
    return str;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return Response.json({ error: 'Arquivo deve ser PDF' }, { status: 400 });
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Processar PDF
    const pdfParser = new PDFParser();
    
    const pdfData = await new Promise<any>((resolve, reject) => {
      pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData));
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => resolve(pdfData));
      pdfParser.parseBuffer(buffer);
    });

    // Extrair texto
    let fullText = '';
    const numPages = pdfData.Pages?.length || 0;
    
    pdfData.Pages?.forEach((page: any) => {
      page.Texts?.forEach((text: any) => {
        text.R?.forEach((r: any) => {
          if (r.T) {
            fullText += safeDecodeURIComponent(r.T) + ' ';
          }
        });
      });
      fullText += '\n\n';
    });

    return Response.json({
      success: true,
      text: fullText.trim(),
      pages: numPages,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Erro ao processar PDF:', error);
    return Response.json(
      { error: 'Erro ao processar PDF', details: error.message },
      { status: 500 }
    );
  }
}
