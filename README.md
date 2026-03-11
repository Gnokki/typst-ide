# Typst IDE

[Typst Studio](https://gitlab.com/gnoooo/typst_studio), rebuilt with Tauri and Rust.
Harder. Better. Faster. Stronger.

![banner](./images/banner.png)

A modern local Typst editor (not a lie anymore, since Electron has been replaced with Tauri), with an intuitive writing experience.

# Preview
![preview](./images/preview.png)

# Installation
## Users
Check out the ![releases](https://github.com/gnoooo/typst-ide/releases) page for the latest version.

Currently, there is two versions available: 
- Linux with AppImage (may not work well, there can be compatibility issues due to graphical backends)
- Windows with setup executable
- Maybe MacOS in the future? 

## Developers
### Prerequisites
- Rust + Cargo
- Node.js + npm
- Tauri CLI : ```bash cargo install tauri-cli```

### Setup
Clone this repository:
```sh
git clone https://gitlab.com/gnoooo/typst-ide
cd typst-ide
```

Since I didn't pushed the whole repository, we neet to initialize some things:
1. NPM
    ```bash
    cd frontend && npm install
    npm run build:css # not necessary: everytime the app build, it generate the CSS
    npm run postinstall # to convert Monaco Editor (which use web workers) to an ESM module
    ```
2. Cargo
    ```bash
    # if you are in frontend/
    cd ../crates/app
    cargo tauri build # then pray
    ```
### Build the app
To build the app (into an AppImage for Linux and a setup executable for Windows), we have to:
1. Compile CSS and build the frontend:
    ```bash
    cd frontend/
    npm run build   # => npm run build:css && vite build dist
    ```
2. Build the app (it's long...):
    - Windows
        ```bash
        cd crates/app/
        cargo tauri build --target x86_64-pc-windows-gnu
        ```
    - Linux
        ```bash
        cd crates/app/
        NO_STRIP=1 cargo tauri build --target x86_64-unknown-linux-gnu
        ```
        - `NO_STRIP=1` helps avoid the `failed to bundle project \`failed to run linuxdeploy\`` error
3. The executables files will be in:
    - Linux : `$HOME/path/to/typst-ide/target/x86_64_unknown-linux-gnu/release/bundle/appimage/Typst IDE_x.y.z_amd64.AppImage`
    - Windows : `$HOME/path/to/typst-ide/target/x86_64-pc-windows-gnu/bundle/nsis/Typst IDE_x.y.z_x64-setup.exe`

# Usage
## Typical workflow
When you first open the app, you'll see two windows:
![First open](https://raw.githubusercontent.com/gnoooo/typst-ide/refs/heads/main/images/walkthrought1.gif)

On the left, you'll find the editor, where you can write your Typst documents.
On the right, you'll find the preview, where you can see how your document looks like. You can now start typing your document, and the preview will update automatically as you type.

![Typing](https://raw.githubusercontent.com/gnoooo/typst-ide/refs/heads/main/images/walkthrought2.gif)

But as you can see, on the top left, there are two buttons blinking:
- The blue one on the left, will prompt you to create a new project, by entering a name and a path. No worries, what you have typed so far will be saved in the created project.
- The orange one on the right, will prompt you to open an existing project. 


When a project is opened, or saved, the buttons will stop blinking (and the project creation button will be hidden), it's just a reminder so you open or create your project, so the auto-save feature works correctly.

As you may have noticed, another button is also visible: the notepad button. This button will open a notepad windows, where you can write snippets of text that you can reuse in your Typst documents.


## Notepad

The notepad is a simple text editor where you can write snippets of text that you can reuse in your Typst documents.

The notes have to scopes:
- **Global**: notes that are available across all projects.
- **Project**: notes that are only available in the current project.

You can delete, edit and preview a entire note using the buttons on the right side of each note.


# Philosophy
In the next paragraphs, I will refer to the official online Typst platform as "**Typst.app**".

## Why an editor?
Before we begin, I need to explain why I started again the project of a local Typst editor. 

The main reason is that I think some people prefer to have a local editor that runs as an app on their PC, even though ([Typst.app](https://typst.app)) is extremelly powerful. The official editor allows users to create or edit documents, collaboratively or not, with files stored online. 

However, some people feel more comfortable keeping their data in their hands, which is sometimes my case as well. But beyond that, sometimes there are situations where we just want to create small documents that don't need to be stored in the cloud. A local editor running directly on a PC, without requiring internet access, becomes a very practical solution.

## Why starting again?
First of all: I was **wrong**.

Between the beginning of this project and now, both my mindset and goal for this project have changed. 

At the beginning, I simply wanted to create a local editor with features that Typst.app doesn't provide, such as:
- Template creation
- Advanced LaTeX implementation (with SVG image)
- Mermaid.js support (also with SVG image inserted)
- And more

At the time, Electron seemed like the best choice, and all of those features were useful initially. However, as I kept adding more and more functionality, the project gradually became heavy and difficult to understand (even for me, its creator). 

I made many structural changes, spliting the code into more and more files. I wanted to make everything perfect, but I just made it even worse.

Then one day, a friend saw the app thought it looked cool. When he asked me what I had used to build it and I answered "**Electron**" he made a rather disgusted face and told me about Tauri. And I must admit it: I was tempted

The idea of restarting the project using Rust slowly became more and more appealing.

And you know what? It makes much more sense to build this kind of application in Rust. Previously, I was simply calling the Typst compiler through its CLI, which prevented me from tweaking it or using it to its fully. But Typst itself is written in Rust, which is perfect: it means we can directly use its crates and access the compilation functions.

As I'm writing this (2026-03-05), I'm **not** an expert in Rust, and in fact, this is my first time using it. I will sometimes rely on AI to help me, probably breaking things, rebuild them, and keep iterating until I fully understand the code and call it my own. 

I'm not here to propose a professionnal-grade app, just here to learn a new programming language. So if things are not perfect, please forgive me (I'm open to suggestions tho!).

## Guidelines of the project
To avoid losing focus again, I'm defining a few guidlines for the project.

### 1. Fully compatible
Typst IDE will be compatible with projects created with Typst.app (which will be simple since I'm using the same compiler). 

This differs from Typst Studio, which initially aimed for cross-platform compatibility but eventually diverged and became non-reversible. 

### 2. Technical simplicity
I will try to keep this project simple, and keep it that way. 

Previously, I thought simplicity meant small files, splitted, but I only made the project more and more complicated by introducing too much configurability. From now on, configuration will be kept to what is strictly necessary, so the project doesn't become unnecessarily complex.

### 3. Simple features, but useful ones
The goal is to add useful and powerful features, without making them overly complicated. 

For example, I plan to implement a note-pad feature that lets users save reusable elements within a project (or globally in the application), such as:
- a specific `@import` module regularly used
- a reusable function between multiple project
- a document template

Nothing complicated, but potentially very useful.

## Special thanks
A special thanks to the **Typst team** for providing such a wonderful tool! Perfect for people like me who are intimidated by complex (but yet powerful) languages like LaTeX for writing academic and professionnal documents.\
https://github.com/typst/typst


Thanks as well to **tfatchmann** for his examples and implementation of Typst's crates. I will rely on them until I fully understand how the Typst compiler works internally (world, etc.).\
https://github.com/tfachmann/typst-as-library
