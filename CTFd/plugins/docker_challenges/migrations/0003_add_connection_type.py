revision = "docker_dynamic_0003"
down_revision = "docker_dynamic_0002"
branch_labels = None
depends_on = None

def upgrade(op=None):
    from CTFd.plugins.migrations import get_columns_for_table
    import sqlalchemy as sa
    cols = get_columns_for_table(op=op, table_name="docker_challenge", names_only=True)
    if "connection_type" not in cols:
        op.add_column("docker_challenge", sa.Column("connection_type", sa.String(length=16), nullable=True))
        conn = op.get_bind()
        url = str(conn.engine.url)
        if url.startswith("postgres"):
            conn.execute("UPDATE docker_challenge SET connection_type = 'generic' WHERE connection_type IS NULL")
        else:
            conn.execute("UPDATE docker_challenge SET `connection_type` = 'generic' WHERE `connection_type` IS NULL")

def downgrade(op=None):
    from CTFd.plugins.migrations import get_columns_for_table
    cols = get_columns_for_table(op=op, table_name="docker_challenge", names_only=True)
    if "connection_type" in cols:
        op.drop_column("docker_challenge", "connection_type")
