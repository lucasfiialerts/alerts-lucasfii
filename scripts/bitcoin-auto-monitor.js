#!/usr/bin/env node

/**
 * Monitor de Bitcoin - Execução única
 * Chamado pelo cron job (EasyCron) que define os horários
 * Verifica Bitcoin e envia alertas para usuários com preferência ativa
 */

const VARIATION_THRESHOLD = 4; // 4%

class BitcoinAutoMonitor {
  async checkAndAlert() {
    const now = new Date();
    console.log(`🔍 [${now.toLocaleTimeString('pt-BR')}] Verificando Bitcoin...`);

    try {
      // Buscar dados do Bitcoin
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
        signal: AbortSignal.timeout(10000)
      });

      const data = await response.json();
      const bitcoin = data.bitcoin;
      const variation = bitcoin.usd_24h_change || 0;

      console.log(`   💰 $${bitcoin.usd.toLocaleString()} | ${variation.toFixed(2)}%`);

      // Verificar se precisa enviar alerta
      const shouldAlert = Math.abs(variation) >= VARIATION_THRESHOLD;

      if (shouldAlert) {
        console.log(`   🚨 VARIAÇÃO SIGNIFICATIVA: ${variation.toFixed(2)}%`);
        await this.sendAlerts(bitcoin);
      } else {
        console.log(`   📊 Variação normal: ${variation.toFixed(2)}%`);
      }

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }

  async sendAlerts(bitcoinData) {
    try {
      // Lista de usuários com Bitcoin ativo (em produção viria do banco)
      const eligibleUsers = [
        {
          email: 'alanrochaarg2001@gmail.com',
          whatsappNumber: '5521998579960',
          alertPreferencesBitcoin: true
        }
      ];

      console.log(`   📤 Enviando para ${eligibleUsers.length} usuário(s)...`);

      const variation = bitcoinData.usd_24h_change || 0;
      const isPositive = variation > 0;
      const emoji = isPositive ? '📈' : '📉';
      const trend = isPositive ? 'SUBIU' : 'DESCEU';

      const message = `₿ *Bitcoin Alert - Monitor Automático*

${emoji} *O Bitcoin ${trend} ${Math.abs(variation).toFixed(2)}%*

💰 *Preço: $${bitcoinData.usd.toLocaleString()}*
📊 *Variação 24h: ${variation.toFixed(2)}%*

⏰ *${new Date().toLocaleString('pt-BR')}*

_Monitor automático ativo_ 🤖`;

      for (const user of eligibleUsers) {
        try {
          const response = await fetch(`https://api.ultramsg.com/instance150259/messages/chat?token=nvqi9mrsetwaozo7`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: user.whatsappNumber,
              body: message
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ ${user.email} - Enviado`);
          } else {
            console.log(`   ❌ ${user.email} - Erro ${response.status}`);
          }
        } catch (error) {
          console.log(`   ❌ ${user.email} - ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Erro no envio: ${error.message}`);
    }
  }
}

// Executar verificação única
(async () => {
  const monitor = new BitcoinAutoMonitor();
  await monitor.checkAndAlert();
  process.exit(0);
})();
