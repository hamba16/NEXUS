import asyncio
import os
import sys

from dotenv import load_dotenv
import uvicorn

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv(".env.local")
load_dotenv(".env", override=False)

api_dir = os.path.abspath("services/api")
root_dir = os.path.abspath(".")
for path in (api_dir, root_dir):
    if path not in sys.path:
        sys.path.insert(0, path)
os.environ["PYTHONPATH"] = api_dir + os.pathsep + os.environ.get("PYTHONPATH", "")

async def serve() -> None:
    config = uvicorn.Config(
        "nexus.main:app",
        host=os.getenv("API_HOST", "127.0.0.1"),
        port=int(os.getenv("API_PORT", "8000")),
        loop="asyncio",
    )
    await uvicorn.Server(config).serve()


asyncio.run(serve(), loop_factory=asyncio.SelectorEventLoop)
