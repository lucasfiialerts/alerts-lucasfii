/**
 * Script para verificar e habilitar FNet para usuários reais
 */

const { db } = require('./src/db');
const { userTable } = require('./src/db/schema');
const { eq } = require('drizzle-orm');

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários no banco...');
    
    // Buscar todos os usuários
    const usuarios = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
        alertPreferencesFnet: userTable.alertPreferencesFnet,
      })
      .from(userTable);
    
    console.log(`📊 Total de usuários: ${usuarios.length}`);
    console.log('');
    
    usuarios.forEach((user, index) => {
      console.log(`👤 USUÁRIO ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   WhatsApp: ${user.whatsappNumber || 'Não informado'}`);
      console.log(`   WhatsApp Verificado: ${user.whatsappVerified ? '✅' : '❌'}`);
      console.log(`   FNet Ativo: ${user.alertPreferencesFnet ? '✅' : '❌'}`);
      console.log('');
    });
    
    // Verificar quantos têm WhatsApp verificado
    const comWhatsApp = usuarios.filter(u => u.whatsappVerified && u.whatsappNumber);
    console.log(`📱 Usuários com WhatsApp verificado: ${comWhatsApp.length}`);
    
    // Verificar quantos têm FNet ativo
    const comFNet = usuarios.filter(u => u.alertPreferencesFnet);
    console.log(`🏛️ Usuários com FNet ativo: ${comFNet.length}`);
    
    // Se tiver usuários com WhatsApp mas sem FNet, perguntar se quer habilitar
    const candidatos = usuarios.filter(u => u.whatsappVerified && u.whatsappNumber && !u.alertPreferencesFnet);
    
    if (candidatos.length > 0) {
      console.log(`🎯 ${candidatos.length} usuários podem ter FNet habilitado:`);
      
      for (const candidato of candidatos) {
        console.log(`\n👤 Habilitando FNet para: ${candidato.name} (${candidato.whatsappNumber})`);
        
        await db
          .update(userTable)
          .set({ alertPreferencesFnet: true })
          .where(eq(userTable.id, candidato.id));
        
        console.log('✅ FNet habilitado!');
      }
      
      console.log(`\n🎉 ${candidatos.length} usuários agora têm FNet ativo!`);
    } else {
      console.log('⚠️ Nenhum usuário disponível para habilitar FNet');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarUsuarios();