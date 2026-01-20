/**
 * Processador de Relatórios Investidor10
 * Versão adaptada para rodar no Vercel
 */

interface ProcessorOptions {
  limite?: number;
  enviar: boolean;
}

interface ProcessorResult {
  fiis_processados: number;
  mensagens_enviadas: number;
  usuarios_ativos: number;
}

interface Usuario {
  id: string;
  email: string;
  name: string;
  whatsappNumber: string;
  fiisAcompanhados: string[];
}

/**
 * Busca usuários com alertas Investidor10 ativos
 */
async function buscarUsuariosAtivos(): Promise<Usuario[]> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('🔍 Buscando usuários ativos em:', baseURL);
    
    const response = await fetch(`${baseURL}/api/debug/user-preferences`);
    if (!response.ok) {
      console.error('❌ Erro ao buscar preferências:', response.status);
      return [];
    }
    
    const result = await response.json();
    
    // Filtrar usuários com alertPreferencesFnet (Investidor10) ativo
    const usuariosFNet = result.users.filter((user: any) => user.alertPreferencesFnet === true);
    console.log(`✅ ${usuariosFNet.length} usuários com alertas Investidor10 ativos`);
    
    const usuariosCompletos: Usuario[] = [];
    
    for (const user of usuariosFNet) {
      try {
        const detailsResponse = await fetch(`${baseURL}/api/test-user-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (detailsResponse.ok) {
          const userDetails = await detailsResponse.json();
          
          if (userDetails.whatsappVerified && userDetails.whatsappNumber) {
            usuariosCompletos.push({
              id: userDetails.id,
              email: userDetails.email,
              name: userDetails.name || userDetails.email.split('@')[0],
              whatsappNumber: userDetails.whatsappNumber,
              fiisAcompanhados: userDetails.followedFIIs || []
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao buscar detalhes do usuário ${user.id}`);
      }
    }
    
    console.log(`✅ ${usuariosCompletos.length} usuários com WhatsApp verificado`);
    return usuariosCompletos;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    return [];
  }
}

/**
 * Busca FIIs acompanhados pelos usuários
 */
function buscarFIIsAcompanhados(usuarios: Usuario[]): string[] {
  const fiisSet = new Set<string>();
  
  for (const usuario of usuarios) {
    for (const fii of usuario.fiisAcompanhados) {
      fiisSet.add(fii);
    }
  }
  
  const fiis = Array.from(fiisSet);
  console.log(`📊 ${fiis.length} FIIs únicos sendo acompanhados`);
  return fiis;
}

export async function processarRelatoriosInvestidor10(
  options: ProcessorOptions
): Promise<ProcessorResult> {
  console.log('🔄 Iniciando processamento Investidor10...');
  
  try {
    // 1. Buscar usuários ativos
    const usuarios = await buscarUsuariosAtivos();
    
    if (usuarios.length === 0) {
      console.log('⚠️ Nenhum usuário ativo. Nada para processar.');
      return {
        fiis_processados: 0,
        mensagens_enviadas: 0,
        usuarios_ativos: 0
      };
    }
    
    // 2. Buscar FIIs acompanhados
    const fiis = buscarFIIsAcompanhados(usuarios);
    
    if (fiis.length === 0) {
      console.log('❌ Nenhum FII sendo acompanhado pelos usuários.');
      return {
        fiis_processados: 0,
        mensagens_enviadas: 0,
        usuarios_ativos: usuarios.length
      };
    }
    
    // 3. Determinar quais FIIs processar
    const fiisProcessar = options.limite ? fiis.slice(0, options.limite) : fiis;
    
    console.log(`📊 FIIs a processar: ${fiisProcessar.length}`);
    console.log(`🔄 Modo: ${options.enviar ? '📤 ENVIAR ALERTAS' : '👁️ PREVIEW (sem enviar)'}`);
    
    // TODO: Implementar processamento de cada FII
    // Por enquanto retornar contadores básicos
    
    return {
      fiis_processados: fiisProcessar.length,
      mensagens_enviadas: 0, // TODO: implementar envio
      usuarios_ativos: usuarios.length
    };
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    throw error;
  }
}
