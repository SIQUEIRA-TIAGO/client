# Script de diagnostico completo para Oracle Client
Write-Host "=== Diagnostico do Oracle Instant Client ===" -ForegroundColor Cyan

$oracleDir = ".\resources\instantclient_19_29"

Write-Host "`n1. Verificando diretorio do Oracle Client..." -ForegroundColor Yellow
if (Test-Path $oracleDir) {
    Write-Host "   [OK] Diretorio existe: $oracleDir" -ForegroundColor Green
} else {
    Write-Host "   [ERRO] Diretorio nao encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Verificando DLLs principais do Oracle..." -ForegroundColor Yellow
$oracleDlls = @("oci.dll", "oraociei21.dll", "oraons.dll")
foreach ($dll in $oracleDlls) {
    $path = Join-Path $oracleDir $dll
    if (Test-Path $path) {
        Write-Host "   [OK] $dll" -ForegroundColor Green
    } else {
        Write-Host "   [AVISO] $dll nao encontrada" -ForegroundColor Yellow
    }
}

Write-Host "`n3. Verificando DLLs do Visual C++ Runtime..." -ForegroundColor Yellow
$vcDlls = @("msvcp140.dll", "vcruntime140.dll", "vcruntime140_1.dll")
$missingVcDlls = @()
foreach ($dll in $vcDlls) {
    $path = Join-Path $oracleDir $dll
    if (Test-Path $path) {
        Write-Host "   [OK] $dll" -ForegroundColor Green
    } else {
        Write-Host "   [FALTA] $dll" -ForegroundColor Red
        $missingVcDlls += $dll
    }
}

Write-Host "`n4. Verificando dependencias com Dependency Walker..." -ForegroundColor Yellow
$ociPath = Join-Path $oracleDir "oci.dll"

# Tenta usar dumpbin se estiver disponivel
$dumpbin = Get-Command dumpbin -ErrorAction SilentlyContinue
if ($dumpbin) {
    Write-Host "   Analisando dependencias de oci.dll..." -ForegroundColor Gray
    $deps = & dumpbin /dependents $ociPath 2>&1 | Select-String "\.dll"
    $deps | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
} else {
    Write-Host "   [AVISO] dumpbin nao disponivel. Instale Visual Studio Build Tools para analise detalhada" -ForegroundColor Yellow
}

Write-Host "`n5. Verificando PATH do sistema..." -ForegroundColor Yellow
$systemPath = $env:PATH
if ($systemPath -match "instantclient") {
    Write-Host "   [OK] PATH contem referencia ao instantclient" -ForegroundColor Green
} else {
    Write-Host "   [AVISO] PATH nao contem instantclient (sera adicionado em runtime)" -ForegroundColor Yellow
}

Write-Host "`n6. Testando carregamento da DLL com LoadLibrary..." -ForegroundColor Yellow
$code = @"
using System;
using System.Runtime.InteropServices;

public class DllTester {
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr LoadLibrary(string lpFileName);
    
    [DllImport("kernel32.dll")]
    public static extern uint GetLastError();
    
    public static bool TestLoad(string path) {
        IntPtr handle = LoadLibrary(path);
        if (handle == IntPtr.Zero) {
            uint error = GetLastError();
            Console.WriteLine("   [ERRO] Falha ao carregar. Codigo de erro: " + error);
            Console.WriteLine("   Erro 126 = Modulo nao encontrado (falta DLL dependente)");
            Console.WriteLine("   Erro 193 = Nao e uma aplicacao Win32 valida (32 vs 64 bit)");
            return false;
        }
        Console.WriteLine("   [OK] DLL carregada com sucesso!");
        return true;
    }
}
"@

Add-Type -TypeDefinition $code -Language CSharp
$ociFullPath = (Get-Item $ociPath).FullName
Write-Host "   Testando: $ociFullPath" -ForegroundColor Gray
[DllTester]::TestLoad($ociFullPath)

Write-Host "`n=== Recomendacoes ===" -ForegroundColor Cyan
if ($missingVcDlls.Count -gt 0) {
    Write-Host "[ACAO NECESSARIA] Copie as seguintes DLLs para $oracleDir :" -ForegroundColor Red
    foreach ($dll in $missingVcDlls) {
        Write-Host "  - $dll" -ForegroundColor Red
    }
    Write-Host "`nExecute: .\copy-vcruntime-dlls.ps1" -ForegroundColor Yellow
}

Write-Host "`nPara resolver problemas de DLLs faltantes:" -ForegroundColor White
Write-Host "1. Execute copy-vcruntime-dlls.ps1 nesta maquina" -ForegroundColor White
Write-Host "2. Commit as DLLs no git junto com o instantclient" -ForegroundColor White
Write-Host "3. Ou baixe o Visual C++ Redistributable 2015-2022 completo" -ForegroundColor White
