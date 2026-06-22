import asyncio
from app.models.base import AsyncSessionLocal
from app.models.document import Document
from sqlalchemy import select


async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Document))
        docs = result.scalars().all()
        print(f"Total documents in DB: {len(docs)}")
        for doc in docs:
            print(f"- Name: {doc.original_name} | ID: {doc.id} | Status: {doc.status} | Errors: {doc.error_message}")


if __name__ == "__main__":
    asyncio.run(main())
