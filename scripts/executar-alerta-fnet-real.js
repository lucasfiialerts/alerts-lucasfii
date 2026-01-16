/**
 * Script para executar um alerta FNet REAL para usuários do banco de dados
 * Busca usuários com alertPreferencesFnet=true e WhatsApp verificado
 */

const https = require('https');

// Módulo de resumo IA
const { gerarResumoInteligente } = require('./gemini-resumo');

// Função para buscar usuários reais do banco com FNet ativo
async function buscarUsuariosFNetAtivos() {
  console.log('👥 Buscando usuários com FNet ativo no banco...');
  
  try {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // 1. Buscar usuários com FNet ativo
    const response = await fetch(`${baseURL}/api/debug/user-preferences`);
    const result = await response.json();
    
    const usuariosFNet = result.users.filter(user => user.alertPreferencesFnet === true);
    console.log(`🎯 Encontrados ${usuariosFNet.length} usuários com FNet ativo`);
    
    // 2. Para cada usuário, buscar detalhes completos
    const usuariosCompletos = [];
    
    for (const user of usuariosFNet) {
      try {
        const detailsResponse = await fetch(`${baseURL}/api/test-user-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (detailsResponse.ok) {
          const userDetails = await detailsResponse.json();
          
          // Só adicionar se o usuário tem WhatsApp verificado
          if (userDetails.whatsappVerified && userDetails.whatsappNumber) {
            usuariosCompletos.push({
              id: userDetails.id,
              email: userDetails.email,
              name: userDetails.name || userDetails.email.split('@')[0],
              whatsappNumber: userDetails.whatsappNumber,
              whatsappVerified: userDetails.whatsappVerified,
              fiisAcompanhados: userDetails.followedFIIs || []
            });
            
            console.log(`   ✅ ${userDetails.email} - WhatsApp: ${userDetails.whatsappNumber} - FIIs: ${userDetails.followedFIIs?.length || 0}`);
          } else {
            console.log(`   ⚠️ ${user.email} - WhatsApp não verificado ou não definido`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro ao buscar detalhes do usuário ${user.email}: ${error.message}`);
      }
    }
    
    return usuariosCompletos;
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuários do banco:', error);
    return [];
  }
}

