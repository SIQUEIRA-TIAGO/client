# Script para corrigir Oracle Client no Windows Server 2012 R2
Write-Host "=== Correção Oracle Client para Windows Server 2012 R2 ===" -ForegroundColor Cyan

$oracleDir = ".\resources\instantclient_19_29"

Write-Host "`n1. Verificando versão do Windows..." -ForegroundColor Yellow
$osInfo = Get-WmiObject -Class Win32_OperatingSystem
Write-Host "   Sistema: $($osInfo.Caption)" -ForegroundColor Gray
Write-Host "   Versão: $($osInfo.Version)" -ForegroundColor Gray
Write-Host "   Build: $($osInfo.BuildNumber)" -ForegroundColor Gray

if ($osInfo.Caption -match "2012") {
    Write-Host "   [AVISO] Windows Server 2012 detectado - podem ser necessarias adaptacoes" -ForegroundColor Yellow
}

Write-Host "`n2. Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
$nodeArch = node -p "process.arch" 2>&1
Write-Host "   Versão: $nodeVersion" -ForegroundColor Gray
Write-Host "   Arquitetura: $nodeArch" -ForegroundColor Gray

Write-Host "`n3. Verificando Visual C++ Redistributables instalados..." -ForegroundColor Yellow
$vcInstalled = @()
$vcPaths = @(
    "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64",
    "HKLM:\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64",
    "HKLM:\SOFTWARE\Microsoft\DevDiv\vc\Servicing\14.0\RuntimeMinimum"
)

foreach ($vcPath in $vcPaths) {
    $vc = Get-ItemProperty -Path $vcPath -ErrorAction SilentlyContinue
    if ($vc) {
        Write-Host "   [OK] Visual C++ encontrado em: $vcPath" -ForegroundColor Green
        if ($vc.Version) {
            Write-Host "        Versão: $($vc.Version)" -ForegroundColor Gray
        }
        $vcInstalled += $vcPath
    }
}

if ($vcInstalled.Count -eq 0) {
    Write-Host "   [AVISO] Visual C++ Redistributable nao detectado no registro" -ForegroundColor Yellow
}

Write-Host "`n4. Verificando DLLs do Visual C++ Runtime..." -ForegroundColor Yellow
$requiredDlls = @("msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll")
$missingInOracle = @()
$foundInSystem = @()

foreach ($dll in $requiredDlls) {
    $oraclePath = Join-Path $oracleDir $dll
    $systemPath = Join-Path $env:SystemRoot "System32\$dll"
    
    $inOracle = Test-Path $oraclePath
    $inSystem = Test-Path $systemPath
    
    Write-Host "   $dll :" -NoNewline
    if ($inOracle) {
        Write-Host " [OK] em Oracle Client" -ForegroundColor Green
    } else {
        Write-Host " [FALTA] em Oracle Client" -ForegroundColor Red -NoNewline
        $missingInOracle += $dll
        
        if ($inSystem) {
            Write-Host " (mas existe em System32)" -ForegroundColor Yellow
            $foundInSystem += @{dll=$dll; path=$systemPath}
        } else {
            Write-Host " (nao encontrada no sistema)" -ForegroundColor Red
        }
    }
}

Write-Host "`n5. Verificando DLLs do Oracle Instant Client..." -ForegroundColor Yellow
$oracleDlls = @("oci.dll", "oraociei21.dll", "oraons.dll")
foreach ($dll in $oracleDlls) {
    $path = Join-Path $oracleDir $dll
    if (Test-Path $path) {
        $fileInfo = Get-Item $path
        Write-Host "   [OK] $dll ($([math]::Round($fileInfo.Length/1MB, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "   [AVISO] $dll nao encontrada" -ForegroundColor Yellow
    }
}

Write-Host "`n=== ACOES RECOMENDADAS ===" -ForegroundColor Cyan

if ($missingInOracle.Count -gt 0) {
    Write-Host "`n[ACAO 1] Copiar DLLs do Visual C++ Runtime" -ForegroundColor Yellow
    
    if ($foundInSystem.Count -gt 0) {
        Write-Host "Copiando DLLs encontradas no sistema..." -ForegroundColor White
        foreach ($item in $foundInSystem) {
            $dest = Join-Path $oracleDir $item.dll
            try {
                Copy-Item -Path $item.path -Destination $dest -Force
                Write-Host "  [OK] Copiado: $($item.dll)" -ForegroundColor Green
            } catch {
                Write-Host "  [ERRO] Falha ao copiar $($item.dll): $_" -ForegroundColor Red
            }
        }
    }
    
    if ($missingInOracle.Count -gt $foundInSystem.Count) {
        Write-Host "`nAinda faltam DLLs. Opcoes:" -ForegroundColor Yellow
        Write-Host "1. Baixe Visual C++ 2015-2019 Redistributable (x64)" -ForegroundColor White
        Write-Host "   Link: https://aka.ms/vs/16/release/vc_redist.x64.exe" -ForegroundColor White
        Write-Host "   Nota: Versão 2015-2019 tem melhor compatibilidade com Server 2012 R2" -ForegroundColor Gray
        Write-Host "`n2. Ou copie as DLLs manualmente para: $oracleDir" -ForegroundColor White
    }
}

Write-Host "`n[ACAO 2] Considere usar Oracle Instant Client 19 em vez de 21" -ForegroundColor Yellow
Write-Host "  Oracle IC 19 tem melhor compatibilidade com Windows Server 2012 R2" -ForegroundColor Gray
Write-Host "  Download: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html" -ForegroundColor Gray

Write-Host "`n[ACAO 3] Garanta que .NET Framework 4.6+ esta instalado" -ForegroundColor Yellow
$netVersion = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" -ErrorAction SilentlyContinue
if ($netVersion) {
    Write-Host "  .NET Framework versão: $($netVersion.Release)" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] .NET Framework 4.6+ pode nao estar instalado" -ForegroundColor Red
}

Write-Host "`n[ACAO 4] Teste o carregamento da DLL" -ForegroundColor Yellow
Write-Host "  Execute: .\diagnose-oracle.ps1" -ForegroundColor White

Write-Host "`n=== FIM DO DIAGNOSTICO ===" -ForegroundColor Cyan
