/**
 * Script para testar extração de dados XML dos documentos FNet
 */

const https = require('https');

// Função para baixar e parsear XML do documento
async function baixarDadosDocumento(docId) {
  console.log(`📥 Baixando dados XML do documento ${docId}...`);
  
  return new Promise((resolve, reject) => {
    const url = `https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=${docId}`;
    
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': 'https://fnet.bmfbovespa.com.br/',
        'Origin': 'https://fnet.bmfbovespa.com.br'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Função para extrair informações úteis do XML
function extrairInformacoesXML(xmlContent) {
  console.log('📊 Extraindo informações do XML...');
  
  // Regex patterns para extrair dados importantes
  const patterns = {
    cnpj: /<CNPJ[^>]*>([^<]+)/i,
    razaoSocial: /<RazaoSocial[^>]*>([^<]+)/i,
    dataReferencia: /<DataReferencia[^>]*>([^<]+)/i,
    dataBase: /<DataBase[^>]*>([^<]+)/i,
    
    // Patrimônio e valores
    patrimonio: /<PatrimonioLiquido[^>]*>([^<]+)/i,
    numeroCotas: /<NumeroCotas[^>]*>([^<]+)/i,
    valorPatrimonio: /<ValorPatrimonio[^>]*>([^<]+)/i,
    
    // Receitas e distribuições
    receitaTotal: /<ReceitaTotal[^>]*>([^<]+)/i,
    rendimentos: /<RendimentosDistribuir[^>]*>([^<]+)/i,
    proventosDistribuidos: /<ProventosDistribuidos[^>]*>([^<]+)/i,
    
    // Taxas
    taxaAdministracao: /<TaxaAdministracao[^>]*>([^<]+)/i,
    taxaGestao: /<TaxaGestao[^>]*>([^<]+)/i
  };
  
  const dados = {};
  
  for (const [campo, pattern] of Object.entries(patterns)) {
    const match = xmlContent.match(pattern);
    if (match && match[1]) {
      dados[campo] = match[1].trim();
    }
  }
  
  return dados;
}

// Função para formatar valores monetários
function formatarValor(valor) {
  if (!valor) return 'N/A';
  
  const num = parseFloat(valor.replace(',', '.'));
  if (isNaN(num)) return valor;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(num);
}

// Função para formatar data
function formatarDataBR(data) {
  if (!data) return 'N/A';
  
  // Se está em formato YYYY-MM-DD, converter para DD/MM/YYYY
  if (data.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  
  return data;
}

// Testar com o documento RNGO11
async function testarExtracao() {
  const docId = '1044256';
  
  try {
    console.log('🎯 TESTE DE EXTRAÇÃO DE DADOS XML - RNGO11');
    console.log('=' .repeat(50));
    
    const xmlContent = await baixarDadosDocumento(docId);
    console.log(`✅ XML baixado com sucesso (${xmlContent.length} caracteres)`);
    
    const dados = extrairInformacoesXML(xmlContent);
    
    console.log('\n📊 DADOS EXTRAÍDOS:');
    console.log('=' .repeat(30));
    
    if (dados.cnpj) console.log(`🏢 CNPJ: ${dados.cnpj}`);
    if (dados.razaoSocial) console.log(`🏛️ Razão Social: ${dados.razaoSocial}`);
    if (dados.dataReferencia) console.log(`📅 Data Referência: ${formatarDataBR(dados.dataReferencia)}`);
    if (dados.patrimonio) console.log(`💰 Patrimônio Líquido: ${formatarValor(dados.patrimonio)}`);
    if (dados.numeroCotas) console.log(`📊 Número de Cotas: ${dados.numeroCotas}`);
    if (dados.rendimentos) console.log(`💸 Rendimentos a Distribuir: ${formatarValor(dados.rendimentos)}`);
    if (dados.proventosDistribuidos) console.log(`🎁 Proventos Distribuídos: ${formatarValor(dados.proventosDistribuidos)}`);
    if (dados.taxaAdministracao) console.log(`⚙️ Taxa Administração: ${dados.taxaAdministracao}%`);
    
    console.log('\n📱 EXEMPLO DE MENSAGEM WHATSAPP:');
    console.log('=' .repeat(40));
    
    const mensagem = `🏛️ *FNet B3 - RNGO11 Atualizado*

📋 *Informe Mensal Estruturado*
🏢 *Rio Negro FII*

📊 *DADOS PRINCIPAIS:*
${dados.dataReferencia ? `📅 *Referência:* ${formatarDataBR(dados.dataReferencia)}` : ''}
${dados.patrimonio ? `💰 *Patrimônio:* ${formatarValor(dados.patrimonio)}` : ''}
${dados.numeroCotas ? `📊 *Cotas:* ${dados.numeroCotas}` : ''}
${dados.rendimentos ? `💸 *Rendimentos:* ${formatarValor(dados.rendimentos)}` : ''}
${dados.taxaAdministracao ? `⚙️ *Taxa Admin:* ${dados.taxaAdministracao}%` : ''}

📥 *Dados Detalhados Disponíveis*
_Via FNet B3 - Documentos Oficiais_ ✅`;

    console.log(mensagem);
    
    // Salvar XML para análise
    console.log('\n💾 Salvando XML completo para análise...');
    require('fs').writeFileSync(`/tmp/fnet_${docId}.xml`, xmlContent);
    console.log(`✅ XML salvo em: /tmp/fnet_${docId}.xml`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarExtracao();