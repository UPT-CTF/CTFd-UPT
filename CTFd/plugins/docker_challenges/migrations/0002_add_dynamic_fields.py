revision = "docker_dynamic_0002"
down_revision = None
branch_labels = None
depends_on = None

def upgrade(op=None):
    from CTFd.plugins.migrations import get_columns_for_table
    import sqlalchemy as sa
    cols = get_columns_for_table(op=op, table_name="docker_challenge", names_only=True)
    if "initial" not in cols:
        op.add_column("docker_challenge", sa.Column("initial", sa.Integer(), nullable=True))
    if "minimum" not in cols:
        op.add_column("docker_challenge", sa.Column("minimum", sa.Integer(), nullable=True))
    if "decay" not in cols:
        op.add_column("docker_challenge", sa.Column("decay", sa.Integer(), nullable=True))
    if "function" not in cols:
        op.add_column("docker_challenge", sa.Column("function", sa.String(length=32), nullable=True))
        conn = op.get_bind()
        url = str(conn.engine.url)
        if url.startswith("postgres"):
            conn.execute("UPDATE docker_challenge SET function = 'logarithmic' WHERE function IS NULL")
        else:
            conn.execute("UPDATE docker_challenge SET `function` = 'logarithmic' WHERE `function` IS NULL")

def downgrade(op=None):
    from CTFd.plugins.migrations import get_columns_for_table
    cols = get_columns_for_table(op=op, table_name="docker_challenge", names_only=True)
    if "function" in cols:
        op.drop_column("docker_challenge", "function")
    if "decay" in cols:
        op.drop_column("docker_challenge", "decay")
    if "minimum" in cols:
        op.drop_column("docker_challenge", "minimum")
    if "initial" in cols:
        op.drop_column("docker_challenge", "initial")