// Função para buscar documentos reais do FNet B3
async function buscarDocumentosFNetReal() {
  console.log('🌐 Buscando documentos REAIS do FNet B3...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'fnet.bmfbovespa.com.br',
      path: '/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=30',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://fnet.bmfbovespa.com.br/',
        'Origin': 'https://fnet.bmfbovespa.com.br'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`📊 Status API FNet: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            console.log(`✅ API FNet respondeu: ${json.data?.length || 0} documentos`);
            resolve(json);
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Erro ao parsear JSON: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout na requisição'));
    });

    req.end();
  });
}

// Cache para mapeamento automático (evita múltiplas consultas)
let cacheB3FIIs = null;

// Função para buscar lista completa de FIIs da B3 (automático)
async function buscarFIIsB3Automatico() {
  if (cacheB3FIIs) {
    return cacheB3FIIs;
  }
  
  try {
    console.log('🔄 Buscando lista completa de FIIs da B3...');
    
    // API da B3 para listar todos os FIIs ativos
    const response = await fetch('https://sistemaswebb3-listados.b3.com.br/fundsProxy/fundsCall/GetListedFundsSector/eyJsYW5ndWFnZSI6InB0LWJyIiwicGFnZU51bWJlciI6MSwicGFnZVNpemUiOjUwMH0=');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.results) {
        const mapeamento = {};
        
        data.results.forEach(fii => {
          // Mapear nome do fundo para código
          const nomeCompleto = fii.companyName || '';
          const codigo = fii.issuingCompany || '';
          
          if (nomeCompleto && codigo) {
            // Extrair palavras-chave do nome para mapeamento
            const palavrasChave = nomeCompleto
              .toUpperCase()
              .replace(/FUNDO DE INVESTIMENTO.*$/i, '')
              .replace(/FII.*$/i, '')
              .replace(/\sS\.A\..*$/i, '')
              .trim()
              .split(' ')
              .filter(p => p.length > 2); // Só palavras com mais de 2 caracteres
            
            // Mapear cada palavra-chave significativa
            palavrasChave.forEach(palavra => {
              if (palavra.length > 3) { // Só palavras relevantes
                mapeamento[palavra] = codigo;
              }
            });
            
            // Mapear nome completo também
            const nomeSimplificado = nomeCompleto
              .toUpperCase()
              .replace(/FUNDO DE INVESTIMENTO.*$/i, '')
              .replace(/FII.*$/i, '')
              .trim();
            
            if (nomeSimplificado) {
              mapeamento[nomeSimplificado] = codigo;
            }
          }
        });
        
        cacheB3FIIs = mapeamento;
        console.log(`✅ Mapeamento automático criado com ${Object.keys(mapeamento).length} entradas`);
        return mapeamento;
      }
    }
  } catch (error) {
    console.log(`⚠️ Erro no mapeamento automático: ${error.message}, usando mapeamento manual`);
  }
  
  return null;
}

// Função para extrair código FII ou nome do fundo (AUTOMÁTICA + MANUAL)
async function extrairCodigoFII(descricaoFundo, informacoesAdicionais) {
  // Primeiro, tentar extrair das informações adicionais (mais confiável)
  if (informacoesAdicionais && informacoesAdicionais.trim()) {
    const info = informacoesAdicionais.replace(/[;]/g, '').trim();
    if (info.match(/^[A-Z]{4,8}$/)) {
      return info;
    }
  }
  
  // Padrões conhecidos de códigos FII
  const patterns = [
    /([A-Z]{4}\d{2})/g,     // VTLT11, SAPI11, AGRO11, etc.
    /([A-Z]{3,6}11)/g,      // Padrão genérico com 11
  ];
  
  for (const pattern of patterns) {
    const matches = descricaoFundo.match(pattern);
    if (matches && matches[0]) {
      return matches[0].toUpperCase();
    }
  }
  
  // Se não encontrou código, tentar extrair nome do fundo de forma mais inteligente
  const fundoLimpo = descricaoFundo
    .replace(/FUNDO DE INVESTIMENTO.*$/i, '')
    .replace(/FII.*$/i, '')
    .replace(/\s-\s.*$/, '')
    .trim();
  
  // 🤖 MAPEAMENTO AUTOMÁTICO - Tentar buscar da B3 primeiro
  try {
    const mapeamentoAutomatico = await buscarFIIsB3Automatico();
    
    if (mapeamentoAutomatico) {
      // Tentar match direto
      const fundoUpper = fundoLimpo.toUpperCase();
      
      // Buscar correspondência exata
      if (mapeamentoAutomatico[fundoUpper]) {
        console.log(`🤖 Match automático encontrado: ${fundoUpper} → ${mapeamentoAutomatico[fundoUpper]}`);
        return mapeamentoAutomatico[fundoUpper];
      }
      
      // Buscar correspondência parcial
      for (const [nome, codigo] of Object.entries(mapeamentoAutomatico)) {
        if (fundoUpper.includes(nome) || nome.includes(fundoUpper)) {
          console.log(`🤖 Match automático parcial: ${fundoUpper} → ${codigo} (via ${nome})`);
          return codigo;
        }
      }
    }
  } catch (error) {
    console.log(`⚠️ Erro no mapeamento automático: ${error.message}`);
  }
  
  // 📋 MAPEAMENTO MANUAL - Fallback para casos conhecidos
  const mapeamentoFundos = {
    'BTG PACTUAL AGRO': 'AGRO11',
    'TELLUS': 'TLLUS11', 
    'VOTORANTIM': 'VTLT11',
    'KINEA': 'KNIP11',
    'SUNO': 'SUNO11',
    'TORRE': 'TRBL11',
    'B.OND': 'AGRO11',
    'INSUMOS AGRO': 'AGRO11',
    'RIO NEGRO': 'RNGO11',
    'POSITIVO III': 'POSI11',
    'SUPER FARMS': 'SFARMS11',
    'TARUMÃ': 'TARUMA11',
    'MAUÁ': 'MAUA11',
    'TERRA BRASILIS': 'TRBL11',
    'XP LOG': 'XPML11',
    'CSHG': 'HGRE11',
    'PLURAL': 'PLRI11',
    'HABITAT': 'HBTT11'
  };
  
  // Buscar correspondência manual
  for (const [nome, codigo] of Object.entries(mapeamentoFundos)) {
    if (fundoLimpo.toUpperCase().includes(nome.toUpperCase())) {
      console.log(`📋 Match manual encontrado: ${fundoLimpo} → ${codigo}`);
      return codigo;
    }
  }
  
  // Se ainda não encontrou, retornar as primeiras palavras do nome
  const palavras = fundoLimpo.split(' ').slice(0, 2).join(' ');
  console.log(`❓ Nenhum match encontrado para: ${fundoLimpo}, usando: ${palavras || 'GERAL'}`);
  return palavras || 'GERAL';
}

// Função para baixar dados XML do documento FNet
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
        if (res.statusCode === 200 && res.headers['content-type']?.includes('xml')) {
          resolve(data);
        } else {
          reject(new Error(`Status ${res.statusCode} ou conteúdo não é XML`));
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
  const patterns = {
    nomeFundo: /<NomeFundo[^>]*>([^<]+)/i,
    cnpj: /<CNPJFundo[^>]*>([^<]+)/i,
    competencia: /<Competencia[^>]*>([^<]+)/i,
    qtdCotas: /<QtdCotasEmitidas[^>]*>([^<]+)/i,
    patrimonio: /<PatrimonioLiquido[^>]*>([^<]+)/i,
    valorCota: /<ValorCota[^>]*>([^<]+)/i,
    rendimentos: /<RendimentoBruto[^>]*>([^<]+)/i,
    rendimentosLiquidos: /<RendimentoLiquido[^>]*>([^<]+)/i,
    taxaAdministracao: /<TaxaAdministracao[^>]*>([^<]+)/i,
    administrador: /<NomeAdministrador[^>]*>([^<]+)/i
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
function formatarValorBR(valor) {
  if (!valor || valor === '0' || valor === '0.0') return 'R$ 0,00';
  
  const num = parseFloat(valor.replace(',', '.'));
  if (isNaN(num)) return valor;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(num);
}

// Função para formatar data brasileira
function formatarDataBR(data) {
  if (!data) return 'N/A';
  
  // Se está em formato YYYY-MM-DD, converter para MM/YYYY
  if (data.match(/^\d{4}-\d{2}-\d{2}/)) {
    const [ano, mes] = data.split('-');
    return `${mes}/${ano}`;
  }
  
  return data;
}

// Função para formatar números com separadores
function formatarNumero(numero) {
  if (!numero) return 'N/A';
  
  const num = parseFloat(numero.replace(',', '.'));
  if (isNaN(num)) return numero;
  
  return new Intl.NumberFormat('pt-BR').format(Math.round(num));
}

// Função para formatar mensagem WhatsApp com resumo IA (sem relatórios)
async function formatarMensagemWhatsApp(documento) {
  const codigoFII = await extrairCodigoFII(documento.descricaoFundo, documento.informacoesAdicionais);
  const dataRef = documento.dataReferencia || 'N/A';
  const dataPub = documento.dataEntrega?.split(' ')[0] || 'N/A';
  
  let resumoIA = '';
  
  // Tentar baixar dados XML do documento e gerar resumo IA
  try {
    console.log(`📥 Baixando dados detalhados do documento ${documento.id}...`);
    const xmlContent = await baixarDadosDocumento(documento.id);
    const dados = extrairInformacoesXML(xmlContent);
    
    // Gerar resumo IA
    try {
      const resumoGerado = await gerarResumoInteligente(dados, documento.tipoDocumento, codigoFII);
      resumoIA = `\n${resumoGerado}\n`;
      console.log(`🤖 Resumo IA gerado com sucesso`);
    } catch (error) {
      console.log(`⚠️ Erro ao gerar resumo IA: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`⚠️ Não foi possível baixar dados detalhados: ${error.message}`);
  }
  
  return `🏛️ *FNet B3 - Novo Documento*

📋 *${documento.tipoDocumento.trim()}*
🏢 *${codigoFII}*

📄 *Fundo:* ${documento.descricaoFundo.substring(0, 40)}${documento.descricaoFundo.length > 40 ? '...' : ''}
📅 *Referência:* ${dataRef}
🕐 *Publicado:* ${dataPub}
📂 *Categoria:* ${documento.categoriaDocumento}${resumoIA}
_Alerta FNet B3 - Documentos Oficiais_ ✅`;
}

