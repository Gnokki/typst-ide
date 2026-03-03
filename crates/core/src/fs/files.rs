use std::fs;
// use std::io::{self, Read, Write};
use std::io::Result;
use std::path::Path;

/// Utility functions for file operations.
/// This module provides functions to read, write, create, delete, check existence, and copy files.

/// Reads the content of a file and returns it as a String.
/// # Arguments
/// * `path` - A string slice that holds the path of the file to read.
/// # Returns
/// * `Ok(String)` containing the file content if successful, or an `io::Error` if an error occurs.
pub fn read_file(path: &str) -> Result<String> {
    fs::read_to_string(path)
}

/// Writes a string content to a file.
/// # Arguments
/// * `path` - A string slice that holds the path of the file to write to.
/// * `content` - A string slice that holds the content to write to the file.
/// # Returns
/// * `Ok(())` if the file was written successfully, or an `io::Error` if an error occurs.
pub fn write_file(path: &str, content: &str) -> Result<()> {
    fs::write(path, content)
}

/// Creates a new file at the specified path.
/// # Arguments
/// * `path` - A string slice that holds the path of the file to create.
/// # Returns
/// * `Ok(())` if the file was created successfully, or an `io::Error` if an error occurs.
pub fn create_file(path: &str) -> Result<()> {
    fs::File::create(path).map(|_| ())
}

/// Deletes a file at the specified path.
/// # Arguments
/// * `path` - A string slice that holds the path of the file to delete.
/// # Returns
/// * `Ok(())` if the file was deleted successfully, or an `io::Error` if an error occurs.
pub fn delete_file(path: &str) -> Result<()> {
    fs::remove_file(path)
}

/// Checks if a file exists at the specified path.
/// # Arguments
/// * `path` - A string slice that holds the path of the file to check.
/// # Returns
/// * `true` if the file exists, or `false` if it does not.
pub fn file_exists(path: &str) -> bool {
    Path::new(path).exists()
}

/// Copies a file from a source path to a destination path.
/// # Arguments
/// * `src` - A string slice that holds the path of the source file.
/// * `dst` - A string slice that holds the path of the destination file.
/// # Returns
/// * `Ok(u64)` containing the number of bytes copied if successful, or an `io::Error` if an error occurs.
pub fn copy_file(src: &str, dst: &str) -> Result<u64> {
    fs::copy(src, dst)
}


#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    
    #[test]
    fn test_read_write_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test_file.typ");

        let path = file_path.as_path();
        let content = "Hello Typst IDE!";

        write_file(path.to_str().unwrap(), content).unwrap();
        let read_content = read_file(path.to_str().unwrap()).unwrap();
        
        assert_eq!(read_content, content);
        std::fs::remove_file(path).unwrap();
    }

    #[test]
    fn test_read_nonexistent_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("nonexistent_file.typ");

        let result = read_file(file_path.to_str().unwrap());
        assert!(result.is_err());

    }

    #[test]
    fn test_read_empty_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("empty_file.typ");

        write_file(file_path.to_str().unwrap(), "").unwrap();
        let read_content = read_file(file_path.to_str().unwrap()).unwrap();

        assert_eq!(read_content, "");
    }

    #[test]
    fn test_create_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("new_file.typ");

        create_file(file_path.to_str().unwrap()).unwrap();
        assert!(file_exists(file_path.to_str().unwrap()));
    }

    #[test]
    fn test_delete_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("file_to_delete.typ");

        write_file(file_path.to_str().unwrap(), "To be deleted").unwrap();
        delete_file(file_path.to_str().unwrap()).unwrap();
        assert!(!file_exists(file_path.to_str().unwrap()));
    }

}