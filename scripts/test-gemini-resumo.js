/**
 * Teste do sistema de resumo IA com Gemini
 */

require('dotenv').config();
const { gerarResumoInteligente } = require('./gemini-resumo');

// Dados de exemplo do RNGO11
const dadosExemplo = {
  nomeFundo: 'RIO NEGRO FUNDO DE INVESTIMENTO IMOBILIÁRIO',
  cnpj: '41.650.310/0001-39',
  competencia: '2025-10-01',
  patrimonio: '207077703.2',
  qtdCotas: '2137413.83457222',
  administrador: 'ID CORRETORA DE TITULOS E VALORES MOBILIARIOS S.A.',
  classificacao: 'Multiestratégia',
  segmentoAtuacao: 'Multicategoria',
  publicoAlvo: 'Investidor Profissional'
};

async function testarResumoIA() {
  console.log('🤖 TESTE DO SISTEMA DE RESUMO IA');
  console.log('=' .repeat(50));
  console.log(`📊 Testando com dados do RNGO11...`);
  
  try {
    const resumo = await gerarResumoInteligente(
      dadosExemplo,
      'Informe Mensal Estruturado',
      'RNGO11'
    );
    
    console.log('\n📱 RESUMO GERADO PELA IA:');
    console.log('=' .repeat(40));
    console.log(resumo);
    console.log('=' .repeat(40));
    
    console.log('\n✅ Teste concluído com sucesso!');
    console.log('💡 Este resumo será enviado no WhatsApp junto com os dados');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarResumoIA();