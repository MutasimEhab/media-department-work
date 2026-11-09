$ErrorActionPreference = 'Stop'

$backendRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envPath = Join-Path $backendRoot '.env'
if (-not (Test-Path -LiteralPath $envPath)) {
  throw 'ملف backend/.env غير موجود. لن يتم إنشاء نسخة احتياطية.'
}

$databaseLine = Get-Content -LiteralPath $envPath | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $databaseLine) {
  throw 'لم يتم العثور على DATABASE_URL داخل backend/.env.'
}

$databaseUrl = ($databaseLine -replace '^\s*DATABASE_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
try {
  $databaseUri = [Uri]$databaseUrl
} catch {
  throw 'صيغة DATABASE_URL غير صالحة. تحقق من رابط اتصال Neon دون مشاركته.'
}

$credentials = $databaseUri.UserInfo -split ':', 2
$databaseName = [Uri]::UnescapeDataString($databaseUri.AbsolutePath.TrimStart('/'))
if ($databaseUri.Scheme -notin @('postgres', 'postgresql') -or $credentials.Count -ne 2 -or -not $databaseName) {
  throw 'رابط Neon يجب أن يكون بصيغة PostgreSQL ويحتوي على اسم قاعدة البيانات.'
}

$pgDump = Get-Command 'pg_dump' -ErrorAction SilentlyContinue
if (-not $pgDump) {
  throw 'أداة pg_dump غير مثبتة. ثبّت أدوات PostgreSQL الرسمية ثم أعد تشغيل هذا الملف.'
}

$backupDirectory = Join-Path $backendRoot 'backups'
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $backupDirectory "media-department-$timestamp.dump"

# Keep the password in the child process environment, not in command arguments or output.
$env:PGHOST = $databaseUri.DnsSafeHost
$env:PGPORT = if ($databaseUri.IsDefaultPort) { '5432' } else { [string]$databaseUri.Port }
$env:PGUSER = [Uri]::UnescapeDataString($credentials[0])
$env:PGPASSWORD = [Uri]::UnescapeDataString($credentials[1])
$env:PGDATABASE = $databaseName
$env:PGSSLMODE = 'require'
$env:PGCHANNELBINDING = 'require'

try {
  & $pgDump.Source --no-password --format=custom --no-owner --no-acl --file $backupPath
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump انتهى برمز الخطأ $LASTEXITCODE. لم يتم اعتبار النسخة مكتملة."
  }

  $backup = Get-Item -LiteralPath $backupPath
  if ($backup.Length -eq 0) {
    throw 'ملف النسخة الاحتياطية فارغ؛ تحقق من الاتصال قبل الاعتماد عليه.'
  }

  Write-Output "اكتمل النسخ الاحتياطي: $($backup.FullName)"
  Write-Output "الحجم: $([Math]::Round($backup.Length / 1MB, 2)) MB"
  Write-Output 'النسخة محفوظة محلياً ومستثناة من Git.'
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:PGHOST -ErrorAction SilentlyContinue
  Remove-Item Env:PGPORT -ErrorAction SilentlyContinue
  Remove-Item Env:PGUSER -ErrorAction SilentlyContinue
  Remove-Item Env:PGDATABASE -ErrorAction SilentlyContinue
  Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue
  Remove-Item Env:PGCHANNELBINDING -ErrorAction SilentlyContinue
}
