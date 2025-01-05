# Simple Task

A Orca Note plugin that provides the ability to create tasks.

It also serves as a template for creating Orca Note plugins.

![image](https://github.com/user-attachments/assets/eb2f7bd7-d420-4352-93a7-249bed7808e2)

## Usage

1. Download the zip file from the [releases page](https://github.com/sethyuan/orca-bullet-threading/releases) and extract it into Orca Note's `plugins` directory.
2. Start/restart Orca Note, enable the plugin under the app's settings.
3. Hit 'Alt+Enter' on any block you want to make it a task, the plugin will apply a task tag for you automatically and when you hit 'Alt+Enter' again, it will toggle the task status as well as updating the times for you.

## Development Setup

1. Place the the project's folder into Orca Note's `plugins` directory (Orca Note's directory is located under your user's documents directory, e.g. `/Users/username/Documents/orca`, `C:\Users\username\Documents\orca`).

2. Run `pnpm build` on the project's root directory to build the plugin.

3. Start/restart Orca Note, you'll find the plugin under the app's settings, enable the plugin and you're good to go.

4. Hit 'Alt+Enter' on any block you want to make it a task, the plugin will apply a task tag for you automatically and when you hit 'Alt+Enter' again, it will toggle the task status as well as updating the times for you.
