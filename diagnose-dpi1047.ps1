# Diagnostico avancado - Erro DPI-1047 persistente
Write-Host "=== Diagnostico Avancado Oracle DPI-1047 ===" -ForegroundColor Cyan

$ic19Path = ".\resources\instantclient_19_29"

Write-Host "`n1. Informacoes do sistema..." -ForegroundColor Yellow
$os = Get-WmiObject Win32_OperatingSystem
Write-Host "   OS: $($os.Caption)" -ForegroundColor Gray
Write-Host "   Versao: $($os.Version)" -ForegroundColor Gray
Write-Host "   Arquitetura: $($os.OSArchitecture)" -ForegroundColor Gray

Write-Host "`n2. Node.js..." -ForegroundColor Yellow
$nodeVer = node --version
$nodeArch = node -p "process.arch"
Write-Host "   Versao: $nodeVer" -ForegroundColor Gray
Write-Host "   Arquitetura: $nodeArch" -ForegroundColor Gray

if ($nodeVer -match "v20" -and $os.Caption -match "2012") {
    Write-Host "   [AVISO] Node.js 20 pode ter problemas no Server 2012 R2!" -ForegroundColor Red
    Write-Host "   Recomendado: Node.js 18 LTS" -ForegroundColor Yellow
}

Write-Host "`n3. Verificando modulo oracledb..." -ForegroundColor Yellow
if (Test-Path ".\node_modules\oracledb") {
    $pkg = Get-Content ".\node_modules\oracledb\package.json" | ConvertFrom-Json
    Write-Host "   Versao oracledb: $($pkg.version)" -ForegroundColor Gray
    
    # Verifica se o build e compativel
    $buildPath = ".\node_modules\oracledb\build\Release\oracledb.node"
    if (Test-Path $buildPath) {
        $buildSize = (Get-Item $buildPath).Length
        Write-Host "   Build nativo: $buildSize bytes" -ForegroundColor Gray
    } else {
        Write-Host "   [ERRO] Build nativo nao encontrado!" -ForegroundColor Red
    }
} else {
    Write-Host "   [ERRO] Modulo oracledb nao instalado!" -ForegroundColor Red
}

Write-Host "`n4. Testando carregamento manual da oci.dll..." -ForegroundColor Yellow
$ociPath = Join-Path (Resolve-Path $ic19Path).Path "oci.dll"

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DllLoader {
    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern IntPtr LoadLibrary(string lpFileName);
    
    [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
    public static extern int GetLastError();
    
    [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr GetModuleHandle(string lpModuleName);
}
"@

Write-Host "   Tentando carregar: $ociPath" -ForegroundColor Gray

# Adiciona ao PATH primeiro
$env:PATH = "$((Resolve-Path $ic19Path).Path);$env:PATH"

$handle = [DllLoader]::LoadLibrary($ociPath)
if ($handle -eq [IntPtr]::Zero) {
    $error = [DllLoader]::GetLastError()
    Write-Host "   [ERRO] Falha ao carregar. Codigo: $error" -ForegroundColor Red
    
    switch ($error) {
        126 { Write-Host "   Erro 126: DLL dependente faltando" -ForegroundColor Yellow }
        193 { Write-Host "   Erro 193: Incompatibilidade 32/64 bits" -ForegroundColor Yellow }
        default { Write-Host "   Erro desconhecido: $error" -ForegroundColor Yellow }
    }
} else {
    Write-Host "   [OK] oci.dll carregada com sucesso!" -ForegroundColor Green
}

Write-Host "`n5. Verificando DLLs do VC++ mais detalhadamente..." -ForegroundColor Yellow
$vcDlls = @("msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll", "concrt140.dll", "vccorlib140.dll")
foreach ($dll in $vcDlls) {
    $ic19File = Join-Path $ic19Path $dll
    $sys32File = Join-Path $env:SystemRoot "System32\$dll"
    
    $inIC19 = Test-Path $ic19File
    $inSys32 = Test-Path $sys32File
    
    Write-Host "   $dll :" -NoNewline
    if ($inIC19) {
        $ver = (Get-Item $ic19File).VersionInfo.FileVersion
        Write-Host " IC19:$ver" -NoNewline -ForegroundColor Green
    } else {
        Write-Host " IC19:FALTA" -NoNewline -ForegroundColor Red
    }
    
    if ($inSys32) {
        $ver = (Get-Item $sys32File).VersionInfo.FileVersion
        Write-Host " | Sys32:$ver" -ForegroundColor Gray
    } else {
        Write-Host " | Sys32:FALTA" -ForegroundColor Yellow
    }
}

Write-Host "`n6. Testando PATH em runtime..." -ForegroundColor Yellow
$testScript = @"
const path = require('path');
const libDir = path.resolve(process.cwd(), 'resources/instantclient_19_29');
process.env.PATH = libDir + ';' + process.env.PATH;
console.log('PATH configurado:', process.env.PATH.includes('instantclient_19_29'));
try {
    const oracledb = require('oracledb');
    console.log('oracledb carregado com sucesso!');
    oracledb.initOracleClient({ libDir });
    console.log('Oracle Client inicializado!');
} catch (err) {
    console.error('ERRO:', err.message);
    console.error('Stack:', err.stack);
}
"@

$testScript | Out-File -FilePath "test-oracle-load.js" -Encoding UTF8
Write-Host "   Executando teste de carregamento..." -ForegroundColor Gray
node test-oracle-load.js
Remove-Item "test-oracle-load.js" -Force

Write-Host "`n=== SOLUCOES POSSIVEIS ===" -ForegroundColor Cyan

Write-Host "`n[1] RECONSTRUIR modulo oracledb para Node.js 20:" -ForegroundColor Yellow
Write-Host "   npm rebuild oracledb" -ForegroundColor White

Write-Host "`n[2] DOWNGRADE para Node.js 18 LTS (RECOMENDADO para Server 2012 R2):" -ForegroundColor Yellow
Write-Host "   Download: https://nodejs.org/dist/v18.20.0/node-v18.20.0-x64.msi" -ForegroundColor White
Write-Host "   Depois: npm install" -ForegroundColor White

Write-Host "`n[3] Copiar DLLs adicionais do VC++:" -ForegroundColor Yellow
Write-Host "   Copy-Item C:\Windows\System32\concrt140.dll $ic19Path\" -ForegroundColor White
Write-Host "   Copy-Item C:\Windows\System32\vccorlib140.dll $ic19Path\" -ForegroundColor White

Write-Host "`n[4] Verificar se o VC++ 2015-2019 esta instalado:" -ForegroundColor Yellow
Write-Host "   Painel de Controle > Programas > Microsoft Visual C++ 2015-2019 Redistributable (x64)" -ForegroundColor White
