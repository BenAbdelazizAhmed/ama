param(
    [switch]$Frontend
)

$port = 8081
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Checking for processes on port $port..." -ForegroundColor Cyan
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections.OwningProcess | Select-Object -Unique
    foreach ($pid in $pids) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Killing process $($proc.ProcessName) (PID $pid) on port $port..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force
        }
    }
    Start-Sleep -Seconds 1
    Write-Host "Port $port is now free." -ForegroundColor Green
} else {
    Write-Host "Port $port is already free." -ForegroundColor Green
}

$jar = Join-Path $projectRoot "backend\target\amanafarm-backend-0.0.1-SNAPSHOT.jar"
if (!(Test-Path $jar)) {
    Write-Host "Building backend with Maven..." -ForegroundColor Cyan
    $mvnw = Join-Path $projectRoot "backend\mvnw.cmd"
    if (!(Test-Path $mvnw)) { Write-Host "Error: mvnw.cmd not found" -ForegroundColor Red; exit 1 }
    Push-Location (Join-Path $projectRoot "backend")
    & $mvnw clean package -DskipTests -q
    Pop-Location
}

Write-Host "Starting backend on port $port..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock { param($j) java -jar $j } -ArgumentList $jar
Start-Sleep -Seconds 8

if ($Frontend) {
    $frontendDir = Join-Path $projectRoot "frontend"
    if (Test-Path $frontendDir) {
        Write-Host "Starting frontend on http://localhost:4200..." -ForegroundColor Cyan
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start" -WorkingDirectory $frontendDir
    }
}

Write-Host "`nBackend running on http://localhost:$port" -ForegroundColor Green
if ($Frontend) { Write-Host "Frontend running on http://localhost:4200" -ForegroundColor Green }
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

while ($true) { Start-Sleep -Seconds 1 }

Remove-Job $backendJob -Force
