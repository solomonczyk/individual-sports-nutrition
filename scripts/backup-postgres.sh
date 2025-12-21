#!/bin/bash
# PostgreSQL Backup Script
# Usage: ./backup-postgres.sh
# Backs up the nutrition database and stores in timestamped files

set -e

# Configuration
DB_NAME="${DATABASE_NAME:-individual_sports_nutrition}"
DB_USER="${DATABASE_USER:-postgres}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
  local level=$1
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Error handling
error() {
  log "ERROR" "$@"
  echo -e "${RED}Error: $@${NC}" >&2
  exit 1
}

# Success message
success() {
  echo -e "${GREEN}$@${NC}"
}

# Warning message
warning() {
  echo -e "${YELLOW}$@${NC}"
}

# Main backup function
backup_database() {
  local timestamp=$(date '+%Y%m%d_%H%M%S')
  local backup_file="${BACKUP_DIR}/${DB_NAME}_${timestamp}.sql"
  local backup_file_gz="${backup_file}.gz"
  
  log "INFO" "Starting backup of database: $DB_NAME"
  log "INFO" "Backup file: $backup_file_gz"
  
  # Check if pg_dump is available
  if ! command -v pg_dump &> /dev/null; then
    error "pg_dump not found. Please install PostgreSQL client tools."
  fi
  
  # Perform backup
  if PGPASSWORD="${DATABASE_PASSWORD}" pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --format=plain \
    "$DB_NAME" | gzip > "$backup_file_gz" 2>> "$LOG_FILE"; then
    
    local file_size=$(du -h "$backup_file_gz" | cut -f1)
    log "INFO" "Backup completed successfully. Size: $file_size"
    success "✓ Backup completed: $(basename $backup_file_gz)"
    
  else
    error "Backup failed. Check log file: $LOG_FILE"
  fi
  
  # Create backup manifest
  echo "{
  \"database\": \"$DB_NAME\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"hostname\": \"$(hostname)\",
  \"file\": \"$(basename $backup_file_gz)\",
  \"size_bytes\": $(stat -f%z "$backup_file_gz" 2>/dev/null || stat -c%s "$backup_file_gz"),
  \"compressed\": true
}" > "${backup_file_gz%.gz}.json"
  
  return 0
}

# Restore function
restore_database() {
  local backup_file=$1
  
  if [ -z "$backup_file" ]; then
    error "Backup file not specified. Usage: $0 restore <backup_file>"
  fi
  
  if [ ! -f "$backup_file" ]; then
    error "Backup file not found: $backup_file"
  fi
  
  log "INFO" "Starting restore from: $backup_file"
  warning "This will overwrite the current database: $DB_NAME"
  read -p "Are you sure? (yes/no): " confirm
  
  if [ "$confirm" != "yes" ]; then
    log "INFO" "Restore cancelled"
    exit 0
  fi
  
  # Decompress if needed
  local restore_file="$backup_file"
  if [[ "$backup_file" == *.gz ]]; then
    restore_file="${backup_file%.gz}"
    log "INFO" "Decompressing backup..."
    gunzip -c "$backup_file" > "$restore_file"
  fi
  
  # Perform restore
  if PGPASSWORD="${DATABASE_PASSWORD}" psql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    < "$restore_file" 2>> "$LOG_FILE"; then
    
    log "INFO" "Restore completed successfully"
    success "✓ Database restored from: $(basename $backup_file)"
    
  else
    error "Restore failed. Check log file: $LOG_FILE"
  fi
  
  # Clean up decompressed file
  if [[ "$backup_file" == *.gz ]]; then
    rm -f "$restore_file"
  fi
}

# List backups function
list_backups() {
  echo "Available backups:"
  echo ""
  ls -lh "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | \
    awk '{printf "  %-40s %10s  %s %s %s\n", $9, $5, $6, $7, $8}' || \
    echo "  No backups found"
}

# Cleanup old backups function
cleanup_old_backups() {
  local count=0
  
  log "INFO" "Cleaning up backups older than $RETENTION_DAYS days"
  
  while IFS= read -r file; do
    log "INFO" "Deleting old backup: $(basename $file)"
    rm -f "$file"
    rm -f "${file%.gz}.json"
    ((count++))
  done < <(find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS)
  
  if [ $count -gt 0 ]; then
    log "INFO" "Deleted $count old backups"
    success "✓ Cleanup completed: $count old backups removed"
  else
    log "INFO" "No old backups to clean up"
  fi
}

# Verify backup integrity function
verify_backup() {
  local backup_file=$1
  
  if [ -z "$backup_file" ]; then
    error "Backup file not specified. Usage: $0 verify <backup_file>"
  fi
  
  if [ ! -f "$backup_file" ]; then
    error "Backup file not found: $backup_file"
  fi
  
  log "INFO" "Verifying backup: $backup_file"
  
  # Check if file is readable and has content
  if [ -s "$backup_file" ]; then
    local file_size=$(du -h "$backup_file" | cut -f1)
    success "✓ Backup file is valid. Size: $file_size"
    
    # Try to read the header if compressed
    if [[ "$backup_file" == *.gz ]]; then
      if gzip -t "$backup_file" 2>/dev/null; then
        success "✓ Gzip integrity check passed"
      else
        error "Gzip integrity check failed"
      fi
    fi
  else
    error "Backup file is empty or corrupted"
  fi
}

# Show usage
show_usage() {
  cat << EOF
PostgreSQL Backup & Restore Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  backup       Create a new backup (default)
  restore      Restore from a backup file
  list         List available backups
  cleanup      Remove backups older than $RETENTION_DAYS days
  verify       Verify backup file integrity
  help         Show this help message

Environment Variables:
  DATABASE_NAME      Database name (default: individual_sports_nutrition)
  DATABASE_USER      Database user (default: postgres)
  DATABASE_PASSWORD  Database password (required for non-trusted auth)
  DATABASE_HOST      Database host (default: localhost)
  DATABASE_PORT      Database port (default: 5432)
  BACKUP_DIR         Backup directory (default: ./backups)
  RETENTION_DAYS     Keep backups for N days (default: 30)

Examples:
  # Create backup
  $0 backup

  # List backups
  $0 list

  # Restore from latest backup
  $0 restore backups/individual_sports_nutrition_20250101_120000.sql.gz

  # Verify backup
  $0 verify backups/individual_sports_nutrition_20250101_120000.sql.gz

  # Clean up old backups
  $0 cleanup

EOF
}

# Main script logic
main() {
  local command="${1:-backup}"
  
  case "$command" in
    backup)
      backup_database
      cleanup_old_backups
      ;;
    restore)
      restore_database "$2"
      ;;
    list)
      list_backups
      ;;
    cleanup)
      cleanup_old_backups
      ;;
    verify)
      verify_backup "$2"
      ;;
    help|--help|-h)
      show_usage
      ;;
    *)
      error "Unknown command: $command. Use 'help' for usage."
      ;;
  esac
}

# Run main function
main "$@"
