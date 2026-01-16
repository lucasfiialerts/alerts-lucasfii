#!/usr/bin/env node

/**
 * Script para verificar qual usuário tem o WhatsApp +21995461604
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkWhatsAppUser() {
  console.log('🔍 Verificando usuário com WhatsApp +21995461604...\n');

  try {
    const response = await fetch(`${baseURL}/api/debug/user-preferences`);
    
    if (!response.ok) {
      console.log('❌ Erro ao buscar preferências dos usuários');
      return;
    }

    const result = await response.json();
    
    console.log('📊 Verificando usuários...\n');

    // Buscar usuário específico
    const targetUser = result.users.find(user => {
      // Como não temos o campo whatsappNumber na resposta, vamos checar por ID
      // Sabemos que o usuário que recebeu é o alanrochaarg2001@gmail.com (mTqkl1psaUNhKnwZ3nEMAOkY7Y6EpLS2)
      return user.id === 'mTqkl1psaUNhKnwZ3nEMAOkY7Y6EpLS2';
    });

    if (targetUser) {
      console.log('👤 Usuário encontrado:');
      console.log(`   Email: ${targetUser.email}`);
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   📋 Relatórios e Eventos: ${targetUser.alertPreferencesReports ? '✅ ATIVO' : '❌ INATIVO'}`);
      
      if (!targetUser.alertPreferencesReports) {
        console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
        console.log('   O usuário tem "Relatórios e Eventos" INATIVO mas recebeu o relatório');
        console.log('   Isso indica que o filtro não está funcionando corretamente');
      } else {
        console.log('\n✅ Usuário tem preferência ativa, ok receber relatório');
      }
    } else {
      console.log('❌ Usuário não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkWhatsAppUser().catch(console.error);