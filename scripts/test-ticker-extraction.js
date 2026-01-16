#!/usr/bin/env node
/**
 * Teste de extração de ticker para diferentes fundos
 */

// Função de extração do nome de pregão
function extractTickerFromPregao(nomePregao, descricaoFundo) {
  if (!nomePregao || nomePregao.trim() === '') {
    return extractTickerFromFundo(descricaoFundo);
  }
  
  let cleanName = nomePregao.replace(/^FII\s+/i, '').replace(/^FIAGRO\s+/i, '').trim();
  
  if (cleanName.match(/^[A-Z]{4,5}$/i)) {
    return cleanName.toUpperCase() + '11';
  }
  
  const parts = cleanName.split(/\s+/);
  let ticker = '';
  if (parts.length === 1) {
    ticker = parts[0].substring(0, 4).toUpperCase();
  } else if (parts.length >= 2) {
    const first = parts[0].substring(0, 4);
    const secondInitial = parts[1].charAt(0);
    ticker = (first + secondInitial).substring(0, 4).toUpperCase();
  }
  
  if (ticker && !ticker.match(/\d+$/)) {
    ticker = ticker + '11';
  }
  
  return ticker || 'N/A';
}

function extractTickerFromFundo(descricaoFundo) {
  if (!descricaoFundo) return 'N/A';
  
  const patterns = [
    /^([A-Z]{4})\s+FUNDO/i,
    /FII\s+([A-Z]{4,6})/i,
    /^([A-Z]{4,6})\s+/i,
  ];
  
  for (const pattern of patterns) {
    const match = descricaoFundo.match(pattern);
    if (match && match[1]) {
      const ticker = match[1].toUpperCase();
      return ticker.match(/\d+$/) ? ticker : ticker + '11';
    }
  }
  
  // Pegar iniciais das primeiras palavras significativas
  const words = descricaoFundo
    .split(/\s+/)
    .filter(w => w.length > 2 && !['FUNDO', 'INVESTIMENTO', 'IMOBILIÁRIO', 'RESPONSABILIDADE', 'LIMITADA'].includes(w.toUpperCase()));
  
  if (words.length >= 2) {
    const initials = words.slice(0, 4).map(w => w.charAt(0)).join('').toUpperCase();
    if (initials.length >= 4) {
      return initials.substring(0, 4) + '11';
    }
  }
  
  return 'N/A';
}

// Testes com dados reais da API
const tests = [
  { nome: 'FII HGI CRI', fundo: 'HGI CRÉDITOS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: 'FIAGRO NEXG', fundo: 'NEX CRÉDITO AGRO FUNDO DE INVESTIMENTO NAS CADEIAS PRODUTIVAS DO AGRONEGÓCIO' },
  { nome: 'FII AFHI CRI', fundo: 'AF INVEST CRI FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: 'FII AFHF', fundo: 'AF INVEST REAL ESTATE MULTIESTRATÉGIA FUNDO DE INVESTIMENTO' },
  { nome: 'FII B VAREJO', fundo: 'BRASIL VAREJO FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: 'FII BARZEL', fundo: 'BARZEL CD1 FUNDO DE INVESTIMENTO IMOBILIARIO' },
  { nome: '', fundo: 'ANGRA FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: '', fundo: 'BARZEL BLP FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: '', fundo: 'MXRF FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: '', fundo: 'FIRMA FUNDO DE INVESTIMENTO EM DIREITOS CREDITÓRIOS' },
  { nome: '', fundo: 'BRM FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: 'FII TRUEMULT', fundo: 'FUNDO DE INVESTIMENTO IMOBILIÁRIO TRUE MULTIESTRATÉGIA' },
  { nome: 'FII V2 RENDA', fundo: 'V2 RENDA IMOBILIÁRIA FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: 'FII SUNO', fundo: 'SUNO RECEBÍVEIS IMOBILIÁRIOS FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
  { nome: '', fundo: 'RIO BRAVO MULTIESTRATÉGIA FUNDO DE INVESTIMENTO IMOBILIÁRIO' },
];

console.log('═'.repeat(70));
console.log('🧪 TESTE DE EXTRAÇÃO DE TICKER');
console.log('═'.repeat(70));
console.log();

tests.forEach((t, i) => {
  const result = extractTickerFromPregao(t.nome, t.fundo);
  const hasNomePregao = t.nome ? '✓' : '✗';
  console.log(`${i + 1}. Nome Pregão: "${t.nome || '(vazio)'}" [${hasNomePregao}]`);
  console.log(`   Fundo: ${t.fundo.substring(0, 50)}...`);
  console.log(`   🏷️  Ticker extraído: ${result}`);
  console.log();
});

console.log('═'.repeat(70));
console.log('✅ Teste concluído');
console.log('═'.repeat(70));
