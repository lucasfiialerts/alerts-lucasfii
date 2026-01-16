/**
 * Script para gerar PDFs locais com dados dos documentos FNet
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Função para baixar dados XML do documento
async function baixarDadosDocumento(docId) {
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

// Função para extrair informações do XML
function extrairInformacoesXML(xmlContent) {
  const patterns = {
    nomeFundo: /<NomeFundo[^>]*>([^<]+)/i,
    cnpj: /<CNPJFundo[^>]*>([^<]+)/i,
    competencia: /<Competencia[^>]*>([^<]+)/i,
    qtdCotas: /<QtdCotasEmitidas[^>]*>([^<]+)/i,
    patrimonio: /<PatrimonioLiquido[^>]*>([^<]+)/i,
    valorCota: /<ValorCota[^>]*>([^<]+)/i,
    rendimentos: /<RendimentoBruto[^>]*>([^<]+)/i,
    administrador: /<NomeAdministrador[^>]*>([^<]+)/i,
    dataFuncionamento: /<DataFuncionamento[^>]*>([^<]+)/i,
    publicoAlvo: /<PublicoAlvo[^>]*>([^<]+)/i,
    classificacao: /<Classificacao[^>]*>([^<]+)/i,
    segmentoAtuacao: /<SegmentoAtuacao[^>]*>([^<]+)/i,
    prazoDuracao: /<PrazoDuracao[^>]*>([^<]+)/i,
    logradouro: /<Logradouro[^>]*>([^<]+)/i,
    cidade: /<Cidade[^>]*>([^<]+)/i,
    estado: /<Estado[^>]*>([^<]+)/i,
    telefone: /<Telefone1[^>]*>([^<]+)/i,
    site: /<Site[^>]*>([^<]+)/i,
    email: /<Email[^>]*>([^<]+)/i
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

// Função para formatar valores
function formatarValor(valor) {
  if (!valor || valor === '0') return 'R$ 0,00';
  const num = parseFloat(valor.replace(',', '.'));
  if (isNaN(num)) return valor;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

function formatarNumero(numero) {
  if (!numero) return 'N/A';
  const num = parseFloat(numero.replace(',', '.'));
  if (isNaN(num)) return numero;
  return new Intl.NumberFormat('pt-BR').format(Math.round(num));
}

function formatarData(data) {
  if (!data) return 'N/A';
  if (data.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return data;
}

function formatarCompetencia(data) {
  if (!data) return 'N/A';
  if (data.match(/^\d{4}-\d{2}/)) {
    const [ano, mes] = data.split('-');
    return `${mes}/${ano}`;
  }
  return data;
}

// Função para gerar HTML do relatório
function gerarHTMLRelatorio(dados, codigoFII, tipoDocumento) {
  const agora = new Date().toLocaleString('pt-BR');
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório ${codigoFII} - FNet B3</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 0 20px rgba(0,0,0,0.1); 
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #2c5aa0; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 { 
            color: #2c5aa0; 
            margin: 0; 
            font-size: 28px; 
        }
        .header .subtitle { 
            color: #666; 
            font-size: 16px; 
            margin-top: 5px; 
        }
        .section { 
            margin-bottom: 25px; 
        }
        .section h2 { 
            color: #2c5aa0; 
            border-left: 4px solid #2c5aa0; 
            padding-left: 15px; 
            font-size: 18px; 
            margin-bottom: 15px; 
        }
        .data-grid { 
            display: grid; 
            grid-template-columns: 1fr 2fr; 
            gap: 10px; 
            margin-bottom: 15px; 
        }
        .data-label { 
            font-weight: bold; 
            color: #333; 
        }
        .data-value { 
            color: #666; 
        }
        .highlight { 
            background: #e8f4f8; 
            padding: 15px; 
            border-radius: 5px; 
            border-left: 4px solid #2c5aa0; 
            margin: 15px 0; 
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
            color: #999; 
            font-size: 12px; 
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${codigoFII} - ${dados.nomeFundo || 'Fundo de Investimento Imobiliário'}</h1>
            <div class="subtitle">${tipoDocumento} - Dados Oficiais FNet B3</div>
            <div class="subtitle">Gerado em: ${agora}</div>
        </div>

        <div class="section">
            <h2>📊 Informações Principais</h2>
            <div class="data-grid">
                <div class="data-label">CNPJ:</div>
                <div class="data-value">${dados.cnpj || 'N/A'}</div>
                
                <div class="data-label">Competência:</div>
                <div class="data-value">${formatarCompetencia(dados.competencia)}</div>
                
                <div class="data-label">Data Funcionamento:</div>
                <div class="data-value">${formatarData(dados.dataFuncionamento)}</div>
                
                <div class="data-label">Público Alvo:</div>
                <div class="data-value">${dados.publicoAlvo || 'N/A'}</div>
            </div>
        </div>

        <div class="section">
            <h2>💰 Dados Patrimoniais</h2>
            <div class="highlight">
                <div class="data-grid">
                    <div class="data-label">Patrimônio Líquido:</div>
                    <div class="data-value" style="font-weight: bold; color: #2c5aa0; font-size: 18px;">
                        ${formatarValor(dados.patrimonio)}
                    </div>
                    
                    <div class="data-label">Quantidade de Cotas:</div>
                    <div class="data-value" style="font-weight: bold;">
                        ${formatarNumero(dados.qtdCotas)}
                    </div>
                    
                    ${dados.valorCota ? `
                    <div class="data-label">Valor por Cota:</div>
                    <div class="data-value" style="font-weight: bold;">
                        ${formatarValor(dados.valorCota)}
                    </div>
                    ` : ''}
                    
                    ${dados.rendimentos && dados.rendimentos !== '0' ? `
                    <div class="data-label">Rendimentos:</div>
                    <div class="data-value" style="font-weight: bold; color: #28a745;">
                        ${formatarValor(dados.rendimentos)}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🏢 Classificação e Estratégia</h2>
            <div class="data-grid">
                <div class="data-label">Classificação:</div>
                <div class="data-value">${dados.classificacao || 'N/A'}</div>
                
                <div class="data-label">Segmento de Atuação:</div>
                <div class="data-value">${dados.segmentoAtuacao || 'N/A'}</div>
                
                <div class="data-label">Prazo de Duração:</div>
                <div class="data-value">${dados.prazoDuracao || 'N/A'}</div>
            </div>
        </div>

        <div class="section">
            <h2>📞 Administrador</h2>
            <div class="data-grid">
                <div class="data-label">Nome:</div>
                <div class="data-value">${dados.administrador || 'N/A'}</div>
                
                <div class="data-label">Endereço:</div>
                <div class="data-value">
                    ${dados.logradouro || ''} - ${dados.cidade || ''} / ${dados.estado || 'N/A'}
                </div>
                
                <div class="data-label">Telefone:</div>
                <div class="data-value">${dados.telefone || 'N/A'}</div>
                
                <div class="data-label">Site:</div>
                <div class="data-value">${dados.site || 'N/A'}</div>
                
                <div class="data-label">E-mail:</div>
                <div class="data-value">${dados.email || 'N/A'}</div>
            </div>
        </div>

        <div class="footer">
            <div>Relatório gerado automaticamente com dados oficiais da B3 (FNet)</div>
            <div>Sistema LucasFII Alerts - Documentos Oficiais</div>
            <div>Os dados apresentados são de responsabilidade da B3 e do administrador do fundo</div>
        </div>
    </div>
</body>
</html>`;
}

// Função principal para gerar relatório
async function gerarRelatorioCompleto(docId, codigoFII, tipoDocumento) {
  console.log(`📊 Gerando relatório completo para ${codigoFII} (${docId})...`);
  
  try {
    // Baixar dados XML
    const xmlContent = await baixarDadosDocumento(docId);
    const dados = extrairInformacoesXML(xmlContent);
    
    // Gerar HTML
    const html = gerarHTMLRelatorio(dados, codigoFII, tipoDocumento);
    
    // Salvar HTML
    const htmlPath = path.join('/tmp', `fnet_${codigoFII}_${docId}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    
    console.log(`✅ Relatório HTML gerado: ${htmlPath}`);
    console.log(`🌐 Abra no navegador para visualizar ou converter para PDF`);
    
    // Gerar versão texto para WhatsApp
    const textoResumo = `📊 *RELATÓRIO ${codigoFII}*

🏢 *${dados.nomeFundo || 'Fundo de Investimento Imobiliário'}*
📋 *${tipoDocumento}*

💰 *PATRIMÔNIO:* ${formatarValor(dados.patrimonio)}
📊 *COTAS:* ${formatarNumero(dados.qtdCotas)}
📅 *COMPETÊNCIA:* ${formatarCompetencia(dados.competencia)}
🏛️ *CNPJ:* ${dados.cnpj || 'N/A'}

🔗 *Relatório Completo:* ${htmlPath}

_Dados Oficiais FNet B3_ ✅`;
    
    console.log('\n📱 VERSÃO PARA WHATSAPP:');
    console.log('=' .repeat(40));
    console.log(textoResumo);
    
    return {
      htmlPath,
      textoResumo,
      dados
    };
    
  } catch (error) {
    console.error(`❌ Erro ao gerar relatório: ${error.message}`);
    return null;
  }
}

// Testar geração de relatório
async function testarRelatorio() {
  console.log('📋 GERADOR DE RELATÓRIOS FNET B3');
  console.log('=' .repeat(50));
  
  const resultado = await gerarRelatorioCompleto('1044256', 'RNGO11', 'Informe Mensal Estruturado');
  
  if (resultado) {
    console.log('\n🎉 SUCESSO!');
    console.log(`✅ Relatório HTML: ${resultado.htmlPath}`);
    console.log('💡 Este arquivo pode ser convertido para PDF ou compartilhado diretamente');
  }
}

testarRelatorio();