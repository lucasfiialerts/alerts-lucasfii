# 📄 Sistema de Relatórios Investidor10 com IA

Sistema automatizado que busca **Relatórios Gerenciais** de FIIs no site Investidor10, extrai o texto dos PDFs, gera resumos inteligentes com **Gemini IA** e envia alertas via **WhatsApp** para usuários que ativaram `alertPreferencesFnet`.

## 🚀 Como Usar

### 1. Testar um Relatório (sem enviar)

```bash
# Busca, resume com IA e mostra prévia
npm run investidor10:relatorio KNRI11

# ou diretamente
node scripts/relatorio-investidor10-ia.js KNRI11
```

**Saída:**
- ✅ Busca comunicados no Investidor10
- ✅ Identifica Relatório Gerencial mais recente  
- ✅ Baixa o PDF seguindo redirects
- ✅ Extrai texto do PDF (pdfreader)
- ✅ Gera resumo executivo com Gemini IA
- ✅ Mostra prévia da mensagem WhatsApp
- ℹ️ **NÃO envia** para usuários

### 2. Enviar para Usuários Reais

```bash
# Busca, resume e ENVIA via WhatsApp
npm run investidor10:enviar KNRI11 -- --enviar

# ou diretamente
node scripts/relatorio-investidor10-ia.js KNRI11 --enviar
```

**Critérios de envio:**
- ✅ Usuário tem `alertPreferencesFnet = true`
- ✅ WhatsApp verificado (`whatsappVerified = true`)
- ✅ Número de WhatsApp cadastrado
- ⚙️ Filtra por FIIs acompanhados (se configurado)

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# IA Gemini
GOOGLE_GENERATIVE_AI_API_KEY=sua_api_key_aqui

# WhatsApp ZAPI
ZAPI_INSTANCE_ID=sua_instance_id
ZAPI_TOKEN=seu_token

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📊 Fluxo do Sistema

```
┌─────────────────────────────────────────────┐
│  1. Buscar Comunicados (Investidor10)      │
│     https://investidor10.com.br/fiis/XXXX  │
└──────────────────┬──────────────────────────┘
                   │ Scraping com cheerio
                   ▼
┌─────────────────────────────────────────────┐
│  2. Filtrar "Relatório Gerencial"          │
│     - Título, Data, URL                    │
└──────────────────┬──────────────────────────┘
                   │ Seguir redirects
                   ▼
┌─────────────────────────────────────────────┐
│  3. Baixar PDF do FNet B3                   │
│     https://fnet.bmfbovespa.com.br/...     │
└──────────────────┬──────────────────────────┘
                   │ Baixar buffer
                   ▼
┌─────────────────────────────────────────────┐
│  4. Extrair Texto (pdfreader)               │
│     ~20-30k caracteres                     │
└──────────────────┬──────────────────────────┘
                   │ Texto completo
                   ▼
┌─────────────────────────────────────────────┐
│  5. Resumir com IA (Gemini 2.5 Flash Lite) │
│     gemini-resumo.js                       │
└──────────────────┬──────────────────────────┘
                   │ Resumo executivo
                   ▼
┌─────────────────────────────────────────────┐
│  6. Buscar Usuários (alertPreferencesFnet) │
│     /api/debug/user-preferences            │
└──────────────────┬──────────────────────────┘
                   │ Lista de usuários
                   ▼
┌─────────────────────────────────────────────┐
│  7. Enviar WhatsApp (ZAPI)                  │
│     - Resumo IA                            │
│     - Link do documento                    │
└─────────────────────────────────────────────┘
```

## 📝 Formato da Mensagem

```markdown
*📊 Relatório Gerencial - KNRI11*
📅 Data: 02/12/2025

## Resumo Executivo: [Nome do FII]

[Parágrafo introdutório gerado pela IA com visão geral]

### Pontos de Destaque para Investidores:

*   🏗️ **Desenvolvimento:** [Análise de obras/projetos]
*   📊 **Vacância:** [Análise de ocupação]
*   💰 **Rendimentos:** [Análise de distribuições]

🤖 Resumo gerado pela IA da LucasFII Alerts

🔗 Documento completo: [link_fnet]
```

## 🧩 Arquivos do Sistema

```
scripts/
├── relatorio-investidor10-ia.js     ← Script principal
├── gemini-resumo.js                 ← Módulo de IA (compartilhado)
├── extrair-comunicados-investidor10.js  ← Scraper base
└── executar-alerta-fnet-real.js     ← Sistema FNET existente

package.json
└── scripts:
    ├── investidor10:relatorio       ← Testar sem enviar
    └── investidor10:enviar          ← Buscar + Resumir + Enviar
```

## 🆚 Comparação com FNET

| Característica | **Investidor10** | **FNET B3** |
|---|---|---|
| Fonte de Dados | Scraping (Investidor10) | API Oficial B3 |
| PDFs | FNet (via redirect) | FNet (direto) |
| Tipos de Doc | Rel. Gerencial, Informe | Todos os tipos |
| Scraping | Sim (cheerio) | Não (JSON) |
| Estabilidade | ⚠️ Depende do HTML | ✅ API estável |
| **Recomendação** | Complementar | **Principal** |

## 💡 Quando Usar

✅ **Use Investidor10:**
- Testar relatórios específicos rapidamente
- Quando o Investidor10 organiza melhor os docs
- Como backup do sistema FNET

✅ **Use FNET B3:**
- **Sistema principal** (oficial e estável)
- Automação via cron
- Todos os tipos de documentos
- Já integrado com IA

## 🤖 Automação (Cron)

Para automatizar o envio diário/semanal:

```bash
# Adicionar ao crontab (exemplo: diariamente às 19h)
0 19 * * * cd /caminho/projeto && node scripts/relatorio-investidor10-ia.js KNRI11 --enviar >> logs/investidor10.log 2>&1

# Para múltiplos FIIs
0 19 * * * cd /caminho/projeto && for fii in KNRI11 HGLG11 BTLG11; do node scripts/relatorio-investidor10-ia.js $fii --enviar; sleep 60; done
```

## 🔍 Troubleshooting

**Erro: "Link do PDF não encontrado"**
- O Investidor10 mudou estrutura HTML
- Verificar [relatorio-investidor10-ia.js](scripts/relatorio-investidor10-ia.js#L85-L135)

**Erro: "pdf is not a function"**
- Biblioteca `pdfreader@3.0.1` instalada? (`npm install`)

**Warnings do PDF**
- Warnings "TODO: graphic state operator SMask" são normais
- Não afetam a extração de texto

**Resumo vazio ou incompleto**
- PDF pode ter texto em imagens (OCR necessário)
- Verificar `logs/investidor10-comunicados.json`

## 📚 Documentação Relacionada

- [FNET B3 Integration](./FNET_B3_INTEGRATION.md) - Sistema principal oficial
- [FII Alerts Documentation](./FII_ALERTS_DOCUMENTATION.md) - Visão geral
- [Gemini IA](../scripts/gemini-resumo.js) - Módulo de resumos

## ✅ Status

- ✅ Scraping Investidor10 funcionando
- ✅ Extração de PDF com pdfreader
- ✅ Resumo IA (Gemini 2.5 Flash Lite)
- ✅ Envio WhatsApp (ZAPI)
- ✅ Filtro por FIIs acompanhados
- ✅ Integração com banco de usuários

---

**Desenvolvido para LucasFII Alerts** 🚀
