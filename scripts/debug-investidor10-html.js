#!/usr/bin/env node

/**
 * Script de Debug: Verificar HTML do Investidor10
 */

const fs = require('fs');
const path = require('path');

async function verificarHTML() {
  const ticker = 'HGLG11';
  console.log(`🔍 Buscando HTML de ${ticker}...\n`);
  
  try {
    const response = await fetch(`https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}\n`);
    
    if (!response.ok) {
      console.error('❌ Erro HTTP:', response.status);
      return;
    }
    
    const html = await response.text();
    
    // Salvar HTML para inspeção
    const outputPath = path.join(process.cwd(), 'logs', 'investidor10-html.html');
    fs.writeFileSync(outputPath, html);
    
    console.log(`✅ HTML salvo em: ${outputPath}`);
    console.log(`📊 Tamanho: ${(html.length / 1024).toFixed(2)} KB\n`);
    
    // Procurar por padrões de comunicados
    console.log('🔍 Buscando padrões no HTML...\n');
    
    const patterns = [
      /communication-card/gi,
      /relatório\s+gerencial/gi,
      /comunicado/gi,
      /informe\s+mensal/gi,
      /card-date/gi,
      /link_comunicado/gi,
    ];
    
    patterns.forEach(pattern => {
      const matches = html.match(pattern);
      console.log(`   ${pattern.source}: ${matches ? matches.length + ' ocorrências' : 'não encontrado'}`);
    });
    
    // Procurar alternativas
    console.log('\n🔍 Buscando estruturas alternativas...\n');
    
    const altPatterns = [
      /<div[^>]*comunicado/gi,
      /<a[^>]*href="[^"]*comunicado/gi,
      /<div[^>]*class="[^"]*card/gi,
      /class="[^"]*document/gi,
      /class="[^"]*report/gi,
    ];
    
    altPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        console.log(`   ✅ ${pattern.source}: ${matches.length} ocorrências`);
        console.log(`      Primeira: ${matches[0].substring(0, 100)}...`);
      } else {
        console.log(`   ❌ ${pattern.source}: não encontrado`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarHTML().catch(console.error);
