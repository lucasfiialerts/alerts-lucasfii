# FNet B3 API - Documentação Técnica

## Endpoints Descobertos

### Pesquisa de Documentos
```
GET https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados
```

#### Parâmetros Obrigatórios
| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `tipoBusca` | integer | Tipo de busca (0 = geral) | `0` |
| `tipoDocumento` | integer | Tipo de documento (1 = FII) | `1` |
| `d` | integer | Draw counter para paginação | `1` |
| `s` | integer | Start - offset da paginação | `0` |
| `l` | integer | Length - limite de resultados | `10` |

#### Headers Recomendados
```
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

#### Resposta
```json
{
  "draw": 1,
  "recordsFiltered": 26,
  "recordsTotal": 26,
  "data": [...documentos]
}
```

---

## Estrutura de Documento

### Campos Principais
```json
{
  "id": 1044255,
  "descricaoFundo": "Positivo III Fundo de Investimento Imobiliário - FII",
  "categoriaDocumento": "Informes Periódicos",
  "tipoDocumento": "Informe Mensal Estruturado ",
  "especieDocumento": "",
  "dataReferencia": "10/2025",
  "dataEntrega": "19/11/2025 00:00",
  "status": "AC",
  "descricaoStatus": "Ativo com visualização",
  "analisado": "N",
  "situacaoDocumento": "A",
  "assuntos": null,
  "altaPrioridade": false,
  "formatoDataReferencia": "2",
  "versao": 1,
  "modalidade": "AP",
  "descricaoModalidade": "Apresentação",
  "nomePregao": "",
  "informacoesAdicionais": ";",
  "arquivoEstruturado": "",
  "formatoEstruturaDocumento": null,
  "nomeAdministrador": null,
  "cnpjAdministrador": null,
  "cnpjFundo": null,
  "idFundo": null,
  "idTemplate": 0,
  "idSelectNotificacaoConvenio": null,
  "idSelectItemConvenio": 0,
  "indicadorFundoAtivoB3": false,
  "idEntidadeGerenciadora": null,
  "ofertaPublica": null,
  "numeroEmissao": null,
  "tipoPedido": null,
  "dda": null,
  "codSegNegociacao": null,
  "fundoOuClasse": null,
  "nomePrimeiraVisualizacao": null
}
```

### Dicionário de Campos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | integer | Identificador único do documento |
| `descricaoFundo` | string | Nome completo do FII |
| `categoriaDocumento` | string | Categoria do documento |
| `tipoDocumento` | string | Tipo específico do documento |
| `dataReferencia` | string | Período de referência (MM/AAAA) |
| `dataEntrega` | string | Data/hora de publicação |
| `status` | string | Status do documento (AC, etc.) |
| `descricaoStatus` | string | Descrição legível do status |
| `situacaoDocumento` | string | Situação (A = Ativo) |
| `versao` | integer | Versão do documento |
| `modalidade` | string | Modalidade (AP = Apresentação) |

---

## Tipos de Documento Mapeados

### Informes Periódicos
```
"Informe Mensal Estruturado "
"Informe Trimestral Estruturado"
"Relatório Gerencial"
```

### Documentos Regulamentares
```
"Instrumento Particular de Constituição/Encerramento do Fundo"
"Instrumento Particular de Alteração do Regulamento"
"Prospecto"
```

### Comunicações
```
"Aviso ao Mercado"
"Outros Comunicados Não Considerados Fatos Relevantes "
"AGE"
```

### Informações Financeiras
```
"Rendimentos e Amortizações"
```

---

## Categorias de Documento Mapeadas

```
"Assembleia"
"Atos de Deliberação do Administrador"
"Aviso aos Cotistas - Estruturado"
"Comunicado ao Mercado"
"Informes Periódicos"
"Oferta Pública de Distribuição de Cotas"
"Regulamento"
"Relatórios"
```

---

## Status de Documentos

### Códigos de Status
| Código | Descrição |
|--------|-----------|
| `AC` | Ativo com visualização |
| `A` | Ativo |

### Códigos de Situação
| Código | Descrição |
|--------|-----------|
| `A` | Ativo |
| `N` | Não analisado |

---

## Exemplos de Uso

### 1. Buscar Rendimentos Recentes
```bash
curl -s "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=50" \
  --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" | \
  jq '.data[] | select(.tipoDocumento | contains("Rendimentos"))'
```

### 2. Buscar Informes Mensais
```bash
curl -s "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=50" \
  --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" | \
  jq '.data[] | select(.tipoDocumento | contains("Informe Mensal"))'
```

### 3. Buscar Assembleias
```bash
curl -s "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=50" \
  --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" | \
  jq '.data[] | select(.categoriaDocumento == "Assembleia")'
```

---

## Paginação

### Exemplo de Paginação Completa
```javascript
async function buscarTodosDocumentos() {
  const allDocs = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await fetch(`https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=${offset}&l=${limit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const data = await response.json();
    
    allDocs.push(...data.data);
    
    if (data.data.length < limit) {
      break; // Última página
    }
    
    offset += limit;
  }
  
  return allDocs;
}
```

---

## Rate Limiting e Boas Práticas

### Recomendações
1. **Delay entre requisições**: 500ms mínimo
2. **User-Agent**: Sempre usar um User-Agent de browser
3. **Cache**: Implementar cache local para evitar requisições desnecessárias
4. **Error handling**: Tratar erros HTTP e timeouts

### Exemplo com Rate Limiting
```javascript
class FNetClient {
  constructor() {
    this.lastRequest = 0;
    this.minDelay = 500; // 500ms entre requests
  }
  
  async makeRequest(url) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minDelay - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
    
    return fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }
}
```

---

## Possíveis Parâmetros Adicionais (Não Testados)

### Filtros de Data
Possível que existam parâmetros para filtrar por data:
- `dataInicio` - Data de início
- `dataFim` - Data de fim
- `anoReferencia` - Ano específico

### Filtros de Fundo
- `cnpjFundo` - CNPJ do fundo específico
- `nomeFundo` - Nome/parte do nome do fundo

### Ordenação
- `orderBy` - Campo para ordenação
- `order` - Direção (ASC/DESC)

**Nota**: Estes parâmetros precisam ser testados individualmente.

---

## URLs de Documentos

### Acesso a Documentos PDF
Para acessar o documento PDF, aparentemente usa-se o ID:
```
https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id={document_id}
```

Exemplo testado:
```bash
curl -s "https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=1031292" \
  --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

**Retorna**: Documento PDF em base64

---

## Monitoramento e Logs

### Códigos de Erro Conhecidos
```json
{"msg":"Deve ser informado o contador 'draw' no campo 'd' para as paginações!","dados":null,"erros":null}
{"msg":"Deve ser informado o campo 'start' no campo 's' para as paginações!","dados":null,"erros":null}
```

### Log de Requisições
```javascript
const logRequest = (url, response) => {
  console.log({
    timestamp: new Date().toISOString(),
    url,
    status: response.status,
    recordsTotal: response.data?.recordsTotal || 0,
    recordsFiltered: response.data?.recordsFiltered || 0
  });
};
```

---

*Documentação técnica gerada em: 19/11/2025*