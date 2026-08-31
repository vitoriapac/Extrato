$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $projectRoot
try {
  npm run build
  if($LASTEXITCODE -ne 0){throw 'Falha ao gerar o bundle.'}
} finally {
  Pop-Location
}
