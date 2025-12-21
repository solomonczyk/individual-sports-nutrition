# PostgreSQL Backup Script for Windows PowerShell
# Usage: .\backup-postgres.ps1 -Action backup
# Backs up the nutrition database and stores in timestamped files

param(
    [ValidateSet('backup', 'restore', 'list', 'cleanup', 'verify')]
    [string]$Action = 'backup',
    
    [string]$BackupFile,
    [string]$DatabaseName = $env:DATABASE_NAME,
    [string]$DatabaseUser = $env:DATABASE_USER,
    [string]$DatabasePassword = $env:DATABASE_PASSWORD,
    [string]$DatabaseHost = $env:DATABASE_HOST,
    [string]$DatabasePort = $env:DATABASE_PORT,
    [string]$BackupDir = $env:BACKUP_DIR,
    [int]$RetentionDays = 30
)

# Set defaults
if (-not $DatabaseName) { $DatabaseName = 'individual_sports_nutrition' }
if (-not $DatabaseUser) { $DatabaseUser = 'postgres' }
if (-not $DatabaseHost) { $DatabaseHost = 'localhost' }
if (-not $DatabasePort) { $DatabasePort = '5432' }
if (-not $BackupDir) { $BackupDir = Join-Path (Get-Location) 'backups' }

$LogFile = Join-Path $BackupDir 'backup.log'

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Add-Content -Path $LogFile -Value $logMessage -ErrorAction SilentlyContinue
    Write-Host $logMessage
}

# Error handling
function Write-Error-Log {
    param([string]$Message)
    Write-Host "Error: $Message" -ForegroundColor Red
    Write-Log -Level 'ERROR' -Message $Message
    exit 1
}

# Success message
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    Write-Log -Level 'SUCCESS' -Message $Message
}

# Warning message
function Write-Warning-Log {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
    Write-Log -Level 'WARNING' -Message $Message
}

