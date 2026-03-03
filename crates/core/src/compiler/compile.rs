use std::env;
use std::fs;

use typst::diag::SourceDiagnostic;
use typst::layout::PagedDocument;
use typst_as_library::TypstWrapperWorld;
use typst_pdf::PdfOptions;

/// Returns the current working directory as a String, falling back to ".".
fn current_dir() -> String {
    env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .to_string_lossy()
        .to_string()
}

/// Formats a slice of Typst diagnostics into a single user-facing string.
fn format_diagnostics(diagnostics: &[SourceDiagnostic]) -> String {
    diagnostics
        .iter()
        .map(|d| d.message.to_string())
        .collect::<Vec<_>>()
        .join("\n")
}

/// Creates a default world (paged target) with the given content.
pub fn create_default_world(content: &str) -> TypstWrapperWorld {
    TypstWrapperWorld::new(current_dir(), content.to_owned())
}

/// Creates a world configured for HTML export (`Feature::Html` enabled).
pub fn create_html_world(content: &str) -> TypstWrapperWorld {
    TypstWrapperWorld::new_for_html(current_dir(), content.to_owned())
}

/// Creates a world rooted at a custom path.
pub fn create_world_with_root(root: &str, content: &str) -> TypstWrapperWorld {
    TypstWrapperWorld::new(root.to_owned(), content.to_owned())
}

/// Compiles Typst source to a preview HTML document.
///
/// Each page is rendered as a full-fidelity inline SVG (via `typst-svg`), so
/// all Typst features — including math equations — are rendered correctly.
/// The SVGs are wrapped in a minimal styled HTML page ready to be loaded in
/// an iframe.
pub fn compile_to_preview_html(content: &str) -> Result<String, String> {
    let world = create_default_world(content);

    let document: PagedDocument = typst::compile(&world)
        .output
        .map_err(|errors| format_diagnostics(&errors))?;

    let pages_html: String = document
        .pages
        .iter()
        .map(|page| format!("<div class=\"page\">{}\n</div>", typst_svg::svg(page)))
        .collect::<Vec<_>>()
        .join("\n");

    Ok(format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      gap: 1.5rem;
    }}
    .page {{
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }}
    .page svg {{
      display: block;
      max-width: 100%;
      height: auto;
    }}
  </style>
</head>
<body>
{pages_html}
</body>
</html>
"#
    ))
}

/// Compiles a Typst document to PDF and writes it to the specified output path.
/// # Arguments
/// * `world` - A reference to the `TypstWrapperWorld` containing the document and environment settings.
/// * `output` - A reference to a `std::path::Path` where the compiled PDF should be written.
/// # Returns
/// * `Warned<SourceResult<typst::Document>>` containing the result of the compilation process, or an error if the compilation fails.
pub fn compile(world: &TypstWrapperWorld, output: &std::path::Path) -> Result<(), Box<dyn std::error::Error>> {
    let document = typst::compile(world)
        .output
        .expect("Error compiling typst");

    let pdf = typst_pdf::pdf(&document, &PdfOptions::default()).expect("Error exporting PDF");
    fs::write(output, pdf).expect("Error writing PDF.");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use pdf_extract::extract_text;

    #[test]
    fn test_compile() {
        let dir = tempdir().unwrap();
        let content = "= Writing a test".to_owned();
        
        let world = create_default_world(&content);
        let output_path = dir.path().join("test_output.pdf");
        
        let result = compile(&world, &output_path);
        assert!(result.is_ok());

        let extracted_text = extract_text(&output_path).expect("Error extracting text from PDF");
        assert!(extracted_text.contains("Writing a test"));
    }

}