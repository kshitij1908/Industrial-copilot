import asyncio
from app.models.base import init_db, AsyncSessionLocal
from app.models.user import User
from app.api.auth import get_password_hash
from sqlalchemy import select


async def main():
    print("Initializing database...")
    await init_db()
    async with AsyncSessionLocal() as session:
        print("Checking for admin user...")
        result = await session.execute(select(User).where(User.username == "admin"))
        user = result.scalar_one_or_none()
        if not user:
            print("Seeding default admin user...")
            admin_user = User(
                username="admin",
                hashed_password=get_password_hash("admin"),
                email="admin@example.com",
                full_name="Administrator",
                is_active=True,
            )
            session.add(admin_user)
            await session.commit()
            print("Seeded default admin user successfully!")
        else:
            print(f"Admin user already exists: {user.username}")


if __name__ == "__main__":
    asyncio.run(main())
