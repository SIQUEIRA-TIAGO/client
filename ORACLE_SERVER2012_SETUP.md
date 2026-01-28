# Configuração Oracle Client - Windows Server 2012 R2

## Problema Comum
Erro: "Could not locate the binaries for the Oracle Client" ou "DLL load failed"

## Causa
Windows Server 2012 R2 tem limitações com versões mais recentes do Visual C++ Redistributable e Oracle Instant Client.

## Solução Passo a Passo

### 1. Execute o Script de Diagnóstico
```powershell
.\fix-oracle-server2012.ps1
```

### 2. Instale Visual C++ Redistributable Compatível

**IMPORTANTE:** Use a versão 2015-2019, NÃO a 2015-2022

- **Download:** https://aka.ms/vs/16/release/vc_redist.x64.exe
- Execute o instalador como Administrador
- Se falhar, copie as DLLs manualmente (veja passo 3)

### 3. Copie as DLLs Necessárias (Alternativa)

Se a instalação falhar, copie estas DLLs para `resources/instantclient_21_20/`:

- `msvcp140.dll`
- `vcruntime140.dll`
- `vcruntime140_1.dll`

**Fontes possíveis:**
- De outra máquina com Windows 10/11 (pasta `C:\Windows\System32\`)
- Do seu computador de desenvolvimento
- Execute: `.\copy-vcruntime-dlls.ps1` em uma máquina que já tenha as DLLs

### 4. Considere Downgrade do Oracle Client (Recomendado)

Oracle Instant Client 19 tem melhor compatibilidade com Server 2012 R2:

1. Baixe: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
2. Escolha "Version 19.x Basic Light Package"
3. Extraia para `resources/instantclient_19_x`
4. Atualize o caminho no código (database-connector.ts)
5. Copie as DLLs do Visual C++ para a nova pasta

### 5. Verifique Compatibilidade do Node.js

Windows Server 2012 R2 suporta até Node.js 18.x oficialmente:
```powershell
node --version
```

Se estiver usando Node.js 20+, considere downgrade para 18 LTS.

### 6. Teste a Conexão

Após aplicar as correções:
```powershell
# Diagnóstico completo
.\diagnose-oracle.ps1

# Execute a aplicação
npm start
```

## Troubleshooting

### Erro: "Procedure entry point ... could not be located"
- **Causa:** DLLs incompatíveis ou versões mistas
- **Solução:** Delete todas as DLLs do Visual C++ e copie novamente da mesma fonte

### Erro: "The specified module could not be found"
- **Causa:** Falta alguma DLL dependente
- **Solução:** Execute `.\diagnose-oracle.ps1` para identificar qual DLL falta

### Erro persiste após copiar DLLs
- **Causa:** Oracle IC 21 pode ter incompatibilidades com Server 2012 R2
- **Solução:** Use Oracle Instant Client 19 (mais estável)

## Configuração Portátil (Recomendado para Server 2012 R2)

Para evitar problemas de instalação:

1. Copie todas as DLLs necessárias para a pasta do Oracle Client
2. Commit essas DLLs no repositório Git
3. O código já adiciona automaticamente ao PATH em runtime

**Vantagens:**
- Não precisa instalar nada no servidor
- Funciona mesmo sem privilégios de administrador
- Portável entre máquinas

## Checklist Final

- [ ] DLLs do Visual C++ copiadas para instantclient_21_20/
- [ ] Oracle Instant Client testado com `diagnose-oracle.ps1`
- [ ] Node.js versão compatível (18.x)
- [ ] .NET Framework 4.6+ instalado
- [ ] Código atualizado via `git pull`
- [ ] Variável DB_DIALECT=oracle no .env

## Suporte

Se o problema persistir:
1. Execute `.\fix-oracle-server2012.ps1` e salve a saída
2. Execute `.\diagnose-oracle.ps1` e salve a saída
3. Compartilhe as mensagens de erro completas
