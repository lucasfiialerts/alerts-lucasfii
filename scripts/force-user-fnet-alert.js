#!/usr/bin/env node

/**
 * Script para forçar envio FNet para usuário específico do banco
 */

async function forceUserFNetAlert() {
  console.log('🚀 Forçando alerta FNet para usuário específico...\n');

  try {
    // Dados reais do usuário do banco
    const userData = {
      id: 'mTqkl1psaUNhKnwZ3nEMAOkY7Y6EpLS2',
      email: 'alanrochaarg2001@gmail.com',
      whatsappNumber: '5521998579960',
      whatsappVerified: true,
      alertPreferencesFnet: true,
      followedFIIs: ['TRBL11', 'VTLT11', 'BTLG11', 'RBVA11', 'HGBS11', 'GGRC11', 'HGLG11', 'MXRF11', 'HGRE11']
    };

    console.log(`👤 Usuário: ${userData.email}`);
    console.log(`📱 WhatsApp: ${userData.whatsappNumber}`);
    console.log(`📊 FIIs seguidos: ${userData.followedFIIs.join(', ')}`);

    // Documento FNet real de hoje
    const fnetDocument = {
      fundoName: 'VTLT11 - VOTORANTIM LOGÍSTICA FII',
      documentType: 'Rendimentos e Amortizações',
      category: 'Aviso aos Cotistas - Estruturado',
      dataEntrega: '19/11/2024',
      documentId: 1044265,
      description: 'VTLT11 divulgou informações sobre rendimentos'
    };

    // Verificar se o usuário segue algum dos FIIs do documento
    const relevantForUser = userData.followedFIIs.some(fii => 
      fnetDocument.fundoName.includes(fii) || 
      fnetDocument.fundoName.includes(fii.replace('11', ''))
    );

    console.log(`\n📄 Documento: ${fnetDocument.fundoName}`);
    console.log(`🎯 Relevante para usuário: ${relevantForUser ? 'SIM' : 'NÃO'}`);

    if (!relevantForUser) {
      console.log('⚠️ Documento não é relevante para os FIIs do usuário, mas enviando mesmo assim para teste...');
    }

    // Formatar mensagem
    const message = `🏛️ *FNet B3 - Novo Documento*

📋 *${fnetDocument.documentType}*
🏢 *${fnetDocument.fundoName}*

📄 *Categoria:* ${fnetDocument.category}
📅 *Publicado:* ${fnetDocument.dataEntrega}

${fnetDocument.description}

🔗 *Acesse o documento:*
https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${fnetDocument.documentId}

_Alerta FNet B3 - Documentos Oficiais_ ✅`;

    console.log('\n📱 Enviando via ULTRAMSG...');

    // Enviar via ULTRAMSG usando credenciais corretas
    const response = await fetch('https://api.ultramsg.com/instance150259/messages/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'nvqi9mrsetwaozo7',
        to: userData.whatsappNumber,
        body: message
      })
    });

    console.log(`📡 Status ULTRAMSG: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ ALERTA FNET ENVIADO COM SUCESSO!');
      console.log(`📱 Para: ${userData.whatsappNumber}`);
      console.log(`👤 Usuário: ${userData.email}`);
      console.log(`🆔 Message ID: ${result.id || 'N/A'}`);
      console.log(`📋 Sent: ${result.sent || 'N/A'}`);
    } else {
      const error = await response.text();
      console.log('❌ Erro ULTRAMSG:', error);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

forceUserFNetAlert();