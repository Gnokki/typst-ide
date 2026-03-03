use std::fs;

use typst_as_library::TypstWrapperWorld;
use typst_pdf::PdfOptions;

fn main() {
    // Afficher la version du CLI
    println!("Version du CLI: {}", env!("CARGO_PKG_VERSION"));
    println!("Note: Utilisation de la dernière version de typst disponible");
    
    let content = r#"
#import "@preview/lovelace:0.3.0": *

#set text(
    font: "Fira Sans"
)

= Test test
#pseudocode-list[
  + do something
  + do something else
  + *while* still something to do
    + do even more
    + *if* not done yet *then*
      + wait a bit
      + resume working
    + *else*
      + go home
    + *end*
  + *end*
]

"#
    .to_owned();

    // All the abstraction needed is here (!)
    let world = TypstWrapperWorld::new("./examples".to_owned(), content.to_owned());

    // Render document
    let document = typst::compile(&world)
        .output
        .expect("Error compiling typst");

    // Output to pdf
    let pdf = typst_pdf::pdf(&document, &PdfOptions::default()).expect("Error exporting PDF");
    fs::write("./output.pdf", pdf).expect("Error writing PDF.");
}