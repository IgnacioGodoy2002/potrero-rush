from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser

root = Path(__file__).resolve().parent / "app" / "public"
url = "http://127.0.0.1:8080"
try:
    server = ThreadingHTTPServer(("127.0.0.1", 8080), partial(SimpleHTTPRequestHandler, directory=str(root)))
except OSError as error:
    print("No se pudo iniciar el servidor. Revisa que el puerto 8080 este libre.")
    print(error)
    raise SystemExit(1)
print("POTRERO RUSH V6 - " + url)
print("Deja esta ventana abierta. Ctrl+C para cerrar.")
Timer(0.5, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
