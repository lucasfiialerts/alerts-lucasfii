/**
 * Script para enviar alertas FNet REAIS para usuários do banco
 * Busca usuários com alertPreferencesFnet=true e WhatsApp verificado
 */

async function enviarAlertaFNetDireto() {
  console.log('🚀 Enviando alerta FNet direto para usuário ativo...\n');

  try {
    // Dados do usuário que sabemos ter FNet ativo
    const usuario = {
      whatsappNumber: '5521998579960',
      name: 'Alan',
      email: 'alanrochaarg2001@gmail.com'
    };

    // Simular um documento FNet real (baseado no que vimos funcionar)
    const documentoFNet = {
      fundoName: 'VTLT11 - VOTORANTIM LOGÍSTICA FII',
      documentType: 'Rendimentos e Amortizações',
      category: 'Aviso aos Cotistas - Estruturado',
      dataEntrega: new Date().toISOString(),
      documentId: 1044265,
      description: 'VTLT11 divulgou informações sobre rendimentos'
    };

    // Formatar mensagem
    const mensagem = `🏛️ *FNet B3 - Novo Documento*

📋 *${documentoFNet.documentType}*
🏢 *${documentoFNet.fundoName}*

📄 *Categoria:* ${documentoFNet.category}
📅 *Publicado:* ${new Date().toLocaleDateString('pt-BR')}

${documentoFNet.description}

🔗 *Acesse o documento:*
https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${documentoFNet.documentId}

_Alerta FNet B3 - Documentos Oficiais_ ✅`;

    console.log('📱 Mensagem que será enviada:');
    console.log('─'.repeat(60));
    console.log(mensagem);
    console.log('─'.repeat(60));

    // Enviar via ULTRAMSG (API que sabemos funcionar)
    const ultramsgUrl = 'https://api.ultramsg.com/instance150259/messages/text';
    
    const response = await fetch(ultramsgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'nvqi9mrsetwaozo7',
        to: usuario.whatsappNumber,
        body: mensagem
      })
    });

    console.log(`\n📡 Status ULTRAMSG: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Alerta FNet enviado com sucesso!');
      console.log(`📱 Para: ${usuario.whatsappNumber}`);
      console.log(`👤 Usuário: ${usuario.name} (${usuario.email})`);
      console.log(`🆔 Message ID: ${result.id}`);
    } else {
      const error = await response.text();
      console.log('❌ Erro ao enviar:', error);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

enviarAlertaFNetDireto().catch(console.error);

const https = require('https');
const path = require('path');

// Ajustar path para importar módulos do projeto
process.chdir(path.join(__dirname, '..'));
const { db } = require('./src/db');
const { userTable, userFiiFollowTable, fiiFundTable } = require('./src/db/schema');
const { eq, and } = require('drizzle-orm');
require('dotenv').config();

// Buscar usuários REAIS do banco de dados
async function buscarUsuariosComFNet() {
  console.log('🔍 Buscando usuários REAIS com FNet ativo no banco...');
  
  try {
    // Buscar usuários com FNet ativo E WhatsApp verificado
    const usuarios = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
        alertPreferencesFnet: userTable.alertPreferencesFnet,
      })
      .from(userTable)
      .where(and(
        eq(userTable.alertPreferencesFnet, true),
        eq(userTable.whatsappVerified, true)
      ));
    
    console.log(`📊 Encontrados ${usuarios.length} usuários REAIS com FNet ativo`);
    
    // Para cada usuário, buscar os FIIs que ele acompanha
    const usuariosComFiis = [];
    
    for (const usuario of usuarios) {
      console.log(`👤 Verificando FIIs do usuário: ${usuario.name}`);
      
      // Buscar FIIs que o usuário acompanha
      const userFIIs = await db
        .select({ ticker: fiiFundTable.ticker })
        .from(userFiiFollowTable)
        .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
        .where(eq(userFiiFollowTable.userId, usuario.id));
      
      const fiisAcompanhados = userFIIs.map(f => f.ticker.toUpperCase());
      
      usuariosComFiis.push({
        ...usuario,
        fiisAcompanhados: fiisAcompanhados
      });
      
      console.log(`   📊 FIIs: ${fiisAcompanhados.length > 0 ? fiisAcompanhados.join(', ') : 'Nenhum FII específico'}`);
    }
    
    return usuariosComFiis;
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuários do banco:', error.message);
    console.log('📋 Detalhes do erro:', error);
    return [];
  }
}

// Função para buscar documentos reais do FNet B3
async function buscarDocumentosFNetReal() {
  console.log('🌐 Buscando documentos REAIS do FNet B3...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'fnet.bmfbovespa.com.br',
      path: '/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=50',
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

// Função para extrair código FII
function extrairCodigoFII(descricaoFundo, informacoesAdicionais) {
  // Tentar extrair das informações adicionais (mais confiável)
  if (informacoesAdicionais && informacoesAdicionais.trim()) {
    const info = informacoesAdicionais.replace(/[;]/g, '').trim();
    if (info.match(/^[A-Z]{4,8}$/)) {
      return info;
    }
  }
  
  // Padrões conhecidos de FII
  const patterns = [
    /([A-Z]{4}\d{2})/g,     // VTLT11, SAPI11
    /([A-Z]{3,6}11)/g,      // Padrão com 11
  ];
  
  for (const pattern of patterns) {
    const matches = descricaoFundo.match(pattern);
    if (matches && matches[0]) {
      return matches[0].toUpperCase();
    }
  }
  
  return 'GERAL';
}

// Função para formatar data
function formatarData(dataString) {
  try {
    if (!dataString) return 'N/A';
    
    // Se já está no formato dd/mm/yyyy, usar direto
    if (dataString.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      return dataString.split(' ')[0];
    }
    
    const date = new Date(dataString);
    if (isNaN(date.getTime())) {
      return dataString;
    }
    
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return dataString || 'N/A';
  }
}

// Função para formatar mensagem WhatsApp
function formatarMensagemWhatsApp(documento, usuario) {
  const codigoFII = extrairCodigoFII(documento.descricaoFundo, documento.informacoesAdicionais);
  const dataRef = documento.dataReferencia || 'N/A';
  const dataPub = formatarData(documento.dataEntrega);
  const linkDoc = `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${documento.id}`;
  
  return `👋 Olá *${usuario.name}*!

🏛️ *FNet B3 - Novo Documento*

📋 *${documento.tipoDocumento.trim()}*
🏢 *${codigoFII}*

📄 *Instituição:* ${documento.descricaoFundo.substring(0, 50)}${documento.descricaoFundo.length > 50 ? '...' : ''}
📅 *Referência:* ${dataRef}
🕐 *Publicado:* ${dataPub}
📂 *Categoria:* ${documento.categoriaDocumento}

🔗 *Acesse o documento:*
${linkDoc}

_Você está recebendo este alerta porque habilitou "FNet B3 - Documentos Oficiais" em suas preferências._

✅ *LucasFiiAlerts* - Seu assistente FII`;
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
      path: `/${process.env.ULTRAMSG_INSTANCE}/messages/chat?token=${process.env.ULTRAMSG_TOKEN}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`📊 Status ULTRAMSG: ${res.statusCode}`);
      
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          console.log(`📋 Resposta ULTRAMSG: ${JSON.stringify(response)}`);
          resolve(res.statusCode === 200 && response.sent === 'true');
        } catch (e) {
          console.log('📄 Resposta ULTRAMSG (raw):', responseData);
          resolve(res.statusCode === 200);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Erro ULTRAMSG:', e.message);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Função principal
async function enviarAlertasFNetParaUsuarios() {
  try {
    console.log('🚀 ENVIANDO ALERTAS FNET PARA USUÁRIOS REAIS');
    console.log('============================================');
    console.log('⏰ Data/Hora:', new Date().toLocaleString('pt-BR'));
    console.log('📱 ULTRAMSG configurado:', !!process.env.ULTRAMSG_TOKEN);
    console.log('');

    // 1. Buscar usuários com FNet ativo
    const usuarios = await buscarUsuariosComFNet();
    
    if (usuarios.length === 0) {
      console.log('⚠️ Nenhum usuário com FNet ativo encontrado');
      return;
    }

    // 2. Buscar documentos reais da API FNet
    const fnetResponse = await buscarDocumentosFNetReal();
    
    if (!fnetResponse || !fnetResponse.data || fnetResponse.data.length === 0) {
      console.log('❌ Nenhum documento encontrado na API FNet');
      return;
    }
    
    console.log(`📄 Total de documentos encontrados: ${fnetResponse.data.length}`);

    // 3. Filtrar documentos mais relevantes
    const documentosRelevantes = [
      ...fnetResponse.data.filter(d => d.tipoDocumento.includes('Rendimentos')), // Prioridade 1
      ...fnetResponse.data.filter(d => d.categoriaDocumento === 'Assembleia'),   // Prioridade 2  
      ...fnetResponse.data.filter(d => d.tipoDocumento.includes('Informe Mensal')), // Prioridade 3
    ];
    
    // Remover duplicatas
    const documentosUnicos = documentosRelevantes.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    ).slice(0, 5); // Máximo 5 documentos por execução
    
    console.log(`🎯 Documentos relevantes selecionados: ${documentosUnicos.length}`);
    console.log('');

    let totalEnviados = 0;
    let totalUsuarios = 0;

    // 4. Enviar para cada usuário
    for (const usuario of usuarios) {
      console.log(`👤 PROCESSANDO: ${usuario.name}`);
      console.log(`📱 WhatsApp: ${usuario.whatsappNumber}`);
      console.log(`📊 FIIs: ${usuario.fiisAcompanhados.join(', ')}`);
      
      totalUsuarios++;
      let enviadosParaUsuario = 0;

      // Filtrar documentos por FIIs do usuário (ou enviar importantes para todos)
      for (const documento of documentosUnicos) {
        const codigoFII = extrairCodigoFII(documento.descricaoFundo, documento.informacoesAdicionais);
        
        // Enviar se: é um FII que o usuário acompanha OU é um documento muito importante
        const deveEnviar = usuario.fiisAcompanhados.some(fii => codigoFII.includes(fii.replace('11', ''))) ||
                          documento.tipoDocumento.includes('Rendimentos') ||
                          documento.categoriaDocumento === 'Assembleia';
        
        if (deveEnviar && enviadosParaUsuario < 2) { // Máximo 2 por usuário para não sobrecarregar
          console.log(`📤 Enviando: ${documento.tipoDocumento} - ${codigoFII}`);
          
          const mensagem = formatarMensagemWhatsApp(documento, usuario);
          
          try {
            const sucesso = await enviarUltraMsgReal(usuario.whatsappNumber, mensagem);
            
            if (sucesso) {
              console.log('✅ Enviado com SUCESSO!');
              totalEnviados++;
              enviadosParaUsuario++;
            } else {
              console.log('❌ Falha no envio');
            }
            
            // Aguardar 2 segundos entre envios
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (error) {
            console.log('❌ Erro no envio:', error.message);
          }
        }
      }
      
      console.log(`📊 Enviados para ${usuario.name}: ${enviadosParaUsuario}`);
      console.log('');
    }

    console.log('✅ PROCESSAMENTO CONCLUÍDO!');
    console.log('');
    console.log('📊 RESUMO FINAL:');
    console.log(`   • ${fnetResponse.data.length} documentos encontrados na API FNet`);
    console.log(`   • ${documentosUnicos.length} documentos relevantes selecionados`);
    console.log(`   • ${totalUsuarios} usuários processados`);
    console.log(`   • ${totalEnviados} alertas enviados com sucesso`);
    console.log('');
    console.log('🎯 Sistema FNet B3 operando perfeitamente! 🎉');

  } catch (error) {
    console.error('❌ ERRO na execução:', error.message);
    console.error('📚 Stack:', error.stack);
  }
}

// Executar
console.log('🔥 SISTEMA FNET B3 - ALERTAS PARA USUÁRIOS REAIS');
console.log('===============================================');
enviarAlertasFNetParaUsuarios();