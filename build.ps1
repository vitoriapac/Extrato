$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceFiles=@(
  'src/state/schema.js',
  'src/core/utils.js',
  'src/storage/repository.js',
  'src/domain/reviews.js',
  'src/app.js'
)

$parts=foreach($relativePath in $sourceFiles){
  $absolutePath=Join-Path $projectRoot $relativePath
  if(!(Test-Path -LiteralPath $absolutePath)){throw "Arquivo-fonte não encontrado: $relativePath"}
  $source=[IO.File]::ReadAllText($absolutePath,[Text.Encoding]::UTF8)
  $source=[regex]::Replace($source,'(?ms)^import\s+\{.*?\}\s+from\s+[''"].*?[''"];\s*','')
  $source=[regex]::Replace($source,'(?m)^export\s+','')
  "`r`n/* source: $relativePath */`r`n$source"
}

$banner="/* Arquivo gerado por build.ps1. Edite os modulos em src/, nao este bundle. */`r`n(()=>{`r`n'use strict';`r`n"
$bundle=$banner+($parts -join "`r`n")+"`r`n})();`r`n"
if($bundle -match '(?m)^(?:import|export)\s'){throw 'O bundle ainda contem declaracoes de modulo.'}
$topLevelNames=[regex]::Matches($bundle,'(?m)^(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)') | ForEach-Object {$_.Groups[1].Value}
$duplicates=$topLevelNames | Group-Object | Where-Object Count -gt 1
if($duplicates){throw ('Declaracoes de topo duplicadas: '+(($duplicates.Name | Sort-Object)-join ', '))}
$target=Join-Path $projectRoot 'src/app.bundle.js'
[IO.File]::WriteAllText($target,$bundle,[Text.UTF8Encoding]::new($false))
Write-Host "Bundle atualizado: $target"
