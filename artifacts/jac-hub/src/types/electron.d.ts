interface ElectronAPI {
  notify: (title: string, body: string) => void;
  platform: "darwin" | "win32" | "linux";
  version: string;
  isElectron: true;
}

interface Window {
  electronAPI?: ElectronAPI;
}
