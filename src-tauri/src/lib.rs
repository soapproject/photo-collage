use base64::{engine::general_purpose, Engine as _};
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn save_png(app: AppHandle, data_url: String, default_name: String) -> Result<bool, String> {
    let prefix = "data:image/png;base64,";
    let b64 = data_url
        .strip_prefix(prefix)
        .ok_or_else(|| "invalid data url".to_string())?;
    let bytes = general_purpose::STANDARD
        .decode(b64.as_bytes())
        .map_err(|e| e.to_string())?;

    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter("PNG", &["png"])
        .save_file(move |path| {
            let _ = tx.send(path);
        });
    let chosen = rx.recv().map_err(|e| e.to_string())?;

    let Some(path) = chosen else {
        return Ok(false);
    };
    let path_buf = path
        .into_path()
        .map_err(|e| format!("invalid save path: {e}"))?;
    std::fs::write(&path_buf, &bytes).map_err(|e| e.to_string())?;
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_png])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
