# Script de verificacao rapida para Oracle IC19 no servidor
Write-Host "=== Verificacao Oracle IC19 - Windows Server 2012 R2 ===" -ForegroundColor Cyan

$ic19Path = ".\resources\instantclient_19_29"

Write-Host "`n1. Verificando se a pasta IC19 existe..." -ForegroundColor Yellow
if (Test-Path $ic19Path) {
    Write-Host "   [OK] Pasta encontrada: $ic19Path" -ForegroundColor Green
} else {
    Write-Host "   [ERRO] Pasta nao encontrada!" -ForegroundColor Red
    Write-Host "   Execute: git pull" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Verificando DLLs CRITICAS do Visual C++..." -ForegroundColor Yellow
$vcDlls = @("msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll")
$allVcOk = $true

foreach ($dll in $vcDlls) {
    $path = Join-Path $ic19Path $dll
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "   [OK] $dll ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "   [FALTA] $dll" -ForegroundColor Red
        $allVcOk = $false
    }
}

Write-Host "`n3. Verificando DLLs principais do Oracle..." -ForegroundColor Yellow
$oracleDlls = @("oci.dll", "oraons.dll")
foreach ($dll in $oracleDlls) {
    $path = Join-Path $ic19Path $dll
    if (Test-Path $path) {
        Write-Host "   [OK] $dll" -ForegroundColor Green
    } else {
        Write-Host "   [FALTA] $dll" -ForegroundColor Red
    }
}

Write-Host "`n4. Testando PATH..." -ForegroundColor Yellow
$fullPath = (Resolve-Path $ic19Path).Path
Write-Host "   PATH completo: $fullPath" -ForegroundColor Gray

Write-Host "`n=== RESULTADO ===" -ForegroundColor Cyan
if (-not $allVcOk) {
    Write-Host "[ACAO NECESSARIA] Copie as DLLs do VC++ para a pasta IC19:" -ForegroundColor Red
    Write-Host "`nOpcao 1 - Se as DLLs existem no System32:" -ForegroundColor Yellow
    Write-Host "  Copy-Item C:\Windows\System32\msvcp140.dll $ic19Path\" -ForegroundColor White
    Write-Host "  Copy-Item C:\Windows\System32\vcruntime140.dll $ic19Path\" -ForegroundColor White
    Write-Host "  Copy-Item C:\Windows\System32\vcruntime140_1.dll $ic19Path\" -ForegroundColor White
    
    Write-Host "`nOpcao 2 - Baixe e instale o VC++ 2015-2019:" -ForegroundColor Yellow
    Write-Host "  https://aka.ms/vs/16/release/vc_redist.x64.exe" -ForegroundColor White
    Write-Host "  Depois copie as DLLs do System32 para $ic19Path" -ForegroundColor White
    
    Write-Host "`nOpcao 3 - Copie de outra maquina que funciona:" -ForegroundColor Yellow
    Write-Host "  Copie as 3 DLLs de uma maquina funcional para $ic19Path" -ForegroundColor White
} else {
    Write-Host "[OK] Todas as DLLs necessarias estao presentes!" -ForegroundColor Green
    Write-Host "Se ainda der erro DPI-1047, verifique:" -ForegroundColor Yellow
    Write-Host "1. Se o Node.js e 64-bit (execute: node -p process.arch)" -ForegroundColor White
    Write-Host "2. Se nao ha antivirus bloqueando as DLLs" -ForegroundColor White
    Write-Host "3. Execute este script como Administrador" -ForegroundColor White
}
