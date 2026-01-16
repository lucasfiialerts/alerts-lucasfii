#!/usr/bin/env node

/**
 * Script simples para enviar alerta FNet direto
 */

async function enviarAlertaFNetSimples() {
  console.log('🚀 Enviando alerta FNet direto...\n');

  // Dados do usuário que sabemos ter FNet ativo
  const usuario = {
    whatsappNumber: '5521998579960',
    name: 'Alan'
  };

  // Mensagem do alerta FNet
  const mensagem = `🏛️ *FNet B3 - Novo Documento*

📋 *Rendimentos e Amortizações*
🏢 *VTLT11 - VOTORANTIM LOGÍSTICA FII*

📄 *Categoria:* Aviso aos Cotistas - Estruturado
📅 *Publicado:* ${new Date().toLocaleDateString('pt-BR')}

VTLT11 divulgou informações sobre rendimentos

🔗 *Acesse o documento:*
https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=1044265

_Alerta FNet B3 - Documentos Oficiais_ ✅`;

  console.log('📱 Enviando para:', usuario.whatsappNumber);
  
  try {
    // Enviar via ULTRAMSG
    const response = await fetch('https://api.ultramsg.com/instance150259/messages/text', {
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

    console.log(`📡 Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Alerta FNet enviado com SUCESSO!');
      console.log(`📱 Para: ${usuario.whatsappNumber}`);
      console.log(`🆔 Message ID: ${result.id || 'N/A'}`);
      console.log('\n🎯 O usuário receberá o alerta do FNet B3 agora!');
    } else {
      const error = await response.text();
      console.log('❌ Erro ao enviar:', error);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

enviarAlertaFNetSimples();