// Função para simular envio WhatsApp
async function simularEnvioWhatsApp(telefone, mensagem) {
  console.log(`\n📱 ENVIANDO WHATSAPP PARA: ${telefone}`);
  console.log('═'.repeat(60));
  console.log(mensagem);
  console.log('═'.repeat(60));
  
  // Se as variáveis de ambiente ULTRAMSG estiverem configuradas, tentar envio real
  if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
    console.log('🌐 Detectadas credenciais ULTRAMSG, tentando envio real...');
    
    try {
      const response = await enviarUltraMsgReal(telefone, mensagem);
      if (response) {
        console.log('✅ Mensagem enviada com SUCESSO via ULTRAMSG!');
      } else {
        console.log('❌ Falha no envio via ULTRAMSG');
      }
    } catch (error) {
      console.log('❌ Erro no envio ULTRAMSG:', error.message);
    }
  } else {
    console.log('⚠️ ULTRAMSG não configurado (ULTRAMSG_TOKEN e ULTRAMSG_INSTANCE)');
    console.log('📱 Esta mensagem seria enviada se as credenciais estivessem configuradas');
  }
  
  return true;
}

// Função para envio real via ULTRAMSG
async function enviarUltraMsgReal(telefone, mensagem) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      to: telefone,
      body: mensagem
    });
    
    const options = {
      hostname: 'api.ultramsg.com',
      path: `/${process.env.ULTRAMSG_INSTANCE}/messages/chat`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    // Adicionar token na query string (formato ULTRAMSG)
    options.path += `?token=${process.env.ULTRAMSG_TOKEN}`;
    
    const req = https.request(options, (res) => {
      console.log(`📊 Status ULTRAMSG: ${res.statusCode}`);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log('📋 Resposta ULTRAMSG:', response);
          resolve(res.statusCode === 200 && response.sent === 'true');
        } catch (e) {
          console.log('📄 Resposta ULTRAMSG (raw):', responseData);
          resolve(res.statusCode === 200);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Erro ULTRAMSG:', e.message);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Função principal
async function executarAlertaFNetReal() {
  try {
    console.log('🚀 EXECUTANDO ALERTA FNET REAL');
    console.log('==============================');
    console.log('⏰ Data/Hora:', new Date().toLocaleString('pt-BR'));
    
    // 1. Buscar usuários reais do banco com FNet ativo
    const usuariosAtivos = await buscarUsuariosFNetAtivos();
    
    if (usuariosAtivos.length === 0) {
      console.log('❌ Nenhum usuário com FNet ativo encontrado no banco');
      return;
    }
    
    console.log(`� Processando ${usuariosAtivos.length} usuário(s) com FNet ativo\n`);
    
    // 2. Buscar documentos reais da API FNet
    const fnetResponse = await buscarDocumentosFNetReal();
    
    if (!fnetResponse || !fnetResponse.data || fnetResponse.data.length === 0) {
      console.log('❌ Nenhum documento encontrado na API FNet');
      return;
    }
    
    console.log(`📄 Total de documentos encontrados: ${fnetResponse.data.length}`);
    
    // 2. Filtrar documentos relevantes
    const documentosRelevantes = [
      ...fnetResponse.data.filter(d => d.tipoDocumento.includes('Rendimentos')), // Prioridade 1: Rendimentos
      ...fnetResponse.data.filter(d => d.categoriaDocumento === 'Assembleia'),   // Prioridade 2: Assembleias
      ...fnetResponse.data.filter(d => d.tipoDocumento.includes('Informe Mensal')), // Prioridade 3: Informes
      ...fnetResponse.data.filter(d => d.tipoDocumento.includes('Informe Trimestral'))
    ];
    
    // Remover duplicatas
    const documentosUnicos = documentosRelevantes.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );
    
    console.log(`🎯 Documentos relevantes encontrados: ${documentosUnicos.length}`);
    
    if (documentosUnicos.length === 0) {
      console.log('⚠️ Nenhum documento relevante encontrado');
      return;
    }

    // 3. Processar cada usuário
    let totalAlertas = 0;
    
    for (const usuario of usuariosAtivos) {
      console.log(`\n👤 Processando usuário: ${usuario.name} (${usuario.email})`);
      console.log(`📱 WhatsApp: ${usuario.whatsappNumber}`);
      console.log(`📊 FIIs Acompanhados: ${usuario.fiisAcompanhados.join(', ')}`);
      
      // Filtrar documentos APENAS dos FIIs que o usuário acompanha (usando loop para async/await)
      const documentosFiltrados = [];
      
      for (const doc of documentosUnicos) {
        const codigoFII = await extrairCodigoFII(doc.descricaoFundo, doc.informacoesAdicionais);
        
        // Verificar se o código extraído corresponde exatamente a algum FII seguido
        const fiiMatch = usuario.fiisAcompanhados.some(fii => {
          // Verificação exata do código
          if (codigoFII === fii) return true;
          
          // Verificação sem o "11" para códigos como VTLT vs VTLT11
          if (codigoFII === fii.replace('11', '') || fii === codigoFII + '11') return true;
          
          // Verificação se o nome do fundo contém o código do FII
          const codigoSemNumeros = fii.replace(/\d+$/, ''); // Remove números do final
          return doc.descricaoFundo.toUpperCase().includes(codigoSemNumeros.toUpperCase());
        });
        
        if (fiiMatch) {
          console.log(`   ✅ Match encontrado: ${codigoFII} corresponde a FII seguido pelo usuário`);
          documentosFiltrados.push(doc);
        } else {
          console.log(`   ❌ ${codigoFII} não está na lista de FIIs do usuário: ${usuario.fiisAcompanhados.join(', ')}`);
        }
      }
      
      console.log(`📋 Documentos filtrados para ${usuario.name}: ${documentosFiltrados.length}`);
      
      // Enviar alertas (máximo 3 por usuário)
      const documentosParaEnvio = documentosFiltrados.slice(0, 3);
      
      if (documentosParaEnvio.length > 0) {
        console.log(`📤 Enviando ${documentosParaEnvio.length} alertas para ${usuario.name}...\n`);
        
        for (let i = 0; i < documentosParaEnvio.length; i++) {
          const doc = documentosParaEnvio[i];
          const codigoFII = await extrairCodigoFII(doc.descricaoFundo, doc.informacoesAdicionais);
          
          console.log(`📄 DOCUMENTO ${i + 1}/${documentosParaEnvio.length}:`);
          console.log(`   ID: ${doc.id}`);
          console.log(`   FII: ${codigoFII}`);
          console.log(`   Tipo: ${doc.tipoDocumento}`);
          console.log(`   Categoria: ${doc.categoriaDocumento}`);
          console.log(`   Data Ref: ${doc.dataReferencia}`);
          console.log(`   Data Pub: ${doc.dataEntrega}`);
          
          const mensagem = await formatarMensagemWhatsApp(doc);
          await simularEnvioWhatsApp(usuario.whatsappNumber, mensagem);
          
          totalAlertas++;
          
          // Aguardar 1 segundo entre envios
          if (i < documentosParaEnvio.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        console.log(`📭 Nenhum documento relevante para ${usuario.name}`);
      }
    }
    
    console.log('\n✅ ALERTAS FNET EXECUTADOS COM SUCESSO!');
    console.log('');
    console.log('📊 RESUMO:');
    console.log(`   • ${fnetResponse.data.length} documentos encontrados na API`);
    console.log(`   • ${documentosUnicos.length} documentos relevantes`);
    console.log(`   • ${usuariosAtivos.length} usuários processados`);
    console.log(`   • ${totalAlertas} alertas enviados`);
    console.log('');
    console.log('🎯 PRÓXIMO PASSO:');
    console.log('   Configure as variáveis ULTRAMSG_TOKEN e ULTRAMSG_INSTANCE para envio real!');
    
  } catch (error) {
    console.error('❌ ERRO na execução:', error.message);
  }
}

// Executar o teste
console.log('🔥 ALERTA FNET B3 REAL - ENVIO WHATSAPP');
console.log('========================================');
executarAlertaFNetReal();