# Backup database function
function Backup-Database {
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupFile = Join-Path $BackupDir "${DatabaseName}_${timestamp}.sql"
    $backupFileGz = "${backupFile}.gz"
    
    Write-Log -Level 'INFO' -Message "Starting backup of database: $DatabaseName"
    Write-Log -Level 'INFO' -Message "Backup file: $backupFileGz"
    
    # Check if pg_dump is available
    try {
        $pgDump = Get-Command pg_dump -ErrorAction Stop
    } catch {
        Write-Error-Log "pg_dump not found. Please install PostgreSQL client tools or add it to PATH."
    }
    
    try {
        # Set PostgreSQL password in environment
        $env:PGPASSWORD = $DatabasePassword
        
        # Perform backup
        & pg_dump `
            --host=$DatabaseHost `
            --port=$DatabasePort `
            --username=$DatabaseUser `
            --format=plain `
            $DatabaseName | gzip > $backupFileGz
        
        if ($LASTEXITCODE -eq 0) {
            $fileSize = [math]::Round((Get-Item $backupFileGz).Length / 1MB, 2)
            Write-Log -Level 'INFO' -Message "Backup completed successfully. Size: ${fileSize}MB"
            Write-Success "Backup completed: $(Split-Path -Leaf $backupFileGz)"
            
            # Create backup manifest
            $manifest = @{
                database = $DatabaseName
                timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
                hostname = $env:COMPUTERNAME
                file = Split-Path -Leaf $backupFileGz
                size_bytes = (Get-Item $backupFileGz).Length
                compressed = $true
            }
            
            $manifest | ConvertTo-Json | Out-File -Path "${backupFileGz}.json"
        } else {
            Write-Error-Log "Backup failed. Exit code: $LASTEXITCODE. Check log file: $LogFile"
        }
    } finally {
        # Clear password from environment
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Restore database function
function Restore-Database {
    param([string]$BackupFile)
    
    if (-not $BackupFile) {
        Write-Error-Log "Backup file not specified. Usage: .\backup-postgres.ps1 -Action restore -BackupFile <path>"
    }
    
    if (-not (Test-Path $BackupFile)) {
        Write-Error-Log "Backup file not found: $BackupFile"
    }
    
    Write-Log -Level 'INFO' -Message "Starting restore from: $BackupFile"
    Write-Warning-Log "This will overwrite the current database: $DatabaseName"
    
    $confirm = Read-Host "Are you sure? (yes/no)"
    if ($confirm -ne 'yes') {
        Write-Log -Level 'INFO' -Message 'Restore cancelled'
        return
    }
    
    try {
        # Decompress if needed
        $restoreFile = $BackupFile
        if ($BackupFile -like '*.gz') {
            $restoreFile = $BackupFile -replace '.gz$', ''
            Write-Log -Level 'INFO' -Message "Decompressing backup..."
            
            $gzipFile = Get-Item $BackupFile
            [IO.Compression.GZipStream]$inStream = New-Object IO.Compression.GZipStream(
                [IO.File]::OpenRead($BackupFile),
                [IO.Compression.CompressionMode]::Decompress
            )
            [IO.File]::WriteAllBytes($restoreFile, (Read-StreamToBytes $inStream))
            $inStream.Dispose()
        }
        
        # Perform restore
        $env:PGPASSWORD = $DatabasePassword
        & psql `
            --host=$DatabaseHost `
            --port=$DatabasePort `
            --username=$DatabaseUser `
            --dbname=$DatabaseName `
            -f $restoreFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log -Level 'INFO' -Message "Restore completed successfully"
            Write-Success "Database restored from: $(Split-Path -Leaf $BackupFile)"
        } else {
            Write-Error-Log "Restore failed. Exit code: $LASTEXITCODE. Check log file: $LogFile"
        }
        
        # Clean up decompressed file
        if ($BackupFile -like '*.gz') {
            Remove-Item $restoreFile -Force -ErrorAction SilentlyContinue
        }
    } finally {
        Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Helper function for reading stream (for GZip decompression)
function Read-StreamToBytes {
    param($Stream)
    $buffer = New-Object byte[] 8192
    $memoryStream = New-Object IO.MemoryStream
    while ($true) {
        $readBytes = $Stream.Read($buffer, 0, 8192)
        if ($readBytes -le 0) { break }
        $memoryStream.Write($buffer, 0, $readBytes)
    }
    return $memoryStream.ToArray()
}

# List backups function
function List-Backups {
    Write-Host "Available backups:`n"
    
    $backups = Get-ChildItem -Path "$BackupDir" -Filter "${DatabaseName}_*.sql.gz" -ErrorAction SilentlyContinue
    
    if ($backups) {
        foreach ($backup in $backups) {
            $size = [math]::Round($backup.Length / 1MB, 2)
            Write-Host "  $($backup.Name) ($size MB)  $($backup.LastWriteTime)"
        }
    } else {
        Write-Host "  No backups found"
    }
}

# Cleanup old backups function
function Cleanup-OldBackups {
    Write-Log -Level 'INFO' -Message "Cleaning up backups older than $RetentionDays days"
    
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $deletedCount = 0
    
    $oldBackups = Get-ChildItem -Path "$BackupDir" -Filter "${DatabaseName}_*.sql.gz" -ErrorAction SilentlyContinue | 
                  Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    foreach ($backup in $oldBackups) {
        Write-Log -Level 'INFO' -Message "Deleting old backup: $($backup.Name)"
        Remove-Item $backup.FullName -Force -ErrorAction SilentlyContinue
        Remove-Item "$($backup.FullName).json" -Force -ErrorAction SilentlyContinue
        $deletedCount++
    }
    
    if ($deletedCount -gt 0) {
        Write-Log -Level 'INFO' -Message "Deleted $deletedCount old backups"
        Write-Success "Cleanup completed: $deletedCount old backups removed"
    } else {
        Write-Log -Level 'INFO' -Message "No old backups to clean up"
    }
}

# Verify backup integrity function
function Verify-Backup {
    param([string]$BackupFile)
    
    if (-not $BackupFile) {
        Write-Error-Log "Backup file not specified. Usage: .\backup-postgres.ps1 -Action verify -BackupFile <path>"
    }
    
    if (-not (Test-Path $BackupFile)) {
        Write-Error-Log "Backup file not found: $BackupFile"
    }
    
    Write-Log -Level 'INFO' -Message "Verifying backup: $BackupFile"
    
    $fileInfo = Get-Item $BackupFile
    
    if ($fileInfo.Length -gt 0) {
        $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
        Write-Success "Backup file is valid. Size: ${fileSizeMB}MB"
        
        # Try to test gzip integrity
        if ($BackupFile -like '*.gz') {
            try {
                $gzipFile = New-Object IO.Compression.GZipStream(
                    [IO.File]::OpenRead($BackupFile),
                    [IO.Compression.CompressionMode]::Decompress
                )
                $gzipFile.Dispose()
                Write-Success "Gzip integrity check passed"
            } catch {
                Write-Error-Log "Gzip integrity check failed: $_"
            }
        }
    } else {
        Write-Error-Log "Backup file is empty or corrupted"
    }
}

# Show usage
function Show-Usage {
    Write-Host @'
PostgreSQL Backup & Restore Script for Windows

Usage: .\backup-postgres.ps1 -Action <action> [options]

Actions:
  backup       Create a new backup (default)
  restore      Restore from a backup file (-BackupFile required)
  list         List available backups
  cleanup      Remove backups older than 30 days
  verify       Verify backup file integrity (-BackupFile required)

Parameters:
  -Action              Action to perform (backup, restore, list, cleanup, verify)
  -BackupFile          Path to backup file (for restore/verify)
  -DatabaseName        Database name (default: individual_sports_nutrition)
  -DatabaseUser        Database user (default: postgres)
  -DatabasePassword    Database password
  -DatabaseHost        Database host (default: localhost)
  -DatabasePort        Database port (default: 5432)
  -BackupDir           Backup directory (default: ./backups)
  -RetentionDays       Keep backups for N days (default: 30)

Environment Variables:
  DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, 
  DATABASE_PORT, BACKUP_DIR can be set instead of parameters

Examples:
  # Create backup
  .\backup-postgres.ps1 -Action backup

  # List backups
  .\backup-postgres.ps1 -Action list

  # Restore from backup
  .\backup-postgres.ps1 -Action restore -BackupFile "backups\individual_sports_nutrition_20250101_120000.sql.gz"

  # Verify backup
  .\backup-postgres.ps1 -Action verify -BackupFile "backups\individual_sports_nutrition_20250101_120000.sql.gz"

  # Clean up old backups
  .\backup-postgres.ps1 -Action cleanup

'@
}

# Main execution
switch ($Action) {
    'backup' {
        Backup-Database
        Cleanup-OldBackups
    }
    'restore' {
        Restore-Database -BackupFile $BackupFile
    }
    'list' {
        List-Backups
    }
    'cleanup' {
        Cleanup-OldBackups
    }
    'verify' {
        Verify-Backup -BackupFile $BackupFile
    }
    default {
        Show-Usage
    }
}
