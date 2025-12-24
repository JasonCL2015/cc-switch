//! Commands for fixing Claude Code session thinking blocks.
//!
//! This module provides functionality to:
//! - List Claude projects in ~/.claude/projects
//! - Remove 'thinking' and 'redacted_thinking' blocks from session JSONL files

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

/// Represents a Claude project directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeProject {
    /// Directory name (e.g., "-Users-axel-Documents-GitHub-cc-switch")
    pub name: String,
    /// Full path to the project directory
    pub path: String,
    /// Last modification time as Unix timestamp (milliseconds)
    pub last_modified: u64,
}

/// Result of the thinking blocks fix operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThinkingFixResult {
    /// Number of lines processed
    pub total_lines: usize,
    /// Number of lines that were modified
    pub modified_lines: usize,
    /// Number of thinking blocks removed
    pub thinking_blocks_removed: usize,
    /// Number of errors encountered
    pub errors: usize,
    /// Path to backup file (if created)
    pub backup_path: Option<String>,
    /// Name of the processed JSONL file
    pub jsonl_file: String,
}

/// Get the Claude projects directory path
fn get_claude_projects_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_default()
        .join(".claude")
        .join("projects")
}

/// List all Claude projects in ~/.claude/projects
#[tauri::command]
pub async fn get_claude_projects() -> Result<Vec<ClaudeProject>, String> {
    let projects_dir = get_claude_projects_path();

    if !projects_dir.exists() {
        return Ok(Vec::new());
    }

    let mut projects = Vec::new();

    let entries = fs::read_dir(&projects_dir).map_err(|e| format!("Failed to read projects directory: {e}"))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("")
            .to_string();

        // Get modification time
        let metadata = fs::metadata(&path).ok();
        let last_modified = metadata
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        projects.push(ClaudeProject {
            name,
            path: path.to_string_lossy().to_string(),
            last_modified,
        });
    }

    // Sort by modification time, most recent first
    projects.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    Ok(projects)
}

/// Find the most recently modified .jsonl file in a project directory
fn find_latest_jsonl(project_dir: &PathBuf) -> Option<PathBuf> {
    let entries = fs::read_dir(project_dir).ok()?;

    let mut jsonl_files: Vec<(PathBuf, SystemTime)> = entries
        .flatten()
        .filter_map(|entry| {
            let path = entry.path();
            if path.extension().map(|e| e == "jsonl").unwrap_or(false) {
                let modified = fs::metadata(&path).ok()?.modified().ok()?;
                Some((path, modified))
            } else {
                None
            }
        })
        .collect();

    jsonl_files.sort_by(|a, b| b.1.cmp(&a.1));
    jsonl_files.first().map(|(path, _)| path.clone())
}

/// Fix thinking blocks in a Claude project's session file
#[tauri::command]
pub async fn fix_thinking_blocks(project_path: String) -> Result<ThinkingFixResult, String> {
    let project_dir = PathBuf::from(&project_path);

    if !project_dir.exists() {
        return Err(format!("Project directory not found: {project_path}"));
    }

    // Find the latest JSONL file
    let jsonl_path = find_latest_jsonl(&project_dir)
        .ok_or_else(|| "No .jsonl files found in project directory".to_string())?;

    let jsonl_file = jsonl_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    // Read the file
    let content = fs::read_to_string(&jsonl_path)
        .map_err(|e| format!("Failed to read JSONL file: {e}"))?;

    let lines: Vec<&str> = content.lines().collect();
    let mut processed_lines = Vec::new();
    let mut total_lines = 0;
    let mut modified_lines = 0;
    let mut thinking_blocks_removed = 0;
    let mut errors = 0;

    for line in &lines {
        if line.trim().is_empty() {
            processed_lines.push(line.to_string());
            continue;
        }

        total_lines += 1;

        match serde_json::from_str::<serde_json::Value>(line) {
            Ok(mut data) => {
                let original = serde_json::to_string(&data).unwrap_or_default();

                // Check for thinking blocks in message.content
                if let Some(message) = data.get_mut("message") {
                    if let Some(content) = message.get_mut("content") {
                        if let Some(content_array) = content.as_array_mut() {
                            let original_len = content_array.len();

                            // Filter out thinking blocks
                            content_array.retain(|item| {
                                if let Some(item_type) = item.get("type").and_then(|t| t.as_str()) {
                                    if item_type == "thinking" || item_type == "redacted_thinking" {
                                        return false;
                                    }
                                }
                                true
                            });

                            let removed = original_len - content_array.len();
                            thinking_blocks_removed += removed;
                        }
                    }
                }

                let new_json = serde_json::to_string(&data).unwrap_or_default();
                if new_json != original {
                    modified_lines += 1;
                }
                processed_lines.push(new_json);
            }
            Err(_) => {
                errors += 1;
                processed_lines.push(line.to_string());
            }
        }
    }

    // Create backup
    let backup_path = jsonl_path.with_extension("jsonl.bak");
    let backup_path_str = if backup_path.exists() {
        // Add timestamp if backup already exists
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let new_backup = jsonl_path.with_extension(format!("{timestamp}.bak"));
        fs::copy(&jsonl_path, &new_backup)
            .map_err(|e| format!("Failed to create backup: {e}"))?;
        Some(new_backup.to_string_lossy().to_string())
    } else {
        fs::copy(&jsonl_path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {e}"))?;
        Some(backup_path.to_string_lossy().to_string())
    };

    // Write processed content
    let output = processed_lines.join("\n");
    fs::write(&jsonl_path, output)
        .map_err(|e| format!("Failed to write JSONL file: {e}"))?;

    Ok(ThinkingFixResult {
        total_lines,
        modified_lines,
        thinking_blocks_removed,
        errors,
        backup_path: backup_path_str,
        jsonl_file,
    })
}
