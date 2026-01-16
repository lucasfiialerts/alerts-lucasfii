/**
 * Servidor simples para hospedar relatórios FNet temporariamente
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const REPORTS_DIR = '/tmp';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (pathname.startsWith('/report/')) {
    // Servir relatórios FNet
    const reportName = pathname.replace('/report/', '');
    const filePath = path.join(REPORTS_DIR, reportName);
    
    if (fs.existsSync(filePath) && reportName.includes('fnet_')) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Relatório não encontrado');
    }
  } else if (pathname === '/') {
    // Lista de relatórios disponíveis
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.includes('fnet_') && f.endsWith('.html'))
      .map(f => {
        const stats = fs.statSync(path.join(REPORTS_DIR, f));
        return {
          name: f,
          size: Math.round(stats.size / 1024),
          modified: stats.mtime.toLocaleString('pt-BR')
        };
      });
    
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatórios FNet B3</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        h1 { color: #2c5aa0; text-align: center; }
        .report-list { list-style: none; padding: 0; }
        .report-item { 
            background: #f8f9fa; 
            margin: 10px 0; 
            padding: 15px; 
            border-radius: 5px; 
            border-left: 4px solid #2c5aa0; 
        }
        .report-link { 
            color: #2c5aa0; 
            text-decoration: none; 
            font-weight: bold; 
            font-size: 16px; 
        }
        .report-link:hover { text-decoration: underline; }
        .report-meta { color: #666; font-size: 12px; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Relatórios FNet B3 Disponíveis</h1>
        <ul class="report-list">
            ${files.map(f => `
                <li class="report-item">
                    <a href="/report/${f.name}" class="report-link" target="_blank">
                        📋 ${f.name.replace('fnet_', '').replace('.html', '').replace('_', ' - Documento ')}
                    </a>
                    <div class="report-meta">
                        Tamanho: ${f.size} KB | Modificado: ${f.modified}
                    </div>
                </li>
            `).join('')}
        </ul>
        ${files.length === 0 ? '<p style="text-align: center; color: #666;">Nenhum relatório disponível</p>' : ''}
    </div>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Página não encontrada');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor de relatórios FNet rodando em http://localhost:${PORT}`);
  console.log(`📋 Acesse http://localhost:${PORT} para ver todos os relatórios`);
  console.log(`📊 Relatório RNGO11: http://localhost:${PORT}/report/fnet_RNGO11_1044256.html`);
  console.log('');
  console.log('💡 Este servidor permite visualizar e compartilhar os relatórios gerados');
  console.log('🔗 Os links podem ser enviados no WhatsApp para acesso aos PDFs');
  console.log('');
  console.log('⏹️  Pressione Ctrl+C para parar o servidor');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Parando servidor de relatórios...');
  server.close(() => {
    console.log('✅ Servidor parado');
    process.exit(0);
  });
});

module.exports = { server, PORT };