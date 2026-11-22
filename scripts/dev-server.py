"""Serve the local app without retaining stale browser copies."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    directory = Path(__file__).resolve().parent.parent / "dist"
    handler = partial(PreviewHandler, directory=str(directory))
    with ThreadingHTTPServer(("127.0.0.1", 4173), handler) as server:
        print("MoonFOD preview: http://127.0.0.1:4173 (browser caching disabled)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
