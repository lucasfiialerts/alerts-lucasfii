# Integração com FNet B3 - Sistema Oficial de Informações FII

## Visão Geral

O **FNet (Fundo de Informações)** é o sistema oficial da B3 (Brasil Bolsa Balcão) que centraliza todas as informações regulamentares dos Fundos de Investimento Imobiliário (FIIs). Esta documentação apresenta os resultados da pesquisa sobre a API não documentada do FNet e suas possibilidades de integração com nosso sistema de alertas.

---

## O que é o FNet

O FNet é a **fonte primária e oficial** de todos os dados regulamentares sobre FIIs no Brasil. Diferente de APIs terceirizadas como BRAPI (que focam em cotações), o FNet contém:

- Documentos regulamentares completos
- Informes financeiros estruturados
- Histórico oficial de rendimentos
- Comunicados e eventos corporativos
- Dados de assembleia e governança

---

## Descobertas da API

### Endpoint Principal
```
https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados
```

### Parâmetros Obrigatórios
```
tipoBusca: 0 (busca geral)
tipoDocumento: 1 (FIIs)
d: número inteiro (contador de paginação)
s: número inteiro (offset/início da página)
l: número inteiro (limite de resultados por página)
```

### Exemplo de Chamada
```bash
curl -s "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=10" \
  --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

---

## Estrutura dos Dados

### Resposta JSON
```json
{
  "draw": 1,
  "recordsFiltered": 26,
  "recordsTotal": 26,
  "data": [
    {
      "id": 1044255,
      "descricaoFundo": "Positivo III Fundo de Investimento Imobiliário - FII",
      "categoriaDocumento": "Informes Periódicos",
      "tipoDocumento": "Informe Mensal Estruturado",
      "dataReferencia": "10/2025",
      "dataEntrega": "19/11/2025 00:00",
      "status": "AC",
      "descricaoStatus": "Ativo com visualização"
    }
  ]
}
```

### Campos Principais
- **id**: Identificador único do documento
- **descricaoFundo**: Nome completo do FII
- **categoriaDocumento**: Categoria do documento
- **tipoDocumento**: Tipo específico do documento
- **dataReferencia**: Período de referência dos dados
- **dataEntrega**: Data de publicação
- **status**: Status do documento (AC = Ativo)

---

## Tipos de Documentos Disponíveis

### 1. Informes Periódicos
- **Informe Mensal Estruturado**: Dados financeiros mensais detalhados
- **Informe Trimestral Estruturado**: Relatórios trimestrais com análises profundas
- **Relatório Gerencial**: Análises de gestão e performance

### 2. Documentos Regulamentares
- **Regulamento**: Regulamento completo do fundo
- **Prospecto**: Documentos de oferta pública
- **Instrumento Particular de Constituição/Encerramento**
- **Instrumento Particular de Alteração do Regulamento**

### 3. Comunicações Oficiais
- **Aviso ao Mercado**: Comunicados importantes
- **AGE**: Assembleia Geral Extraordinária
- **Outros Comunicados Não Considerados Fatos Relevantes**

### 4. Informações Financeiras
- **Rendimentos e Amortizações**: Dados oficiais de distribuições
- **Relatórios financeiros estruturados**

---

## Categorias de Documentos

1. **Assembleia**: Documentos de assembleias gerais
2. **Atos de Deliberação do Administrador**: Decisões da gestão
3. **Aviso aos Cotistas - Estruturado**: Comunicados estruturados
4. **Comunicado ao Mercado**: Avisos públicos
5. **Informes Periódicos**: Relatórios regulares
6. **Oferta Pública de Distribuição de Cotas**: IPOs e follow-ons
7. **Regulamento**: Documentos constitutivos
8. **Relatórios**: Relatórios diversos de gestão

---

## Comparação com Fontes Atuais

### BRAPI (Nossa fonte atual)
✅ **Vantagens**:
- Dados de cotação em tempo real
- API documentada e estável
- Fácil integração
- Dados históricos de preços

❌ **Limitações**:
- Apenas dados básicos de cotação
- Sem informações regulamentares
- Sem dados oficiais de rendimentos

### FNet B3
✅ **Vantagens**:
- **Fonte oficial** da B3
- Dados regulamentares completos
- Informes financeiros estruturados
- Histórico oficial de rendimentos
- Eventos corporativos
- Documentos legais completos

❌ **Limitações**:
- API não documentada
- Dados principalmente em português
- Requer processamento de documentos PDF
- Sem dados de cotação em tempo real

### relatoriosfiis.com.br
- Usa FNet como fonte (scraping)
- Interface amigável para visualização
- Processa dados do FNet para facilitar consulta
- Não é fonte primária

---

## Oportunidades de Integração

### 1. Alertas de Rendimentos
```javascript
// Exemplo de integração para alertas de rendimentos
const alertasRendimento = {
  fonte: "FNet B3",
  tipoDocumento: "Rendimentos e Amortizações",
  dados: {
    valorRendimento: "R$ 0,85",
    dataComRendimento: "15/12/2025",
    dataExRendimento: "16/12/2025",
    dataPagamento: "30/12/2025"
  }
}
```

### 2. Alertas de Eventos Corporativos
```javascript
// Exemplo para assembleias e eventos
const alertasEventos = {
  fonte: "FNet B3",
  tipoDocumento: "AGE",
  evento: {
    tipo: "Assembleia Geral Extraordinária",
    data: "20/01/2026",
    assuntos: ["Alteração do regulamento", "Aprovação de investimento"]
  }
}
```

### 3. Relatórios Mensais Estruturados
```javascript
// Dados financeiros mensais
const relatorioMensal = {
  patrimonio: "R$ 150.000.000",
  numeroCotas: "10.000.000",
  valorPatrimonialCota: "R$ 15,00",
  receitas: "R$ 2.500.000",
  despesas: "R$ 800.000"
}
```

---

## Implementação Técnica

### 1. Autenticação
- Não requer autenticação
- Recomenda-se usar User-Agent de browser
- Rate limiting não identificado

### 2. Processamento de Dados
```javascript
// Estrutura sugerida para processamento
class FNetIntegration {
  async buscarDocumentos(offset = 0, limit = 10) {
    const params = new URLSearchParams({
      tipoBusca: '0',
      tipoDocumento: '1',
      d: '1',
      s: offset.toString(),
      l: limit.toString()
    });
    
    const response = await fetch(`https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return response.json();
  }
  
  async processarRendimentos(documentos) {
    return documentos
      .filter(doc => doc.tipoDocumento === 'Rendimentos e Amortizações')
      .map(doc => this.extrairDadosRendimento(doc));
  }
}
```

### 3. Filtros Específicos
```javascript
// Filtros por tipo de informação
const filtros = {
  rendimentos: doc => doc.tipoDocumento === 'Rendimentos e Amortizações',
  assembleias: doc => doc.categoriaDocumento === 'Assembleia',
  informesMensais: doc => doc.tipoDocumento === 'Informe Mensal Estruturado',
  informesTrimestrais: doc => doc.tipoDocumento === 'Informe Trimestral Estruturado'
};
```

---

## Benefícios para o Sistema Atual

### 1. Expansão dos Alertas
- **Alertas de Rendimentos**: Notificações automáticas sobre distribuições
- **Alertas de Eventos**: AGEs, alterações regulamentares
- **Alertas de Relatórios**: Novos informes mensais/trimestrais

### 2. Dados Mais Ricos
- Complementar cotações BRAPI com dados fundamentalistas
- Histórico oficial de rendimentos
- Análise de performance baseada em dados oficiais

### 3. Diferencial Competitivo
- Única fonte oficial de dados regulamentares
- Informações não disponíveis em APIs terceirizadas
- Dados em primeira mão da B3

---

## Próximos Passos

### Fase 1: Prova de Conceito
1. ✅ Mapeamento da API (concluído)
2. ⏳ Implementação de cliente básico
3. ⏳ Teste de extração de rendimentos
4. ⏳ Validação de dados com fontes conhecidas

### Fase 2: Integração Parcial
1. Implementar alertas de rendimentos
2. Adicionar eventos corporativos
3. Criar dashboard de informações regulamentares

### Fase 3: Integração Completa
1. Processamento de documentos PDF
2. Análise de texto para extração de dados
3. Sistema completo de alertas baseado em FNet

---

## Considerações Técnicas

### Desafios
- **API não documentada**: Requer engenharia reversa
- **Processamento de PDF**: Muitos dados estão em documentos PDF
- **Volume de dados**: Grande quantidade de documentos históricos
- **Idioma**: Dados em português requerem NLP específico

### Riscos
- **Mudanças na API**: Sem garantia de estabilidade
- **Rate limiting**: Possível implementação futura
- **Termos de uso**: Verificar políticas de uso da B3

### Mitigação
- Implementar cache robusto
- Sistema de fallback para BRAPI
- Monitoramento de disponibilidade
- Logs detalhados para debugging

---

## Conclusão

A integração com o FNet B3 representa uma **oportunidade única** de diferenciar nosso sistema de alertas FII. Ao acessar a fonte oficial de dados da B3, podemos oferecer informações que nenhum concorrente possui, criando valor real para nossos usuários.

O FNet não substitui nossa integração BRAPI (para cotações), mas a **complementa perfeitamente** com dados regulamentares oficiais, histórico de rendimentos e eventos corporativos.

**Recomendação**: Iniciar implementação em Fase 1 para validar viabilidade técnica e valor para usuários.

---

## Endpoints de Alertas Implementados

### 1. Alertas de Relatórios (sem IA)

**Endpoint:** `POST /api/cron/fnet-relatorios`

Busca e envia alertas de relatórios da API FNET B3 **sem resumo de IA**. Apenas notifica sobre a disponibilidade de novos documentos.

**Tipos de relatórios:**
- Relatório Gerencial
- Outros Relatórios
- Relatório de Agência de Rating

**Parâmetros (body JSON):**
```json
{
  "hoursAgo": 24,   // Período de busca em horas (padrão: 24)
  "testMode": false // Se true, não envia mensagens reais
}
```

**Headers:**
- `x-webhook-secret`: Chave de segurança

**Script de teste:**
```bash
npm run fnet:relatorios       # Buscar relatórios
npm run fnet:relatorios:test  # Buscar últimas 24h
node scripts/test-fnet-relatorios.js 72  # Últimas 72 horas
```

### 2. Alertas FNET com IA

**Endpoint:** `POST /api/cron/fnet-alerts`

Busca documentos e gera alertas com descrições. Para relatórios com resumo de IA, use o endpoint de resumos.

---

*Documento criado em: 19/11/2025*  
*Última atualização: 15/01/2026*  
*Responsável: Equipe de Desenvolvimento*